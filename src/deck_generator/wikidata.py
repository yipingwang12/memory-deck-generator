"""Wikidata SPARQL client — fetches award laureates as (year, name) entries."""

from __future__ import annotations

import time

import requests

from .list_parser import Entry

_SPARQL_URL = "https://query.wikidata.org/sparql"

_HUMAN_FILTER = "  ?person wdt:P31 wd:Q5 .\n"

_COUNT_QUERY = """\
SELECT (COUNT(?stmt) AS ?count) WHERE {{
{human_filter}  ?person p:P166 ?stmt .
  ?stmt ps:P166 wd:{item_id} .
}}
"""

_QUERY = """\
SELECT ?personLabel ?year WHERE {{
{human_filter}  ?person p:P166 ?stmt .
  ?stmt ps:P166 wd:{item_id} .
  ?stmt pq:P585 ?date .
  BIND(YEAR(?date) AS ?year)
  SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en" }}
}}
ORDER BY ?year ?personLabel
"""


_RETRY_STATUS = {429, 500, 502, 503, 504}
# ValueError covers json.JSONDecodeError — WDQS occasionally returns a 200 with a truncated or
# partial body under load; a retry gets a clean response. Treated as transient, not fatal.
_TRANSIENT = (requests.Timeout, requests.ConnectionError,
              requests.exceptions.ChunkedEncodingError, ValueError)


def _sparql_session(sparql_url: str, query: str, *, attempts: int = 6, base_delay: float = 2.0):
    """Run a SPARQL query, retrying transient failures with exponential backoff.

    The public WDQS endpoint flakily returns 504/429 on fame-scan queries depending on server
    load — the same query succeeds moments later — so a single failure must not be fatal. Only
    transient errors (5xx/429, timeouts, dropped connections) are retried; a 4xx (bad query)
    raises immediately.
    """
    session = requests.Session()
    session.headers["User-Agent"] = (
        "DeckGenerator/0.1 (educational; contact: memory-deck-generator@example.com)"
    )
    last: Exception | None = None
    for k in range(attempts):
        try:
            resp = session.get(sparql_url, params={"query": query, "format": "json"}, timeout=70)
            if resp.status_code in _RETRY_STATUS:
                last = requests.HTTPError(f"{resp.status_code} {resp.reason}", response=resp)
            else:
                resp.raise_for_status()
                return resp.json()["results"]["bindings"]
        except _TRANSIENT as e:
            last = e
        if k < attempts - 1:
            time.sleep(base_delay * (2 ** k))
    raise last


def count_laureates(item_id: str, sparql_url: str = _SPARQL_URL, humans_only: bool = False) -> int:
    """Count all recipients of an award in Wikidata, regardless of date qualifier."""
    human_filter = _HUMAN_FILTER if humans_only else ""
    bindings = _sparql_session(sparql_url, _COUNT_QUERY.format(item_id=item_id, human_filter=human_filter))
    return int(bindings[0]["count"]["value"]) if bindings else 0


def fetch_entries(item_id: str, sparql_url: str = _SPARQL_URL, humans_only: bool = False) -> list[Entry]:
    """Fetch award laureates from Wikidata for the given item Q-number."""
    human_filter = _HUMAN_FILTER if humans_only else ""
    bindings = _sparql_session(sparql_url, _QUERY.format(item_id=item_id, human_filter=human_filter))
    entries = []
    for b in bindings:
        name = b.get("personLabel", {}).get("value", "")
        year_str = b.get("year", {}).get("value", "")
        if not name or not year_str:
            continue
        # Wikidata falls back to Q-number when no English label exists — skip
        if name.startswith("Q") and name[1:].isdigit():
            continue
        entries.append(Entry(year=int(year_str), name=name))
    return entries
