from pathlib import Path

from deck_generator import company_mnemonics as cm
from deck_generator.companies import Card

PEGS = {"02": "sun", "06": "sushi", "18": "dove", "30": "mouse", "99": "pipe"}
NS = "company:alnylam-pharmaceuticals"


def _card(qid, answer, stem="In which year was Alnylam incorporated?"):
    return Card(qid=qid, stem=stem, choices=[answer, "x", "y", "z"], answer=answer, label="L")


CARDS = [_card("q01", "2002"), _card("q08", "Six"), _card("q13", "Cambridge"),
         _card("q12", "Alnylam 2030")]


def _entry(qid, scene, peg=None):
    return {"qid": qid, "scene": scene, **({"peg": peg} if peg else {})}


def _problems(entries, anchor="LAMB"):
    return cm.problems({"anchor": anchor, "cards": entries}, CARDS, PEGS)


ALL = cm.load_pegs(Path(__file__).resolve().parents[1] / "configs" / "history" / "major_pegs.yaml")


class TestExpectedPegs:
    def test_year_uses_last_two_digits(self):
        assert cm.expected_pegs("2002", ALL) == ["sun"]

    def test_year_inside_a_name(self):
        assert cm.expected_pegs("Alnylam 2030", ALL) == ["mouse"]

    def test_count_word(self):
        assert cm.expected_pegs("Six", ALL) == ["sushi"]

    def test_plain_answer_has_none(self):
        assert cm.expected_pegs("Cambridge", ALL) == []

    def test_money_uses_first_two_significant_digits_cut(self):
        assert cm.expected_pegs("$87M", ALL) == ["fox"]
        assert cm.expected_pegs("$1.3B", ALL) == ["tomb"]
        assert cm.expected_pegs("About $700M", ALL) == ["goose"]
        assert cm.expected_pegs("$1M", ALL) == ["dice"]          # 1.0 → 10

    def test_area_uses_first_two_significant_digits_cut(self):
        assert cm.expected_pegs("235,500 sq ft", ALL) == ["gnome"]   # cut, not 24
        assert cm.expected_pegs("95,000 sq ft", ALL) == ["bell"]

    def test_several_numbers_in_answer_order(self):
        assert cm.expected_pegs("2012 to 2024", ALL) == ["tongue", "hanger"]
        assert cm.expected_pegs("$9.1B plus $400M in earnouts", ALL) == ["boot", "horse"]
        assert cm.expected_pegs("12 storeys and 334,000 sq ft", ALL) == ["tongue", "mummy"]
        assert cm.expected_pegs("$1M to $1.5M over nine to twelve months", ALL) == [
            "dice", "doll", "soap", "tongue"]
        assert cm.expected_pegs("Six to eight", ALL) == ["sushi", "sofa"]

    def test_decimals_count_as_significant_digits(self):
        assert cm.expected_pegs("$6.84 per share", ALL) == ["chef"]          # 68, not 60
        assert cm.expected_pegs("$500M at a $2.5B valuation", ALL) == ["lasso", "nail"]
        assert cm.expected_pegs("About $96.5 million across four rounds", ALL) == ["peach"]
        assert cm.unit_images("$2.5 billion") == ["gold bar"]

    def test_percent_uses_two_significant_digits(self):
        assert cm.expected_pegs("9.1%", ALL) == ["boot"]
        assert cm.expected_pegs("About 36%", ALL) == ["match"]

    def test_euro_is_money(self):
        assert cm.expected_pegs("EUR 30M over four years", ALL) == ["mouse", "sewer"]
        assert cm.unit_images("EUR 30M over four years") == ["coin"]

    def test_count_with_a_unit(self):
        assert cm.expected_pegs("87%", ALL) == ["fox"]
        assert cm.expected_pegs("Up to 30 days", ALL) == ["mouse"]
        assert cm.expected_pegs("About three years", ALL) == ["sumo"]

    def test_numbers_in_names_are_not_counts(self):
        """A product name's digit (JAM-2, Layer 7) or word (Connect-One) is not a quantity."""
        for name in ("JAM-2", "Layer 7 Cortical Interface", "Connect-One", "Hippocampal CA3"):
            assert cm.expected_pegs(name, ALL) == []


class TestUnitImages:
    def test_money_and_area_need_their_unit_image(self):
        assert cm.unit_images("$87M") == ["coin"]
        assert cm.unit_images("$1.3B") == ["gold bar"]
        assert cm.unit_images("235,500 sq ft") == ["tile"]
        assert cm.unit_images("$9.1B plus $400M") == ["gold bar", "coin"]
        assert cm.unit_images("2002") == []


class TestProblems:
    def test_good_entries_pass(self):
        assert _problems([
            _entry("q01", "Under a hot SUN, the LAMB signs its papers.", "sun"),
            _entry("q08", "The LAMB eats six plates of SUSHI.", "sushi"),
            _entry("q13", "The LAMB sleeps under a BRIDGE.")]) == []

    def test_unknown_qid(self):
        assert any("q77" in p for p in _problems([_entry("q77", "The LAMB.")]))

    def test_duplicate_qid(self):
        e = _entry("q13", "The LAMB sleeps under a BRIDGE.")
        assert any("twice" in p for p in _problems([e, e]))

    def test_anchor_must_be_in_capitals(self):
        assert any("anchor" in p for p in _problems([_entry("q13", "The lamb sleeps.")]))

    def test_date_answer_needs_its_peg(self):
        assert any("peg" in p for p in _problems([_entry("q01", "The LAMB signs papers.")]))

    def test_wrong_peg_for_the_year(self):
        assert any("sun" in p for p in _problems([_entry("q01", "A DOVE and the LAMB.", "dove")]))

    def test_peg_must_be_in_capitals_in_the_scene(self):
        assert any("SUN" in p for p in _problems([_entry("q01", "A sun and the LAMB.", "sun")]))

    def test_optional_peg_must_be_a_peg_word(self):
        """A stem number (Sharp's 1999 paper) may carry a peg too, but only a list word."""
        assert _problems([_entry("q13", "A PIPE and the LAMB.", "pipe")]) == []
        assert any("not in" in p for p in _problems([_entry("q13", "A KAZOO, LAMB.", "kazoo")]))

    def test_several_pegs_in_answer_order(self):
        cards = [_card("q01", "2012 to 2024"), _card("q02", "$9.1B plus $400M")]
        ok = [{"qid": "q01", "peg": ["tongue", "hanger"],
               "scene": "A TONGUE licks the LAMB, then a HANGER holds it."},
              {"qid": "q02", "peg": ["boot", "horse"],
               "scene": "A BOOT kicks gold bars to the LAMB; a HORSE adds coins."}]
        assert cm.problems({"anchor": "LAMB", "cards": ok}, cards, ALL) == []
        swapped = [{**ok[0], "scene": "A HANGER holds the LAMB, then a TONGUE licks it."}]
        assert any("order" in p for p in cm.problems({"anchor": "LAMB", "cards": swapped}, cards, ALL))

    def test_money_scene_needs_its_unit_image(self):
        cards = [_card("q01", "$87M")]
        bad = [{"qid": "q01", "peg": "fox", "scene": "A FOX plays for the LAMB's Series A."}]
        assert any("coin" in p for p in cm.problems({"anchor": "LAMB", "cards": bad}, cards, ALL))

    def test_scene_word_limit(self):
        long = "The LAMB " + "walks " * 30
        assert any("words" in p for p in _problems([_entry("q13", long)]))


class TestAssemble:
    def test_sidecar_keys_scenes_by_item_and_answer(self):
        cfg = {"namespace": NS}
        data = {"anchor": "LAMB", "cards": [_entry("q13", "The LAMB sleeps under a BRIDGE.")]}
        out = cm.assemble(data, CARDS, cfg, "companies_alnylam_pharmaceuticals")
        assert out == {"schema": 1, "deck": "companies_alnylam_pharmaceuticals",
                       "anchor": "LAMB",
                       "cards": [{"item": f"{NS}|q13", "answer": "Cambridge",
                                  "scene": "The LAMB sleeps under a BRIDGE."}]}

    def test_sidecar_names_the_image_of_a_scene_that_has_one(self):
        data = {"anchor": "LAMB", "cards": [_entry("q13", "The LAMB sleeps under a BRIDGE."),
                                             _entry("q08", "Six SUSHI plates.")]}
        out = cm.assemble(data, CARDS, {"namespace": NS}, "d", images={"q13"})
        assert out["cards"][0]["image"] == "q13.webp"
        assert "image" not in out["cards"][1]


def test_committed_pilot_passes():
    root = Path(__file__).resolve().parents[1] / "configs"
    from deck_generator.companies import load_curated
    import yaml
    cards = load_curated(root / "companies" / "alnylam_pharmaceuticals.curated.jsonl")
    data = yaml.safe_load((root / "companies" / "alnylam_pharmaceuticals.mnemonics.yaml").read_text())
    assert cm.problems(data, cards, cm.load_pegs(root / "history" / "major_pegs.yaml")) == []
    assert {e["qid"] for e in data["cards"]} == {c.qid for c in cards}


class TestCli:
    CFG = Path(__file__).resolve().parents[1] / "configs" / "companies" / "alnylam_pharmaceuticals.yaml"

    def test_build_writes_the_sidecar(self, tmp_path):
        import json
        from deck_generator import companies_cli
        companies_cli.main(["--config", str(self.CFG), "--build", "--out", str(tmp_path / "d"),
                            "--mnemonics-out", str(tmp_path / "m")])
        side = json.loads((tmp_path / "m" / "companies_alnylam_pharmaceuticals.json").read_text())
        assert side["anchor"] == "LAMB" and len(side["cards"]) == 13
        assert side["cards"][0]["item"] == "company:alnylam-pharmaceuticals|q01"

    def test_build_copies_current_scene_images(self, tmp_path):
        import json
        import yaml
        from deck_generator import companies_cli, scene_images as si
        scenes = yaml.safe_load((self.CFG.parent / "alnylam_pharmaceuticals.mnemonics.yaml").read_text())
        src = si.image_dir("alnylam_pharmaceuticals", root=tmp_path / "gen")
        job = next(j for j in si.plan(scenes, src) if j.name == "q13")
        si.record(src, job, model="m")
        (src / "q13.webp").write_bytes(b"img")
        companies_cli.main(["--config", str(self.CFG), "--build", "--out", str(tmp_path / "d"),
                            "--mnemonics-out", str(tmp_path / "m"),
                            "--scene-images", str(tmp_path / "gen")])
        side = json.loads((tmp_path / "m" / "companies_alnylam_pharmaceuticals.json").read_text())
        assert [c["image"] for c in side["cards"] if "image" in c] == ["q13.webp"]
        assert (tmp_path / "m" / "images" / "companies_alnylam_pharmaceuticals" / "q13.webp").read_bytes() == b"img"

    def test_bad_scene_refuses_the_build(self, tmp_path):
        import shutil
        import pytest
        import yaml
        from deck_generator import companies_cli
        here = self.CFG.parent
        for f in here.glob("alnylam_pharmaceuticals.*"):
            shutil.copy(f, tmp_path / f.name)
        bad = tmp_path / "alnylam_pharmaceuticals.mnemonics.yaml"
        data = yaml.safe_load(bad.read_text())
        data["cards"][0]["peg"] = "dove"
        bad.write_text(yaml.safe_dump(data))
        with pytest.raises(SystemExit):
            companies_cli.main(["--config", str(tmp_path / "alnylam_pharmaceuticals.yaml"), "--build",
                                "--out", str(tmp_path / "d"), "--mnemonics-out", str(tmp_path / "m")])
        assert not (tmp_path / "m").exists()
