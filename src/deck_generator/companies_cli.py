"""``deck-companies`` — check / build a company MCQ deck.

The deck is **curated** (``source: manual``): the questions are authored by a research session
following ``configs/companies/policy.md`` and committed as data; this CLI only verifies and
assembles. Two modes:

- **check** (default): run every validation against the committed rows and the source
  snapshot. No writes — the loop for fixing an authoring pass.
- **build**: check, then write the artifact plus the committed ``.source.sha256`` stamp.
  Refuses on any failure.

Unlike ``deck-papers`` there is no ``--no-verify-quotes`` escape hatch: the source snapshot is
our own prose and is committed, so it is always present in a fresh clone and the quote check
can always run.

``--stale`` reports only the recheck window, for use as a periodic maintenance sweep without
rebuilding anything.
"""
from __future__ import annotations

import argparse
import json
import shutil
import sys
from datetime import date
from pathlib import Path

import yaml

from .deck_export import DEFAULT_DECKS_DIR, config_hash

from . import companies, company_mnemonics, scene_images

_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_PEGS = _ROOT / "configs" / "history" / "major_pegs.yaml"
# Written straight into the quiz repo, like the reign tables: a sidecar, not a deck.
DEFAULT_MNEMONICS_OUT = _ROOT.parent / "memory-quiz-app" / "data" / "mnemonics"


def _paths(config: Path) -> tuple[Path, Path, Path, Path, Path | None]:
    cfg = yaml.safe_load(config.read_text(encoding="utf-8"))
    here = config.parent
    return (here / cfg["curated"],
            here / cfg["audit"],
            here / cfg["source_text"],
            here / (Path(cfg["source_text"]).stem + ".sha256"),
            here / cfg["facts"] if cfg.get("facts") else None)


def _artifact_name(config: Path) -> str:
    return f"companies_{config.stem}.json"


def _checked_range(audit: list[companies.AuditRow]) -> tuple[str, str] | None:
    dates = sorted(r.checked for r in audit if r.decision == "keep" and r.checked)
    return (dates[0], dates[-1]) if dates else None


def _run_checks(cfg: dict, config: Path, out_dir: Path, today: date | None
                ) -> tuple[companies.Report, list[companies.Card],
                           list[companies.AuditRow], str]:
    curated_p, audit_p, source_p, _, facts_p = _paths(config)
    cards = companies.load_curated(curated_p)
    audit = companies.load_audit(audit_p)
    facts = companies.load_facts(facts_p) if facts_p and facts_p.exists() else None

    if not source_p.exists():
        raise SystemExit(
            f"source snapshot missing: {source_p}\n"
            "Unlike a paper's full text this file is ours and is committed — restore it from "
            "git rather than skipping the quote check.")
    source = source_p.read_text(encoding="utf-8")

    shipped = companies.shipped_qids(out_dir / _artifact_name(config), cfg["namespace"])
    report = companies.validate(
        cards, audit, source, cfg.get("n_choices", 4), shipped, facts,
        cfg.get("recheck_months", companies.DEFAULT_RECHECK_MONTHS), today)
    if facts_p and not facts_p.exists():
        report.warnings.append(f"facts file named but absent ({facts_p.name}) — density "
                               f"and coverage unmeasured")
    scenes = _mnemonics(cfg, config)
    if scenes is not None:
        report.failures.extend(f"mnemonics: {p}" for p in company_mnemonics.problems(
            scenes, cards, company_mnemonics.load_pegs(DEFAULT_PEGS)))
    return report, cards, audit, companies.source_digest(source)


def _mnemonics(cfg: dict, config: Path) -> dict | None:
    """The config's memory-scene file, or None when it names none."""
    name = cfg.get("mnemonics")
    return yaml.safe_load((config.parent / name).read_text(encoding="utf-8")) if name else None


def _copy_scene_images(scenes: dict, src: Path, dest: Path) -> set[str]:
    """Copy the current pictures to ``dest``, replacing what was there; return their qids."""
    qids = scene_images.current_images(scenes, src)
    shutil.rmtree(dest, ignore_errors=True)
    if qids:
        dest.mkdir(parents=True)
        for qid in qids:
            shutil.copy2(src / f"{qid}.webp", dest / f"{qid}.webp")
    return qids


def _write_mnemonics(cfg: dict, config: Path, cards: list[companies.Card], out_dir: Path,
                     images_root: Path = scene_images.ROOT) -> None:
    scenes = _mnemonics(cfg, config)
    if scenes is None:
        return
    deck = Path(_artifact_name(config)).stem
    out_dir.mkdir(parents=True, exist_ok=True)
    images = _copy_scene_images(scenes, scene_images.image_dir(config.stem, root=images_root),
                                out_dir / "images" / deck)
    out = out_dir / f"{deck}.json"
    out.write_text(json.dumps(company_mnemonics.assemble(scenes, cards, cfg, deck, images),
                              ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"built {out} — {len(scenes['cards'])} scenes, {len(images)} images")


def _fmt(counts: dict[str, int]) -> str:
    return ", ".join(f"{k or '?'} {v}" for k, v in sorted(counts.items(), key=lambda kv: -kv[1]))


def _print(report: companies.Report, cards: list[companies.Card], config: Path,
           audit: list[companies.AuditRow]) -> None:
    comp = companies.composition(audit)
    rng = _checked_range(audit)
    print(f"{config.name}: {len(cards)} cards")
    print(f"  category: {_fmt(comp['category'])}")
    print(f"  type    : {_fmt(comp['type'])}")
    if rng:
        print(f"  checked : {rng[0]} .. {rng[1]}")
    for w in report.warnings:
        print(f"  WARN {w}")
    for f in report.failures:
        print(f"  FAIL {f}")


def _build(cfg: dict, config: Path, out_dir: Path, today: date | None,
           mnemonics_out: Path = DEFAULT_MNEMONICS_OUT,
           images_root: Path = scene_images.ROOT) -> None:
    report, cards, audit, digest = _run_checks(cfg, config, out_dir, today)
    _print(report, cards, config, audit)
    if not report.ok:
        raise SystemExit(f"refused — {len(report.failures)} failure(s); fix the data, not the check")

    curated_p, _, _, stamp_p, _ = _paths(config)
    art = companies.assemble_artifact(
        cards, cfg, f"manual/companies/{config.name}", digest, _checked_range(audit))
    art["config_hash"] = config_hash(curated_p)

    out_dir.mkdir(parents=True, exist_ok=True)
    out = out_dir / _artifact_name(config)
    out.write_text(json.dumps(art, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    prior = stamp_p.read_text(encoding="utf-8").strip() if stamp_p.exists() else ""
    if prior and prior != digest:
        print(f"  WARN source snapshot changed since the last build ({prior[:12]}… → "
              f"{digest[:12]}…); quotes were re-verified against the new text")
    stamp_p.write_text(digest + "\n", encoding="utf-8")
    _write_mnemonics(cfg, config, cards, mnemonics_out, images_root)

    print(f"built {out} — {len(cards)} cards (source: manual)")
    print("  NOT synced: copy to memory-quiz-app/data/decks/ by hand. `source: manual` means "
          "neither deck-export's clear nor the orchestrator's sync touches it.")


def _stale_only(cfg: dict, config: Path, today: date | None) -> int:
    _, audit_p, _, _, _ = _paths(config)
    audit = companies.load_audit(audit_p)
    months = cfg.get("recheck_months", companies.DEFAULT_RECHECK_MONTHS)
    stale = companies.stale_cards(audit, months, today)
    if not stale:
        print(f"{config.name}: no cards past the {months}-month recheck window")
        return 0
    print(f"{config.name}: {len(stale)} card(s) past the {months}-month recheck window")
    for qid, checked, age in stale:
        print(f"  {qid}  checked {checked}" + (f"  ({age} months)" if age >= 0 else "  (unparseable)"))
    return 1


def main(argv: list[str] | None = None) -> None:
    p = argparse.ArgumentParser(description="Check/build a company MCQ deck from curated rows.")
    p.add_argument("--config", type=Path, required=True, help="configs/companies/<slug>.yaml")
    p.add_argument("--out", type=Path, default=DEFAULT_DECKS_DIR)
    p.add_argument("--build", action="store_true", help="assemble the artifact (default: check only)")
    p.add_argument("--mnemonics-out", type=Path, default=DEFAULT_MNEMONICS_OUT,
                   help="where --build writes the memory-scene sidecar")
    p.add_argument("--scene-images", type=Path, default=scene_images.ROOT,
                   help="generated scene pictures (scripts/generate_scene_images.py output)")
    p.add_argument("--stale", action="store_true",
                   help="report only the recheck window and exit; no validation, no writes")
    p.add_argument("--today", type=date.fromisoformat, default=None,
                   help="override today's date for the staleness check (testing)")
    args = p.parse_args(argv)

    cfg = yaml.safe_load(args.config.read_text(encoding="utf-8"))
    if args.stale:
        sys.exit(_stale_only(cfg, args.config, args.today))
    if args.build:
        _build(cfg, args.config, args.out, args.today, args.mnemonics_out, args.scene_images)
    else:
        report, cards, audit, _ = _run_checks(cfg, args.config, args.out, args.today)
        _print(report, cards, args.config, audit)
        print("OK" if report.ok else f"REFUSED — {len(report.failures)} failure(s)")
        sys.exit(0 if report.ok else 1)


if __name__ == "__main__":
    main()
