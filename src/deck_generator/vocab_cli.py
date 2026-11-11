"""``deck-vocab`` — preview / curate / merge / build a matching vocab deck.

The deck is a **curated** artifact (``source: manual``): heavy lifting is done offline and
committed as data, then ``build`` assembles the artifact deterministically (no network, no
API key). The config's ``lang`` picks the source: ``zh`` (default) = wordfreq × CC-CEDICT;
``de``/``pl`` = wordfreq × Wiktionary (kaikki.org), with inflected forms summed per lemma.

- **tag-corpus** (``de``/``pl``): lemmatise a corpus sample → the ``lemma_counts`` file
  that ranking reads (surface → lemma counts in context). Needs spaCy/Stanza; run once.
- **preview** (default): rank candidates, report the clean/needs-LLM split. No writes.
- **curate**: write the needs-LLM chunk files for the audited adjudication pass. The pass
  itself is external; for ``de``/``pl`` it writes ``chunk_NN.out.jsonl`` beside each chunk.
- **review-clean** (``de``/``pl``): clean rows never reviewed → ``chunk_qa_NN.json``; the
  reviewer writes only changed rows to ``chunk_qa_NN.out.jsonl``.
- **merge** (``de``/``pl``): clean rows + adjudicated rows → the committed
  ``*.curated.jsonl`` + ``*.audit.jsonl``.

Where a word's state lives (``de``/``pl``): the committed audit is the durable record of
every adjudication, and the gitignored chunk outputs add to it — a newer adjudication of a
word replaces an older one (see :func:`_adjudications`). A clean row nobody has reviewed
is written with source ``kaikki-unreviewed``, so ``review-clean`` still queues it after a
merge.
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

from . import vocab, vocab_kaikki, vocab_lemmas

_DEFAULT_ARTIFACT = "vocab_chinese_common.json"


def _load_cfg(path: Path) -> tuple[dict, Path, Path]:
    cfg = yaml.safe_load(path.read_text(encoding="utf-8"))
    curated = path.parent / cfg["curated"]
    return cfg, curated, path


def _preview(cfg: dict, seed_deck: Path) -> None:
    vocab.fetch_cedict()
    cedict = vocab.load_cedict()
    exclude = {r.word for r in vocab.load_seed(seed_deck)} if seed_deck.exists() else set()
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
    exclude = {r.word for r in vocab.load_seed(seed_deck)} if seed_deck.exists() else set()
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


# --- zh: words from a level list (HSK) ------------------------------------------
def _list_selection(cfg: dict, config_path: Path) -> vocab.ListSelection:
    """The config's `include` list words that the committed curated rows do not have yet."""
    inc = cfg["include"]
    vocab.fetch_cedict()
    have = {r.word for r in vocab.load_curated(config_path.parent / cfg["curated"])}
    return vocab.list_candidates(
        vocab.load_cedict(), vocab.load_word_list(config_path.parent / inc["list"]),
        exclude=have, ranks=vocab.wordfreq_ranks(), max_rank=inc["max_rank"],
        all_levels_upto=inc["all_levels_upto"])


def _zh_adjudications(cfg: dict, config_path: Path, chunk_dir: Path) -> dict[str, dict]:
    """hanzi -> adjudication: the committed audit first, then chunk outputs oldest file
    first, so the newest adjudication of a word wins."""
    audit = _audit_path(cfg, config_path)
    rows = vocab_kaikki.read_jsonl(audit) if audit.exists() else []
    files = sorted(chunk_dir.glob("chunk_*.out.jsonl"), key=lambda p: (p.stat().st_mtime, p.name)) \
        if chunk_dir.exists() else []
    for f in files:
        rows += vocab_kaikki.read_jsonl(f)
    return {d["hanzi"]: d for d in rows}


def _zh_list_preview(cfg: dict, config_path: Path) -> None:
    sel = _list_selection(cfg, config_path)
    n_llm = sum(c.needs_llm for c in sel.candidates)
    print(f"{cfg['include']['name']} words to add : {len(sel.candidates)}")
    print(f"  clean (no LLM)  : {len(sel.candidates) - n_llm}")
    print(f"  needs LLM       : {n_llm}")
    print(f"  not in CC-CEDICT: {len(sel.not_in_cedict)} {sel.not_in_cedict[:20]}")


def _zh_list_curate(cfg: dict, config_path: Path, out_dir: Path, chunk: int) -> None:
    """Needs-LLM list words -> `chunk_list_NN.json`; clean rows -> `chunk_list_qa_NN.json`
    for review. A reviewer writes a row to the `.out.jsonl` beside each file only for a
    word it changes or drops."""
    sel = _list_selection(cfg, config_path)
    done = _zh_adjudications(cfg, config_path, out_dir)
    todo = [c for c in sel.candidates if c.hanzi not in done]
    llm = vocab.llm_batch_records(todo)
    qa = [{"hanzi": c.hanzi, "freq_rank": c.freq_rank, "pinyin": r.hint, "gloss": r.gloss,
           "glosses": c.readings[0].glosses}
          for c in todo if not c.needs_llm for r in [vocab.clean_row(c)]]
    n = _write_chunks(out_dir, "chunk_list_", llm, chunk)
    m = _write_chunks(out_dir, "chunk_list_qa_", qa, chunk)
    print(f"wrote {n} adjudication files ({len(llm)} words) and {m} review files "
          f"({len(qa)} clean rows) to {out_dir}")


def _zh_list_merge(cfg: dict, config_path: Path, chunk_dir: Path) -> None:
    """Committed rows + list words (adjudicated or clean) -> curated + audit JSONL."""
    sel = _list_selection(cfg, config_path)
    curated = config_path.parent / cfg["curated"]
    existing = vocab_kaikki.read_jsonl(curated)
    adjudicated = _zh_adjudications(cfg, config_path, chunk_dir)
    rows, new_audit = vocab.merge_list_rows(existing, sel.candidates, adjudicated,
                                            vocab.wordfreq_ranks())
    audit_path = _audit_path(cfg, config_path)
    audit = vocab_kaikki.read_jsonl(audit_path) if audit_path.exists() else []
    known = {d["hanzi"] for d in audit}
    audit += [d for d in new_audit if d["hanzi"] not in known]
    vocab_kaikki.write_jsonl(curated, rows)
    vocab_kaikki.write_jsonl(audit_path, audit)
    dropped = sum(d["decision"] == "drop" for d in new_audit)
    print(f"merged {len(rows) - len(existing)} list words ({len(new_audit)} adjudicated, "
          f"{dropped} dropped) → {curated} ({len(rows)} rows)")


def _tag_corpus(cfg: dict) -> None:
    """Lemmatise the config's corpus sample and write its ``lemma_counts`` file."""
    lc = cfg["lemma_corpus"]
    model_dir = Path(lc["model_dir"]) if lc.get("model_dir") else None
    counts = vocab_lemmas.tag_corpus(cfg["lang"], Path(lc["sentences"]), lc["sample"],
                                     lc.get("skip_chars", ""), model_dir)
    vocab_lemmas.write_counts(Path(cfg["lemma_counts"]), counts)


def _measured(cfg: dict, lex: vocab_kaikki.Lexicon) -> dict[str, dict[str, float]] | None:
    """Measured lemma shares from the config's ``lemma_counts`` file, if it names one."""
    if not cfg.get("lemma_counts"):
        return None
    path = Path(cfg["lemma_counts"])
    if not path.exists():
        raise SystemExit(f"error: {path} is missing; run `deck-vocab --tag-corpus` first")
    return vocab_kaikki.measured_shares(vocab_lemmas.read_counts(path), lex,
                                        unmeasured=cfg.get("unmeasured", ()))


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
    return vocab_kaikki.rank_lemmas(lex, spec, surfaces, cfg["target_n"], case_shares=shares,
                                    measured=_measured(cfg, lex))


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


def _audit_path(cfg: dict, config_path: Path) -> Path:
    return config_path.parent / cfg["audit"]


def _adjudications(cfg: dict, config_path: Path, chunk_dir: Path) -> list[dict]:
    """Every adjudicated row, oldest first — a later row for a word replaces an earlier one.

    The committed audit comes first: it is the durable record and survives a fresh clone or
    a wiped chunk dir. Chunk outputs follow, oldest file first, so the newest adjudication
    of a word wins — not the one whose file name sorts last. Words adjudicated differently
    in two chunk outputs are reported with the file that won."""
    audit = _audit_path(cfg, config_path)
    rows = vocab_kaikki.read_jsonl(audit) if audit.exists() else []
    files = sorted(chunk_dir.glob("chunk_*.out.jsonl"), key=lambda p: (p.stat().st_mtime, p.name)) \
        if chunk_dir.exists() else []
    seen: dict[str, tuple[dict, str]] = {}
    replaced: dict[str, str] = {}
    for f in files:
        for d in vocab_kaikki.read_jsonl(f):
            prev = seen.get(d["word"])
            if prev and prev[0] != d:
                replaced[d["word"]] = f.name
            seen[d["word"]] = (d, f.name)
            rows.append(d)
    if replaced:
        sample = ", ".join(f"{w} ← {f}" for w, f in list(replaced.items())[:5])
        print(f"note: {len(replaced)} words re-adjudicated in a newer chunk output: {sample}")
    return rows


def _adjudicated(cfg: dict, config_path: Path, chunk_dir: Path) -> set[str]:
    """Words that already have an adjudicated row, committed or in a chunk output."""
    return {d["word"] for d in _adjudications(cfg, config_path, chunk_dir)}


def _qa_reviewed(chunk_dir: Path) -> set[str]:
    """Clean words a review pass has read: in a ``chunk_qa_NN.json`` whose output exists.
    The reviewer writes rows only for words it changes, so the input file is the record."""
    return {d["word"] for p in chunk_dir.glob("chunk_qa_*.json")
            if p.with_name(p.stem + ".out.jsonl").exists()
            for d in json.loads(p.read_text(encoding="utf-8"))} if chunk_dir.exists() else set()


def _curated_reviewed(curated: Path) -> set[str]:
    """Words in the committed curated file other than unreviewed clean rows."""
    if not curated.exists():
        return set()
    return {r["word"] for r in vocab_kaikki.read_jsonl(curated)
            if r.get("source") != vocab_kaikki.UNREVIEWED}


def _write_chunks(out_dir: Path, stem: str, records: list[dict], chunk: int) -> int:
    """Write `records` as `<stem>NN.json` files of `chunk` records; return the file count."""
    out_dir.mkdir(parents=True, exist_ok=True)
    for i in range(0, len(records), chunk):
        (out_dir / f"{stem}{i//chunk:02d}.json").write_text(
            json.dumps(records[i:i + chunk], ensure_ascii=False, indent=1), encoding="utf-8")
    return -(-len(records) // chunk)


def _kaikki_curate(cfg: dict, config_path: Path, out_dir: Path, chunk: int,
                   batch_name: str | None) -> None:
    """Needs-LLM chunk files, minus words already adjudicated (so a deck can grow)."""
    done = _adjudicated(cfg, config_path, out_dir)
    batch = [vocab_kaikki.llm_record(c) for c in _kaikki_candidates(cfg)
             if c.needs_llm and c.word not in done]
    stem = f"chunk_{batch_name}_" if batch_name else "chunk_"
    n = _write_chunks(out_dir, stem, batch, chunk)
    print(f"wrote {n} chunk files ({len(batch)} needs-LLM words) to {out_dir}")
    print(f"→ adjudicate each chunk_NN.json per {cfg['policy']} into chunk_NN.out.jsonl,")
    print("  then `deck-vocab --merge` and `deck-vocab --build`.")


def _kaikki_review_clean(cfg: dict, config_path: Path, out_dir: Path, chunk: int) -> None:
    """Clean rows never reviewed (no reviewed curated row, not adjudicated) → `chunk_qa_NN`.

    The reviewer writes an adjudicated row to `chunk_qa_NN.out.jsonl` only for a row it
    changes (re-gloss or drop); that row overrides the clean row at `--merge`.
    """
    seen = _curated_reviewed(config_path.parent / cfg["curated"])
    seen |= _adjudicated(cfg, config_path, out_dir) | _qa_reviewed(out_dir)
    rows = []
    for c in _kaikki_candidates(cfg):
        if c.needs_llm or c.word in seen:
            continue
        r = vocab_kaikki.clean_row(c)
        rows.append({"word": r.word, "freq_rank": c.freq_rank, "hint": r.hint,
                     "gloss": r.gloss, "glosses": c.parts[0]["glosses"]})
    n = _write_chunks(out_dir, "chunk_qa_", rows, chunk)
    print(f"wrote {n} review files ({len(rows)} clean rows) to {out_dir}")


def _kaikki_merge(cfg: dict, config_path: Path, chunk_dir: Path) -> None:
    adjudicated = _adjudications(cfg, config_path, chunk_dir)
    curated = config_path.parent / cfg["curated"]
    reviewed = _curated_reviewed(curated) | _qa_reviewed(chunk_dir)
    cands = _kaikki_candidates(cfg)
    rows, audit = vocab_kaikki.merge_curated(cands, adjudicated, reviewed)
    aside = sorted({d["word"] for d in adjudicated} - {c.word for c in cands})
    if aside:
        print(f"warning: {len(aside)} adjudicated words are past target_n and set aside: "
              f"{aside[:10]}")
    vocab_kaikki.write_jsonl(curated, [vocab_kaikki.row_record(r) for r in rows])
    vocab_kaikki.write_jsonl(_audit_path(cfg, config_path), audit)
    dropped = sum(d["decision"] == "drop" for d in audit)
    unreviewed = sum(r.source == vocab_kaikki.UNREVIEWED for r in rows)
    print(f"merged {len(rows)} rows ({len(audit)} adjudicated, {dropped} dropped, "
          f"{unreviewed} clean rows unreviewed) → {curated}")


def _build(cfg: dict, curated_path: Path, config_path: Path, out_dir: Path) -> None:
    rows = vocab.load_curated(curated_path)
    words = [r.word for r in rows]
    assert len(set(words)) == len(words), "duplicate word → FSRS item_key collision"
    collisions = vocab.band_collisions(rows)
    assert not collisions, f"in-band gloss collisions (ambiguous rounds): {collisions[:10]}"
    if unreviewed := sum(r.source == vocab_kaikki.UNREVIEWED for r in rows):
        print(f"warning: {unreviewed} clean rows never reviewed — run --review-clean")
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
    p.add_argument("--tag-corpus", action="store_true",
                   help="de/pl: lemmatise the corpus sample → lemma_counts file")
    p.add_argument("--batch", help="de/pl --curate: name new chunks chunk_<batch>_NN")
    p.add_argument("--review-clean", action="store_true",
                   help="de/pl: unreviewed clean rows → chunk_qa_NN.json review files")
    p.add_argument("--chunk", type=int, default=100)
    args = p.parse_args(argv)

    cfg, curated, config_path = _load_cfg(args.config)
    kaikki = cfg.get("lang", "zh") in vocab_kaikki.LANGS
    if args.tag_corpus:
        if not kaikki:
            p.error("--tag-corpus is for de/pl configs")
        _tag_corpus(cfg)
    elif args.build:
        _build(cfg, curated, config_path, args.out)
    elif args.merge and kaikki:
        _kaikki_merge(cfg, config_path, _chunk_dir(args.out, cfg))
    elif args.merge:
        if "include" not in cfg:
            p.error("--merge for zh needs an `include` word list in the config")
        _zh_list_merge(cfg, config_path, _chunk_dir(args.out, cfg))
    elif args.review_clean:
        if not kaikki:
            p.error("--review-clean is for de/pl configs")
        _kaikki_review_clean(cfg, config_path, _chunk_dir(args.out, cfg), args.chunk)
    elif args.curate and kaikki:
        _kaikki_curate(cfg, config_path, _chunk_dir(args.out, cfg), args.chunk, args.batch)
    elif args.curate and "include" in cfg:
        _zh_list_curate(cfg, config_path, _chunk_dir(args.out, cfg), args.chunk)
    elif args.curate:
        _curate(cfg, args.seed_deck, args.out / "vocab_chunks", args.chunk)
    elif kaikki:
        _kaikki_preview(cfg)
    elif "include" in cfg:
        _zh_list_preview(cfg, config_path)
    else:
        _preview(cfg, args.seed_deck)


if __name__ == "__main__":
    main()
