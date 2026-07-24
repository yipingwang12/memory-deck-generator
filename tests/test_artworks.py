"""Tests for the Wikidata artworks fetch + query builder."""

from __future__ import annotations

from unittest.mock import MagicMock, Mock, patch

from deck_generator.artworks import Artwork, build_query, fetch_artworks


def _binding(qid, title, creator_qid, creator, img="http://img/x.jpg", sitelinks=50, inception=None):
    b = {
        "work": {"value": f"http://www.wikidata.org/entity/{qid}"},
        "workLabel": {"value": title},
        "creator": {"value": f"http://www.wikidata.org/entity/{creator_qid}"},
        "creatorLabel": {"value": creator},
        "img": {"value": img},
        "sitelinks": {"value": str(sitelinks)},
    }
    if inception is not None:
        b["inception"] = {"value": inception}
    return b


def _mock_session(bindings):
    resp = Mock()
    resp.json.return_value = {"results": {"bindings": bindings}}
    resp.raise_for_status.return_value = None
    session = MagicMock()
    session.get.return_value = resp
    return session


def _fetch(bindings, config=None):
    with patch("deck_generator.wikidata.requests.Session", return_value=_mock_session(bindings)):
        return fetch_artworks(config or {"source": "wikidata"})


class TestFetch:
    def test_parses_rows(self):
        arts = _fetch([_binding("Q12418", "Mona Lisa", "Q762", "Leonardo da Vinci",
                                 sitelinks=146, inception="1503-01-01T00:00:00Z")])
        assert arts == [Artwork("Q12418", "Mona Lisa", "Leonardo da Vinci", "Q762",
                                "http://img/x.jpg", 146, 1503)]

    def test_dedupes_by_qid_keeping_first(self):
        # two P18 images on one work → two rows, one Artwork
        arts = _fetch([
            _binding("Q12418", "Mona Lisa", "Q762", "Leonardo da Vinci", img="http://img/a.jpg"),
            _binding("Q12418", "Mona Lisa", "Q762", "Leonardo da Vinci", img="http://img/b.jpg"),
        ])
        assert len(arts) == 1 and arts[0].image_url == "http://img/a.jpg"

    def test_drops_unlabelled_title_keeps_unlabelled_creator_as_anon(self):
        arts = _fetch([
            _binding("Q1", "Q999999", "Q762", "Leonardo"),      # title = Q-number → drop the work
            _binding("Q2", "Real Title", "Q5", "Q888888"),      # creator = Q-number → keep, anon
            _binding("Q3", "Good", "Q7", "Real Painter"),
        ])
        assert [a.qid for a in arts] == ["Q2", "Q3"]
        anon = next(a for a in arts if a.qid == "Q2")
        assert anon.creator == "" and anon.creator_qid == ""

    def test_unknown_value_creator_kept_as_anonymous(self):
        # Wikidata 'unknown value' P170 → a blank-node genid URI in both creator + creatorLabel.
        b = _binding("Q546241", "Theotokos of Vladimir", "x", "x")
        genid = "http://www.wikidata.org/.well-known/genid/8ae9eff5d369995d380e8b3a3c59c98e"
        b["creator"]["value"] = genid
        b["creatorLabel"]["value"] = genid
        arts = _fetch([b])
        assert len(arts) == 1
        assert arts[0].title == "Theotokos of Vladimir" and arts[0].creator == ""

    def test_drops_work_whose_title_is_a_uri(self):
        b = _binding("Q1", "http://www.wikidata.org/.well-known/genid/deadbeef", "Q2", "C")
        assert _fetch([b]) == []

    def test_skips_missing_image(self):
        b = _binding("Q1", "T", "Q2", "C")
        del b["img"]
        assert _fetch([b]) == []

    def test_bce_inception(self):
        arts = _fetch([_binding("Q1", "T", "Q2", "C", inception="-0450-01-01T00:00:00Z")])
        assert arts[0].inception == -450

    def test_unknown_value_inception_is_none_not_crash(self):
        # P571 'unknown value' surfaces as a genid URL — must not crash the fetch
        arts = _fetch([_binding("Q1", "T", "Q2", "C",
                                inception="http://www.wikidata.org/.well-known/genid/abc")])
        assert arts[0].inception is None


class TestQuery:
    def test_wikidata_mode_uses_threshold(self):
        q = build_query({"source": "wikidata", "min_sitelinks": 40})
        assert "wdt:P31 wd:Q3305213" in q and "?sitelinks >= 40" in q

    def test_build_query_per_instance_override(self):
        # multi-media configs query one type at a time (merged in fetch_artworks)
        cfg = {"source": "wikidata", "instance_of": ["Q3305213", "Q860861", "Q93184"]}
        assert "wdt:P31 wd:Q3305213" in build_query(cfg)                 # default = first
        assert "wdt:P31 wd:Q860861" in build_query(cfg, "Q860861")       # override
        assert "wdt:P31 wd:Q93184" in build_query(cfg, "Q93184")

    def test_curated_mode_lists_values(self):
        q = build_query({"source": "curated", "works": ["Q12418", "Q45585"]})
        assert "VALUES ?work { wd:Q12418 wd:Q45585 }" in q

    def test_collection_mode(self):
        q = build_query({"source": "collection", "collection": "Q19675"})
        assert "wdt:P195 wd:Q19675" in q

    def test_limit_is_client_side_not_in_query(self):
        # limit + fame ordering happen client-side after banded fetch (no ORDER BY / LIMIT in SPARQL)
        q = build_query({"source": "wikidata", "limit": 30})
        assert "LIMIT" not in q and "ORDER BY" not in q

    def test_band_filter(self):
        q = build_query({"source": "wikidata"}, band=(20, 40))
        assert "?sitelinks >= 20 && ?sitelinks < 40" in q
        assert "?sitelinks >= 5" in build_query({"source": "wikidata", "min_sitelinks": 5}, band=(5, None))
