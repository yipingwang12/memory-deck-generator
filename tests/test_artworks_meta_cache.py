"""Tests for the persisted SPARQL metadata cache.

The banded sweep dominates an artwork export (~10 of ~12 min) while being invariant to what
actually changes between runs. Caching it is the big win — and the big risk: the equations pool
cache's lesson is that a stale cache silently serving old data is worse than a slow rebuild. So
these tests are mostly about *invalidation*, not about the happy path.
"""

from __future__ import annotations

import json
from unittest.mock import MagicMock, Mock, patch

import pytest

from deck_generator import artworks as art
from deck_generator.artworks import Artwork, fetch_artworks_cached


def _binding(qid, title, creator_qid, creator, sitelinks=50):
    return {
        "work": {"value": f"http://www.wikidata.org/entity/{qid}"},
        "workLabel": {"value": title},
        "creator": {"value": f"http://www.wikidata.org/entity/{creator_qid}"},
        "creatorLabel": {"value": creator},
        "img": {"value": "http://img/x.jpg"},
        "sitelinks": {"value": str(sitelinks)},
    }


class _Session:
    """Counts how many SPARQL round-trips actually happen."""

    def __init__(self, bindings):
        self.bindings, self.calls = bindings, 0

    def __call__(self, *a, **kw):
        self.calls += 1
        resp = Mock()
        resp.json.return_value = {"results": {"bindings": self.bindings}}
        resp.raise_for_status.return_value = None
        s = MagicMock()
        s.get.return_value = resp
        return s


@pytest.fixture
def cache(tmp_path):
    return tmp_path / "artworks_meta.json"


def _fetch(cfg, cache, session, **kw):
    with patch("deck_generator.wikidata.requests.Session", session):
        return fetch_artworks_cached(cfg, cache_path=cache, **kw)


CFG = {"source": "curated", "works": ["Q12418"]}


class TestCaching:
    def test_second_call_does_not_hit_the_network(self, cache):
        s = _Session([_binding("Q12418", "Mona Lisa", "Q762", "Leonardo da Vinci")])
        first = _fetch(CFG, cache, s)
        after = s.calls
        second = _fetch(CFG, cache, s)
        assert s.calls == after            # served from disk
        assert first == second             # and identical, field for field

    def test_roundtrip_preserves_tuple_fields(self, cache):
        # creator_candidates is a tuple of tuples; JSON flattens both to lists, and an Artwork
        # that came back as lists would compare unequal and break dedup/equality downstream.
        s = _Session([_binding("Q1", "W", "Q9", "Painter")])
        _fetch(CFG, cache, s)
        got = _fetch(CFG, cache, s)[0]
        assert got.creator_candidates == (("Q9", "Painter"),)
        assert isinstance(got, Artwork)


class TestInvalidation:
    """Everything that can change the fetch must change the key."""

    @pytest.mark.parametrize("mutation", [
        {"min_sitelinks": 99},
        {"limit": 5},
        {"instance_of": ["Q860861"]},
        {"source": "wikidata"},
        {"works": ["Q45585"]},
        {"collection": "Q19675"},
    ])
    def test_query_affecting_change_busts_the_cache(self, cache, mutation):
        s = _Session([_binding("Q1", "W", "Q9", "P")])
        _fetch(CFG, cache, s)
        before = s.calls
        _fetch({**CFG, **mutation}, cache, s)
        assert s.calls > before

    @pytest.mark.parametrize("key", ["corrections", "distractors", "image_px", "cache_only",
                                     "deck_name", "group", "image_workers"])
    def test_post_fetch_change_reuses_the_cache(self, cache, key):
        # These are applied to the results, not to the query — re-querying for them would
        # defeat the whole point (a one-line correction must not cost a 10-minute sweep).
        s = _Session([_binding("Q1", "W", "Q9", "P")])
        _fetch(CFG, cache, s)
        before = s.calls
        _fetch({**CFG, key: "anything"}, cache, s)
        assert s.calls == before

    def test_unknown_new_config_key_busts_the_cache(self, cache):
        # The key is built by EXCLUSION, so a knob added later defaults to invalidating rather
        # than being silently ignored. Getting this backwards is how a cache ships wrong data.
        s = _Session([_binding("Q1", "W", "Q9", "P")])
        _fetch(CFG, cache, s)
        before = s.calls
        _fetch({**CFG, "some_future_filter": True}, cache, s)
        assert s.calls > before

    def test_engine_version_bump_busts_the_cache(self, cache, monkeypatch):
        # The guard for "we fixed the parser but kept serving results from the old one".
        s = _Session([_binding("Q1", "W", "Q9", "P")])
        _fetch(CFG, cache, s)
        before = s.calls
        monkeypatch.setattr(art, "_META_ENGINE_VERSION", "v2-something-changed")
        _fetch(CFG, cache, s)
        assert s.calls > before

    def test_refresh_bypasses_and_rewrites(self, cache):
        s = _Session([_binding("Q1", "Old Title", "Q9", "P")])
        _fetch(CFG, cache, s)
        s.bindings = [_binding("Q1", "New Title", "Q9", "P")]
        assert _fetch(CFG, cache, s, refresh=True)[0].title == "New Title"
        assert _fetch(CFG, cache, s)[0].title == "New Title"   # rewrote, didn't just skip


class TestDegradesGracefully:
    """A broken cache must never be able to break an export."""

    def test_corrupt_cache_falls_back_to_fetching(self, cache):
        cache.write_text("{ not json")
        s = _Session([_binding("Q1", "W", "Q9", "P")])
        assert len(_fetch(CFG, cache, s)) == 1

    def test_unwritable_cache_still_returns_results(self, tmp_path):
        s = _Session([_binding("Q1", "W", "Q9", "P")])
        blocked = tmp_path / "file-not-a-dir" / "meta.json"
        blocked.parent.write_text("I am a file")
        assert len(_fetch(CFG, blocked, s)) == 1

    def test_cache_is_per_config_not_global(self, cache):
        s = _Session([_binding("Q1", "W", "Q9", "P")])
        _fetch(CFG, cache, s)
        _fetch({"source": "curated", "works": ["Q2"]}, cache, s)
        assert len(json.loads(cache.read_text())) == 2   # both entries coexist
