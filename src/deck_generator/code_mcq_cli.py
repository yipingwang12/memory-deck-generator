"""``deck-code-mcq`` — check / build a source-file MCQ deck.

Curated (``source: manual``), exactly as ``deck-papers``: an LLM session reads the file and
writes ``<slug>.curated.jsonl`` + ``<slug>.audit.jsonl`` per ``configs/code/policy.md``;
this CLI verifies and assembles, offline.

**The data lives outside this repo.** A code deck quotes work-repo source, so its config and
JSONL rows sit in a gitignored directory under the consuming repo (``code-drill/decks/``) and
the artifact is written there too — not to ``memory-quiz-app/data/decks``, which is committed
and deployed. ``--out`` therefore has no default that would ship it by accident.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import yaml

from . import code_mcq
from .deck_export import config_hash


def _paths(config: Path) -> tuple[Path, Path, Path, Path, Path | None]:
    cfg = yaml.safe_load(config.read_text(encoding="utf-8"))
    here = config.parent
    return (here / cfg["curated"],
            here / cfg["audit"],
            (here / cfg["source_file"]).resolve(),
            here / (Path(cfg["curated"]).stem.split(".")[0] + ".source.sha256"),
            here / cfg["claims"] if cfg.get("claims") else None)


def _file_id(cfg: dict) -> str:
    """``<repo>:<path>`` as the file is now — what its AI notes are keyed by."""
    return f"{cfg['repo']}:{cfg['path']}" if cfg.get("repo") and cfg.get("path") \
        else cfg["source_id"]


def _artifact_name(config: Path) -> str:
    return f"code_{config.stem}.json"


def _run_checks(cfg: dict, config: Path, out_dir: Path, verify_quotes: bool):
    curated_p, audit_p, source_p, _, claims_p = _paths(config)
    cards = code_mcq.load_curated(curated_p)
    audit = code_mcq.load_audit(audit_p)
    claims = code_mcq.load_claims(claims_p) if claims_p and claims_p.exists() else None

    if source_p.exists():
        source = source_p.read_text(encoding="utf-8")
    elif verify_quotes:
        raise SystemExit(
            f"source file missing: {source_p}\n"
            "It is a local checkout of the target repo — clone it, or pass "
            "--no-verify-quotes to build without the quote check.")
    else:
        source = ""

    shipped = code_mcq.shipped_qids(out_dir / _artifact_name(config), cfg["source_id"])
    report = code_mcq.validate(cards, audit, source, cfg.get("n_choices", 4), shipped,
                               verify_quotes=verify_quotes, claims=claims)
    if why := code_mcq.scope_refusal(cfg.get("path") or cfg.get("source_file", "")):
        report.failures.append(why)
    report.failures += code_mcq.currency_refusals(
        _file_id(cfg), cfg.get("reviewed_sha256"), config.parent, source)
    if claims_p and not claims_p.exists():
        report.warnings.append(f"claims file named but absent ({claims_p.name}) — density "
                               f"unmeasured")
    return report, cards, audit, source


def _fmt(counts: dict[str, int]) -> str:
    return ", ".join(f"{k or '?'} {v}" for k, v in sorted(counts.items(), key=lambda kv: -kv[1]))


def _print(report, cards, config: Path, audit, source: str) -> None:
    comp = code_mcq.composition(audit)
    print(f"{config.name}: {len(cards)} cards")
    print(f"  section : {_fmt(comp['section'])}")
    print(f"  type    : {_fmt(comp['type'])}")
    if source:
        defined = [s.name for s in code_mcq.defined_symbols(source)]
        covered = code_mcq.covered_symbols(audit, source)
        print(f"  functions: {len(covered & set(defined))}/{len(defined)} carry a card")
    for w in report.warnings:
        print(f"  WARN {w}")
    for f in report.failures:
        print(f"  FAIL {f}")


def _build(cfg: dict, config: Path, out_dir: Path, verify_quotes: bool) -> None:
    report, cards, audit, source = _run_checks(cfg, config, out_dir, verify_quotes)
    _print(report, cards, config, audit, source)
    if not report.ok:
        raise SystemExit(f"refused — {len(report.failures)} failure(s); fix the data, not the check")

    curated_p, _, _, stamp_p, _ = _paths(config)
    digest = code_mcq.source_digest(source) if source else ""
    art = code_mcq.assemble_artifact(cards, cfg, f"manual/code/{config.name}", digest)
    art["config_hash"] = config_hash(curated_p)
    art["notes_sha256"] = cfg["reviewed_sha256"]

    out_dir.mkdir(parents=True, exist_ok=True)
    out = out_dir / _artifact_name(config)
    out.write_text(json.dumps(art, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    if digest:
        prior = stamp_p.read_text(encoding="utf-8").strip() if stamp_p.exists() else ""
        if prior and prior != digest:
            print(f"  WARN the source file changed since the last build ({prior[:12]}… → "
                  f"{digest[:12]}…); quotes were re-verified against the new text")
        stamp_p.write_text(digest + "\n", encoding="utf-8")

    print(f"built {out} — {len(cards)} cards (source: manual)")


def main(argv: list[str] | None = None) -> None:
    p = argparse.ArgumentParser(description="Check/build a source-file MCQ deck.")
    p.add_argument("--config", type=Path, required=True, help="<slug>.yaml beside its rows")
    p.add_argument("--out", type=Path, default=None,
                   help="artifact directory (default: beside the config — keep it gitignored)")
    p.add_argument("--build", action="store_true", help="assemble the artifact (default: check)")
    p.add_argument("--no-verify-quotes", action="store_true",
                   help="skip the verbatim-quote check when the source file is unavailable")
    args = p.parse_args(argv)

    cfg = yaml.safe_load(args.config.read_text(encoding="utf-8"))
    out_dir = args.out or args.config.parent
    verify = not args.no_verify_quotes
    if args.build:
        _build(cfg, args.config, out_dir, verify)
    else:
        report, cards, audit, source = _run_checks(cfg, args.config, out_dir, verify)
        _print(report, cards, args.config, audit, source)
        print("OK" if report.ok else f"REFUSED — {len(report.failures)} failure(s)")
        sys.exit(0 if report.ok else 1)


if __name__ == "__main__":
    main()
