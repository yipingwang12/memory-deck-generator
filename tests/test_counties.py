"""County memorization decks — acronym alignment, the three card builders, the map render."""
from __future__ import annotations

import io

import pytest
from PIL import Image

from deck_generator import counties as c


# --------------------------------------------------------------------- alignment

class TestUnits:
    def test_split_at_capitals(self):
        assert c.split_units("LvnHowLAGF") == ["Lvn", "How", "L", "A", "G", "F"]

    @pytest.mark.parametrize("unit,token,ok", [
        ("Lvn", "Livingston", True), ("Sh", "Shiawassee", True), ("How", "Howell", True),
        ("Os", "Osceola", True), ("Sh", "Saginaw", False), ("B", "Saginaw", False),
    ])
    def test_unit_fits_token_start_then_subsequence(self, unit, token, ok):
        assert c.unit_fits(unit, token) is ok

    @pytest.mark.parametrize("piece,name,ok", [
        ("B", "Bay City", True), ("SJ", "St. Joseph", True), ("LA", "L'Anse", True),
        ("SSM", "Sault Ste. Marie", True), ("MC", "Mount Clemens", True),
        ("Lvn", "Livingston", True), ("SJ", "Sturgis", False), ("BC", "Bay", False),
    ])
    def test_piece_fits_name(self, piece, name, ok):
        assert c.piece_fits(piece, name) is ok


class TestAlign:
    LEX = {"Bay City", "Saginaw", "Shiawassee", "Owosso", "Corunna", "Iron Mountain", "Iron",
           "Crystal Falls", "Iron River", "Clare", "Harrison", "Gladwin", "Osceola", "Reed City"}

    def test_multiword_name_takes_one_piece(self):
        assert c.align("BSShOC", "Bay City Saginaw Shiawassee Owosso Corunna", self.LEX) == [
            ("B", "Bay City"), ("S", "Saginaw"), ("Sh", "Shiawassee"), ("O", "Owosso"),
            ("C", "Corunna")]

    def test_known_names_beat_word_splits(self):
        got = c.align("IMICFIR", "Iron Mountain Iron Crystal Falls Iron River", self.LEX)
        assert got == [("IM", "Iron Mountain"), ("I", "Iron"), ("CF", "Crystal Falls"),
                       ("IR", "Iron River")]

    def test_known_single_words_beat_unknown_pair(self):
        got = c.align("OsRCCHCG", "Osceola Reed City Clare Harrison Clare Gladwin", self.LEX)
        assert [n for _, n in got] == ["Osceola", "Reed City", "Clare", "Harrison", "Clare",
                                       "Gladwin"]

    def test_unknown_names_prefer_fewer_segments(self):
        assert c.align("MC", "Mt. Clements", set()) == [("MC", "Mt. Clements")]

    def test_no_alignment_is_none(self):
        assert c.align("XYZ", "Bay City", self.LEX) is None


# --------------------------------------------------------------------- cards

STATE = {
    "state": "Michigan", "usps": "MI", "atlas_region": "michigan", "deck_stem": "counties_michigan",
    "groups": [
        {"members": ["Bay", "Saginaw", "Shiawassee"], "acronym": "BSShOC",
         "pieces": [["B", "Bay City"], ["S", "Saginaw"], ["Sh", "Shiawassee"], ["O", "Owosso"],
                    ["C", "Corunna"]]},
        {"members": ["Tuscola", "Sanilac"], "acronym": "TCSS",
         "pieces": [["T", "Tuscola"], ["C", "Caro"], ["S", "Sanilac"], ["S", "Sandusky"]]},
    ],
    "counties": [
        {"county": "Bay", "group": 1, "seat": "Bay City", "largest": "Bay City",
         "towns": ["Bay City", "Essexville", "Auburn"]},
        {"county": "Saginaw", "group": 1, "seat": "Saginaw", "largest": "Saginaw",
         "towns": ["Saginaw", "Frankenmuth"]},
        {"county": "Shiawassee", "group": 1, "seat": "Corunna", "largest": "Owosso",
         "towns": ["Owosso", "Durand", "Corunna", "Perry"]},
        {"county": "Tuscola", "group": 2, "seat": "Caro", "largest": "Caro",
         "towns": ["Caro", "Vassar"]},
        {"county": "Sanilac", "group": 2, "seat": "Sandusky", "largest": "Sandusky",
         "towns": ["Sandusky", "Croswell", "Marlette"]},
    ],
}


class TestValidate:
    def test_good_state_has_no_errors(self):
        assert c.validate(STATE) == []

    def test_pieces_must_spell_acronym_and_fit(self):
        bad = {**STATE, "groups": [{**STATE["groups"][0], "acronym": "BSShOX"},
                                   {**STATE["groups"][1],
                                    "pieces": [["T", "Tuscola"], ["C", "Vassar"],
                                               ["S", "Sanilac"], ["S", "Sandusky"]]}]}
        errs = c.validate(bad)
        assert any("spell" in e for e in errs) and any("Vassar" in e for e in errs)


class TestPieceCards:
    def test_one_card_per_piece_with_mark_on_its_letters(self):
        cards = c.piece_cards(STATE)
        assert len(cards) == 9
        sh = cards[2]
        assert sh.item == "counties:MI|piece|g01|p03"
        assert (sh.stem, sh.mark, sh.answer) == ("BSShOC", [2, 4], "Shiawassee")

    def test_four_distinct_choices_including_answer(self):
        for card in c.piece_cards(STATE):
            assert len(card.choices) == 4 == len(set(card.choices))
            assert card.answer in card.choices

    def test_distractors_prefer_names_the_piece_could_abbreviate(self):
        s_card = c.piece_cards(STATE)[1]          # "S" → Saginaw
        assert {"Shiawassee", "Sanilac", "Sandusky"} <= set(s_card.choices)

    def test_deterministic(self):
        assert c.piece_cards(STATE) == c.piece_cards(STATE)


class TestSeatCards:
    def test_seat_card_per_county_and_largest_only_when_different(self):
        cards = c.seat_cards(STATE)
        assert [x.item for x in cards] == [
            "counties:MI|seat|Bay", "counties:MI|seat|Saginaw", "counties:MI|seat|Shiawassee",
            "counties:MI|largest|Shiawassee", "counties:MI|seat|Tuscola",
            "counties:MI|seat|Sanilac"]

    def test_largest_card_offers_the_seat_as_a_distractor(self):
        card = next(x for x in c.seat_cards(STATE) if x.item.endswith("largest|Shiawassee"))
        assert card.answer == "Owosso" and "Corunna" in card.choices
        assert "largest city" in card.stem

    def test_choices_are_four_distinct(self):
        for card in c.seat_cards(STATE):
            assert len(card.choices) == 4 == len(set(card.choices)), card.item


class TestMapCards:
    def test_one_lowercase_answer_per_group(self):
        cards = c.map_cards(STATE)
        assert [(x.item, x.answer, x.img) for x in cards] == [
            ("counties:MI|map|g01", "bsshoc", "assets/counties_michigan_map/g01.webp"),
            ("counties:MI|map|g02", "tcss", "assets/counties_michigan_map/g02.webp")]


# --------------------------------------------------------------------- map render

def _square(x0, y0, name, kind="County"):
    ring = [[x0, y0], [x0 + 1, y0], [x0 + 1, y0 + 1], [x0, y0 + 1], [x0, y0]]
    return {"type": "Feature", "properties": {"NAME_2": name, "TYPE_2": kind},
            "geometry": {"type": "Polygon", "coordinates": [ring]}}


class TestRenderMap:
    GEO = {"type": "FeatureCollection", "features": [
        _square(-85, 44, "Bay"), _square(-84, 44, "Saginaw"),
        _square(-83, 44, "LakeHuron", "Waterbody")]}

    def _img(self, highlight):
        return Image.open(io.BytesIO(c.render_map(self.GEO, highlight, width=200))).convert("RGBA")

    def test_highlighted_county_is_red_and_other_is_not(self):
        img = self._img({"Bay"})
        w, h = img.size
        bay = img.getpixel((int(w * 0.2), h // 2))
        sag = img.getpixel((int(w * 0.6), h // 2))
        assert bay[0] > 180 and bay[1] < 80
        assert not (sag[0] > 180 and sag[1] < 80) and sag[3] == 255

    def test_waterbodies_are_not_drawn(self):
        w, h = self._img(set()).size          # two land squares side by side: ~2.8:1 at 44°N
        assert w / h < 3.2                    # with the lake square it would be ~4.2:1


# --------------------------------------------------------------------- CLI round trip

def test_curate_then_build(tmp_path, monkeypatch):
    import json

    import yaml

    from deck_generator import counties_cli
    rows = tmp_path / "rows.tsv"
    rows.write_text("acronym\tnames\nBSShOC\tBay City Saginaw Shiawassee Owosso Corunna\n"
                    "TCSS\tTuscola Caro Sanilac Sandusky\n")
    facts = {"state": "michigan", "usps": "MI", "places": ["Bay City", "Owosso", "Corunna",
                                                           "Caro", "Sandusky"],
             "counties": [{**x, "gadm": x["county"]} for x in STATE["counties"]]}
    (tmp_path / "facts.json").write_text(json.dumps(facts))
    atlas = tmp_path / "atlas" / "data" / "us" / "regions"
    atlas.mkdir(parents=True)
    (atlas / "michigan.json").write_text(json.dumps({"type": "FeatureCollection", "features": [
        _square(-85 + i, 44, n) for i, n in enumerate(["Bay", "Saginaw", "Shiawassee", "Tuscola",
                                                         "Sanilac"])]}))
    monkeypatch.setattr(counties_cli, "CONFIG_DIR", tmp_path / "configs")

    assert counties_cli.main(["curate", "michigan", "--rows", str(rows),
                              "--facts", str(tmp_path / "facts.json")]) == 0
    state = yaml.safe_load((tmp_path / "configs" / "michigan.yaml").read_text())
    assert state["groups"][0]["pieces"][0] == ["B", "Bay City"]

    out = tmp_path / "decks"
    assert counties_cli.main(["build", "michigan", "--out", str(out),
                              "--atlas", str(tmp_path / "atlas")]) == 0
    arts = {p.stem: json.loads(p.read_text()) for p in out.glob("*.json")}
    assert set(arts) == {"counties_michigan_pieces", "counties_michigan_seats",
                         "counties_michigan_map"}
    assert {a["source"] for a in arts.values()} == {"manual"}
    # the quiz keys decks on config_path, so each deck needs its own
    assert len({a["config_path"] for a in arts.values()}) == 3
    assert len(list((out / "assets" / "counties_michigan_map").glob("*.webp"))) == 2
