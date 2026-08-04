"""Fetch and cache Wikisource page text — poems Project Gutenberg does not carry.

Gutenberg's catalogue is patchy for 20th-century European verse still in copyright at the
time PG digitised its author (Rilke's *Duineser Elegien*, 1923, is the case that forced
this module). Wikisource carries proofread transcriptions of those first editions.

The poem body lives in a ``<poem>`` block, one source line per verse line, so extraction
is: take the block, strip the transcription markup, hand the plain lines to
``poetry_parser.extract_poem`` exactly as a Gutenberg text would be.
"""

from __future__ import annotations

import re
from pathlib import Path

import requests

_API = "https://{lang}.wikisource.org/w/api.php"
_CACHE_DIR = Path(__file__).parent.parent.parent / "cache" / "wikisource"

# Wikimedia enforces its User-Agent policy here as on the image CDN: the default
# `requests` UA 403s, and so would a placeholder one. Needs a real identifying URL.
_UA = ("memory-quiz-poetry/0.1 (https://github.com/yipingwang12/memory-deck-generator;"
       " educational personal project)")

# Scan-apparatus and layout templates that carry no verse text. {{Zeile|N}} is a
# line-number marker glued to the FRONT of every fifth line ("{{Zeile|5}}als des
# Schrecklichen Anfang,"), so it must be dropped without eating the line; {{Seite|N}} sits
# alone on a page-break line; {{idt}} takes NO argument and repeats to indent a line
# ("{{idt}}{{idt}}{{idt}}{{idt}}Verhalt ihn..."), so the pattern must allow a bare
# template — requiring a `|` silently left these in the verse.
_DROP_TEMPLATES = ('Zeile', 'Seite', 'WsRed', 'idt')
# Formatting templates whose single argument IS verse text and must survive.
_UNWRAP_TEMPLATES = ('SperrSchrift', 'center', 'centered', 'nowrap', 'small')


def _strip_markup(body: str) -> str:
    """Wikisource transcription markup → plain verse lines."""
    text = body
    for name in _UNWRAP_TEMPLATES:                       # {{SperrSchrift|noch}} -> noch
        text = re.sub(r'\{\{' + name + r'\|([^{}]*)\}\}', r'\1', text, flags=re.IGNORECASE)
    for name in _DROP_TEMPLATES:                         # {{Zeile|5}} / {{idt}} -> ''
        text = re.sub(r'\{\{' + name + r'(\|[^{}]*)?\}\}', '', text, flags=re.IGNORECASE)
    text = re.sub(r'\[\[[^\]|]*\|([^\]]*)\]\]', r'\1', text)   # [[Target|shown]] -> shown
    text = re.sub(r'\[\[([^\]]*)\]\]', r'\1', text)            # [[Word]] -> Word
    text = re.sub(r"'{2,}", '', text)                          # '''bold''' / ''italic''
    text = re.sub(r'<[^>]+>', '', text)                        # <br />, <big>, refs
    return text


def poem_text(wikitext: str) -> str:
    """Plain verse lines from a page's wikitext (the ``<poem>`` block, markup stripped).

    Falls back to the whole page when a transcription omits the ``<poem>`` wrapper, so a
    marker-based extraction can still find its lines rather than failing on an empty body.
    """
    match = re.search(r'<poem>(.*?)</poem>', wikitext, flags=re.DOTALL | re.IGNORECASE)
    body = match.group(1) if match else wikitext
    return '\n'.join(line.rstrip() for line in _strip_markup(body).splitlines())


def fetch_wikitext(page: str, lang: str = 'de', cache_dir: Path = _CACHE_DIR) -> str:
    """Return a Wikisource page's raw wikitext, downloading and caching on first call."""
    cache_dir = Path(cache_dir) / lang
    cache_dir.mkdir(parents=True, exist_ok=True)
    cached = cache_dir / f"{re.sub(r'[^0-9A-Za-zÀ-ÿ]+', '_', page)}.wikitext"
    if cached.exists():
        return cached.read_text(encoding='utf-8')
    resp = requests.get(_API.format(lang=lang), timeout=30, headers={'User-Agent': _UA}, params={
        'action': 'parse', 'page': page, 'prop': 'wikitext', 'format': 'json',
        'formatversion': '2',
    })
    resp.raise_for_status()
    payload = resp.json()
    if 'error' in payload:
        raise ValueError(f"Wikisource page {page!r} ({lang}): {payload['error'].get('info', '?')}")
    text = payload['parse']['wikitext']
    cached.write_text(text, encoding='utf-8')
    return text


def fetch_text(page: str, lang: str = 'de', cache_dir: Path = _CACHE_DIR) -> str:
    """Plain verse text of a Wikisource page — the Gutenberg ``fetch_text`` counterpart."""
    return poem_text(fetch_wikitext(page, lang=lang, cache_dir=cache_dir))
