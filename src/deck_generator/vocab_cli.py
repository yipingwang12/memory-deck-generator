"""``deck-vocab`` — preview / curate / merge / build a matching vocab deck.

The deck is a **curated** artifact (``source: manual``): heavy lifting is done offline and
committed as data, then ``build`` assembles the artifact deterministically (no network, no
API key). The config's ``lang`` picks the source: ``zh`` (default) = wordfreq × CC-CEDICT;
``de``/``pl`` = wordfreq × Wiktionary (kaikki.org), with inflected forms summed per lemma.

- **preview** (default): rank candidates, report the clean/needs-LLM split. No writes.
- **curate**: write the needs-LLM chunk files for the audited adjudication pass. The pass
  itself is external; for ``de``/``pl`` it writes ``chunk_NN.out.jsonl`` beside each chunk.
- **merge** (``de``/``pl``): clean rows + adjudicated chunk outputs → the committed
  ``*.curated.jsonl`` + ``*.audit.jsonl``.
- **build**: assemble the committed ``*.curated.jsonl`` into the deck artifact. Verifies
  band-scoped gloss uniqueness + no duplicate words first.

See docs/design/vocab-pipeline.md.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

import yaml

from .deck_export import DEFAULT_DECKS_DIR, config_hash
from wordfreq import top_n_list

from . import vocab, vocab_kaikki

_DEFAULT_ARTIFACT = "vocab_chinese_common.json"


def _load_cfg(path: Path) -> tuple[dict, Path, Path]:
    cfg = yaml.safe_load(path.read_text(encoding="utf-8"))
    curated = path.parent / cfg["curated"]
    return cfg, curated, path


def _preview(cfg: dict, seed_deck: Path) -> None:
    vocab.fetch_cedict()
    cedict = vocab.load_cedict()
    exclude = {r.hanzi for r in vocab.load_seed(seed_deck)} if seed_deck.exists() else set()
    cands = vocab.rank_candidates(cedict, exclude=exclude, target_n=cfg["target_n"])
    n_llm = sum(c.needs_llm for c in cands)
    print(f"CC-CEDICT entries : {len(cedict):,}")
    print(f"seed excluded     : {len(exclude)}")
    print(f"candidates        : {len(cands)} (target {cfg['target_n']})")
    print(f"  clean (no LLM)  : {len(cands) - n_llm} ({100*(len(cands)-n_llm)//max(len(cands),1)}%)")
    print(f"  needs LLM       : {n_llm} (polyphone ∪ multi-sense ∪ function-word)")


def _curate(cfg: dict, seed_deck: Path, out_dir: Path, chunk: int) -> None:
    vocab.fetch_cedict()
    cedict = vocab.load_cedict()
    exclude = {r.hanzi for r in vocab.load_seed(seed_deck)} if seed_deck.exists() else set()
    cands = vocab.rank_candidates(cedict, exclude=exclude, target_n=cfg["target_n"])
    batch = vocab.llm_batch_records(cands)
    out_dir.mkdir(parents=True, exist_ok=True)
    for i in range(0, len(batch), chunk):
        (out_dir / f"chunk_{i//chunk:02d}.json").write_text(
            json.dumps(batch[i:i + chunk], ensure_ascii=False, indent=1), encoding="utf-8")
    n = -(-len(batch) // chunk)
    print(f"wrote {n} chunk files ({len(batch)} needs-LLM words) to {out_dir}")
    print("→ run the audited adjudication pass (per-word sense/reading/gloss + reason) over")
    print(f"  these chunks and write {cfg['curated']} + {cfg['audit']}, then `deck-vocab build`.")


def _kaikki_candidates(cfg: dict) -> list[vocab_kaikki.Candidate]:
    """Lemma candidates for a ``de``/``pl`` config, ranked by summed form frequency."""
    spec = vocab_kaikki.LANGS[cfg["lang"]]
    surfaces = top_n_list(spec.code, cfg["surface_n"])
    lex = vocab_kaikki.cached_lexicon(spec, set(surfaces), cfg["surface_n"])
    shares = None
    if cfg.get("case_counts"):
        non_noun = {s for s in surfaces
                    if (ls := lex.lemmas_for(s)) and not any(w[:1].isupper() for w in ls)}
        shares = vocab_kaikki.case_shares(Path(cfg["case_counts"]), non_noun)
    return vocab_kaikki.rank_lemmas(lex, spec, surfaces, cfg["target_n"], case_shares=shares)


def _kaikki_preview(cfg: dict) -> None:
    cands = _kaikki_candidates(cfg)
    n_llm = sum(c.needs_llm for c in cands)
    print(f"candidates        : {len(cands)} (target {cfg['target_n']}, "
          f"from top {cfg['surface_n']:,} surface forms)")
    print(f"  clean (no LLM)  : {len(cands) - n_llm} ({100*(len(cands)-n_llm)//max(len(cands),1)}%)")
    print(f"  needs LLM       : {n_llm} (function word ∪ multi-POS ∪ multi-sense ∪ aspect pair ∪ shared forms ∪ case twin)")
    for c in cands[:25]:
        flag = "LLM" if c.needs_llm else "   "
        print(f"  {c.freq_rank:5d} {flag} {c.word:<16} {c.parts[0]['hint']:<22} "
              f"{c.parts[0]['glosses'][0][:60]}")


def _chunk_dir(out: Path, cfg: dict) -> Path:
    return out / "vocab_chunks" / cfg.get("lang", "zh")


def _kaikki_curate(cfg: dict, out_dir: Path, chunk: int) -> None:
    batch = [vocab_kaikki.llm_record(c) for c in _kaikki_candidates(cfg) if c.needs_llm]
    out_dir.mkdir(parents=True, exist_ok=True)
    for i in range(0, len(batch), chunk):
        (out_dir / f"chunk_{i//chunk:02d}.json").write_text(
            json.dumps(batch[i:i + chunk], ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"wrote {-(-len(batch) // chunk)} chunk files ({len(batch)} needs-LLM words) to {out_dir}")
    print(f"→ adjudicate each chunk_NN.json per {cfg['policy']} into chunk_NN.out.jsonl,")
    print("  then `deck-vocab --merge` and `deck-vocab --build`.")


def _kaikki_merge(cfg: dict, config_path: Path, chunk_dir: Path) -> None:
    adjudicated = [d for p in sorted(chunk_dir.glob("chunk_*.out.jsonl"))
                   for d in vocab_kaikki.read_jsonl(p)]
    cands = _kaikki_candidates(cfg)
    rows, audit = vocab_kaikki.merge_curated(cands, adjudicated)
    aside = sorted({d["word"] for d in adjudicated} - {c.word for c in cands})
    if aside:
        print(f"warning: {len(aside)} adjudicated words are past target_n and set aside: "
              f"{aside[:10]}")
    curated = config_path.parent / cfg["curated"]
    vocab_kaikki.write_jsonl(curated, [vocab_kaikki.row_record(r) for r in rows])
    vocab_kaikki.write_jsonl(config_path.parent / cfg["audit"], audit)
    dropped = sum(d["decision"] == "drop" for d in audit)
    print(f"merged {len(rows)} rows ({len(audit)} adjudicated, {dropped} dropped) → {curated}")


def _build(cfg: dict, curated_path: Path, config_path: Path, out_dir: Path) -> None:
    rows = vocab.load_curated(curated_path)
    words = [r.word for r in rows]
    assert len(set(words)) == len(words), "duplicate word → FSRS item_key collision"
    collisions = vocab.band_collisions(rows)
    assert not collisions, f"in-band gloss collisions (ambiguous rounds): {collisions[:10]}"
    art = vocab.assemble_artifact(rows, cfg, f"manual/{config_path.name}",
                                  config_hash(curated_path))
    out_dir.mkdir(parents=True, exist_ok=True)
    out = out_dir / cfg.get("artifact", _DEFAULT_ARTIFACT)
    out.write_text(json.dumps(art, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"built {out} — {len(rows)} words (source: manual, {len(rows)-cfg.get('seed_count',0)} beyond seed)")


def main(argv: list[str] | None = None) -> None:
    p = argparse.ArgumentParser(description="Preview/curate/merge/build a vocab matching deck.")
    p.add_argument("--config", type=Path, default=Path("configs/vocab/chinese_common.yaml"))
    p.add_argument("--seed-deck", type=Path,
                   default=Path("../memory-quiz-app/data/decks/vocab_chinese_common.json"),
                   help="existing deck to exclude as seed (preview/curate only)")
    p.add_argument("--out", type=Path, default=DEFAULT_DECKS_DIR)
    p.add_argument("--curate", action="store_true", help="prepare needs-LLM chunk files")
    p.add_argument("--merge", action="store_true",
                   help="de/pl: clean rows + adjudicated chunk outputs → curated + audit JSONL")
    p.add_argument("--build", action="store_true", help="assemble artifact from committed curated rows")
    p.add_argument("--chunk", type=int, default=100)
    args = p.parse_args(argv)

    cfg, curated, config_path = _load_cfg(args.config)
    kaikki = cfg.get("lang", "zh") in vocab_kaikki.LANGS
    if args.build:
        _build(cfg, curated, config_path, args.out)
    elif args.merge:
        if not kaikki:
            p.error("--merge is for de/pl configs; Chinese rows are already committed")
        _kaikki_merge(cfg, config_path, _chunk_dir(args.out, cfg))
    elif args.curate and kaikki:
        _kaikki_curate(cfg, _chunk_dir(args.out, cfg), args.chunk)
    elif args.curate:
        _curate(cfg, args.seed_deck, args.out / "vocab_chunks", args.chunk)
    elif kaikki:
        _kaikki_preview(cfg)
    else:
        _preview(cfg, args.seed_deck)


if __name__ == "__main__":
    main()
