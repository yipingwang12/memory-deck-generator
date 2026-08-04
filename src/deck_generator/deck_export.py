"""Export quiz decks as self-contained JSON artifacts — the generator→quiz boundary.

Runs the generation pipeline (Gutenberg/Wikidata) once and writes one artifact per
deck to ``data/decks/``. The quiz reads these instead of regenerating content live,
so it needs neither the configs nor any generation/network code.

Discovery iteration mirrors ``deck_loader.discover_decks`` so ``config_path``,
``poem_title``, ``group``, ``name`` and ``mode`` are byte-identical — preserving deck
ids and FSRS item keys (``sha256(item)[:16]``) across the migration.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass
from fnmatch import fnmatch
from pathlib import Path

import sys

import yaml

from .artwork_images import fetch_raw, to_webp
from .artworks import (
    apply_corrections, fetch_artworks_cached, parse_artwork_corrections, stale_corrections,
)
from .corruptions import build_pool, classify, pool_warnings
from .distractors import build_choices
from .equations import annotate, eligible_indices, load_equations, to_mathml
from .gutenberg import fetch_text
from .monarchs import (
    correction_years, fetch_monarchs, filter_by_accession, make_monarch_chunks, parse_corrections,
)
from .poetry_parser import extract_poem
from .wikisource import fetch_text as fetch_wikisource_text

_ROOT = Path(__file__).resolve().parent.parent.parent
DEFAULT_CONFIG_DIR = _ROOT / 'configs'
DEFAULT_DECKS_DIR = _ROOT / 'data' / 'decks'
CACHE_DIR = _ROOT / 'cache' / 'artworks'

# Set by main() --refresh-metadata; bypasses the persisted SPARQL metadata cache for this run.
REFRESH_METADATA = False
CACHE_ONLY = False        # --cache-only: never download, assemble from the image cache

# Monarch decks come from separate per-realm configs but share one collapsible menu
# group in the quiz (like poetry's collection_title). Overridable per-config via `group:`.
_MONARCH_GROUP = 'Monarchs'
_DEFAULT_CORRUPTION_TYPES = ('sign_flip', 'exponent_off_by_one', 'constant_perturb', 'variable_swap')
_EQUATION_GROUP = 'Equations'
_ARTWORK_GROUP = 'Artworks'


def config_hash(path: Path) -> str:
    """Session ``cfg_hash`` carried into each artifact — sha256 of the config bytes.

    Kept here (not imported from the quiz) so the generator stays standalone after
    the quiz split. Must match the quiz's ``logger.config_hash`` exactly.
    """
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def _slug(text: str) -> str:
    """Filesystem-safe slug for disambiguating multi-poem artifact filenames."""
    return re.sub(r'-+', '-', re.sub(r'[^a-z0-9]+', '-', text.lower())).strip('-')


@dataclass(frozen=True)
class _Slot:
    """One deck's identity, resolved WITHOUT touching the network.

    ``order`` and the artifact filename must be assigned across the *whole* config set,
    never the selected subset — otherwise `--only` would renumber decks it isn't rebuilding
    and shuffle the quiz's deck list."""

    order: int
    deck_type: str
    yaml_path: Path
    poem_cfg: dict | None      # poetry: the per-poem config block; monarchs: None
    group: str | None
    filename: str = ''


def _discover_slots(config_dir: Path) -> list[_Slot]:
    """Every deck's order + filename, from configs alone. Mirrors build order exactly."""
    slots: list[_Slot] = []
    order = 0
    for yaml_path in sorted(Path(config_dir).glob('poetry/*.yaml')):
        cfg = yaml.safe_load(yaml_path.read_text())
        poems = cfg.get('poems', [cfg])          # no fetch needed to enumerate poems
        group = cfg.get('collection_title') if 'poems' in cfg else None
        for pc in poems:
            slots.append(_Slot(order, 'poetry', yaml_path, pc, group))
            order += 1
    for yaml_path in sorted(Path(config_dir).glob('monarchs/*.yaml')):
        cfg = yaml.safe_load(yaml_path.read_text())
        slots.append(_Slot(order, 'monarchs', yaml_path, None, cfg.get('group', _MONARCH_GROUP)))
        order += 1
    for yaml_path in sorted(Path(config_dir).glob('artworks/*.yaml')):
        cfg = yaml.safe_load(yaml_path.read_text())
        slots.append(_Slot(order, 'artworks', yaml_path, None, cfg.get('group', _ARTWORK_GROUP)))
        order += 1
    for yaml_path in sorted(Path(config_dir).glob('equations/*.yaml')):
        cfg = yaml.safe_load(yaml_path.read_text())
        group = cfg.get('group', _EQUATION_GROUP)
        # One config → two decks, split by how many errors each equation can support (a card
        # whose pool can't vary two positions would just repeat them). poem_cfg carries the
        # variant, disambiguated by poem_title exactly like a poetry collection's poems.
        for variant, ptitle in (('two', '2 errors'), ('one', '1 error')):
            slots.append(_Slot(order, 'equations', yaml_path,
                               {'variant': variant, 'poem_title': ptitle}, group))
            order += 1

    per_config: dict[Path, int] = {}
    for s in slots:
        per_config[s.yaml_path] = per_config.get(s.yaml_path, 0) + 1
    used: set[str] = set()
    return [
        _Slot(s.order, s.deck_type, s.yaml_path, s.poem_cfg, s.group,
              _slot_filename(s, per_config[s.yaml_path] > 1, used))
        for s in slots
    ]


def _slot_filename(s: _Slot, multi: bool, used: set[str]) -> str:
    """Readable, unique ``<type>_<config-stem>[_<poem-slug>].json`` name."""
    base = f"{s.deck_type}_{s.yaml_path.stem}"
    if multi and s.poem_cfg is not None:
        base = f"{base}_{_slug(s.poem_cfg['poem_title'])}"
    name, n = base, 2
    while name in used:
        name, n = f"{base}-{n}", n + 1
    used.add(name)
    return f"{name}.json"


def _poem_source_text(cfg: dict, poem_cfg: dict, text_cache: dict) -> str:
    """Plain text a poem's markers are matched against, from whichever source holds it.

    Gutenberg gives one text per *book* (every sonnet cut from Gutenberg 1041); Wikisource
    gives one per *page*, and a collection like the Duineser Elegien is a page per poem.
    Both cache on their natural key, so a shared book is fetched once and a per-poem page
    is fetched once each.
    """
    if cfg.get('gutenberg_id'):
        key = ('gutenberg', cfg['gutenberg_id'])
        if key not in text_cache:
            text_cache[key] = fetch_text(cfg['gutenberg_id'])
        return text_cache[key]
    page = poem_cfg.get('page') or cfg.get('page')
    if not page:
        raise ValueError(
            f"poem {poem_cfg.get('poem_title', '?')!r}: config must give `gutenberg_id` "
            f"or a Wikisource `page`")
    lang = cfg.get('wikisource_lang', 'de')
    key = ('wikisource', lang, page)
    if key not in text_cache:
        text_cache[key] = fetch_wikisource_text(page, lang=lang)
    return text_cache[key]


def build_deck_artifacts(config_dir: Path, only: str | None = None) -> list[dict]:
    """Run generation and return one artifact dict per deck (see module docstring).

    ``only`` is an fnmatch pattern over artifact filenames (e.g. ``monarchs_britain`` or
    ``monarchs_*``); non-matching decks are skipped entirely — not fetched, not built —
    while still consuming their ``order``."""
    slots = _discover_slots(config_dir)
    wanted = [s for s in slots if _slot_selected(s, only)]
    artifacts: list[dict] = []
    text_cache: dict[tuple, str] = {}       # ('gutenberg', id) | ('wikisource', lang, page)

    for s in wanted:
        if s.deck_type != 'poetry':
            continue
        cfg = yaml.safe_load(s.yaml_path.read_text())
        pc = s.poem_cfg
        title = pc['poem_title']
        source_text = _poem_source_text(cfg, pc, text_cache)
        items = [l for l in extract_poem(source_text, pc['start_marker'], pc['end_marker'])
                 if l is not None]
        artifacts.append({
            'order': s.order,
            'name': title,
            'deck_type': 'poetry',
            'mode': 'words',
            'title': title,
            'items': items,
            'labels': None,
            'group': s.group,
            'poem_title': title,
            # Which shared lexicon glosses this deck in preview (None = English, no gloss).
            'language': cfg.get('language'),
            'config_path': str(s.yaml_path),
            'config_hash': config_hash(s.yaml_path),
            '_filename': s.filename,
        })

    for s in wanted:
        if s.deck_type != 'monarchs':
            continue
        cfg = yaml.safe_load(s.yaml_path.read_text())
        title = cfg.get('subject', s.yaml_path.stem)
        monarchs = fetch_monarchs(cfg['positions'], house_ids=cfg.get('houses'))
        monarchs = filter_by_accession(monarchs, cfg.get('accession_min_year'), cfg.get('accession_max_year'))
        add_years, drop_years = correction_years(parse_corrections(cfg.get('corrections')))
        chunks = make_monarch_chunks(
            monarchs, cfg.get('chunk_years', 100), cfg.get('chunk_start_year'),
            add_transition_years=add_years, drop_transition_years=drop_years,
        )
        artifacts.append({
            'order': s.order,
            'name': title,
            'deck_type': 'monarchs',
            'mode': 'digits',
            'title': title,
            'items': [c.transition_string for c in chunks],
            'labels': [f"{c.start_year}–{c.end_year}" for c in chunks],
            'group': s.group,
            'poem_title': None,
            'config_path': str(s.yaml_path),
            'config_hash': config_hash(s.yaml_path),
            '_filename': s.filename,
        })

    for s in wanted:
        if s.deck_type != 'artworks':
            continue
        artifacts.append(_build_artwork_deck(s))

    _EQ_POOL_CACHE.clear()   # per-run; the two variant slots of a config share it
    for s in wanted:
        if s.deck_type != 'equations':
            continue
        deck = _build_equation_deck(s)
        if deck is not None:          # a variant with no qualifying equations is omitted
            artifacts.append(deck)

    artifacts.sort(key=lambda a: a['order'])
    return artifacts


def _build_artwork_deck(s: _Slot) -> dict:
    """Fetch metadata + images and expand to a two-card-per-artwork artifact.

    Each artwork becomes two FSRS cards — ``<QID>|title`` and ``<QID>|creator`` — keyed on
    the QID, not the answer text, so a corrected label or a re-fetched image never strands
    history. Images are downsized to WebP under ``assets/<deck>/<QID>.webp`` (attached as
    ``_assets`` for ``export_decks`` to write beside the JSON). An artwork whose image can't
    be fetched is skipped (warned), not fatal.
    """
    cfg = yaml.safe_load(s.yaml_path.read_text())
    title = cfg.get('deck_name', s.yaml_path.stem)
    dcfg = cfg.get('distractors') or {}
    count, bias = dcfg.get('count', 4), dcfg.get('same_creator_bias', True)
    px = cfg.get('image_px', 480)
    deck_stem = s.filename.removesuffix('.json')

    # Corrections must land BEFORE build_choices: distractors are drawn from other works'
    # creator values and biased by same-creator, so choosing them from an uncorrected creator
    # would build the options around a premise the answer no longer holds.
    arts = fetch_artworks_cached(cfg, refresh=REFRESH_METADATA)
    corrections = parse_artwork_corrections(cfg.get('corrections'))
    for note in stale_corrections(arts, corrections):
        print(f'  ! artworks corrections: {note}', file=sys.stderr)
    arts = apply_corrections(arts, corrections)
    choices = {'title': build_choices(arts, 'title', count, bias),
               'creator': build_choices(arts, 'creator', count, bias)}

    # Download + WebP-encode images concurrently: serial + a per-image throttle would take
    # hours at 10k scale. A thread pool naturally spaces requests; fetch_raw's 429 Retry-After
    # backoff remains the politeness safety valve, and cached originals skip the network.
    workers = cfg.get('image_workers', 8)
    # checkpoint: assemble only already-downloaded works (config, or --cache-only for a
    # one-off re-export that must not change the work set)
    cache_only = cfg.get('cache_only', False) or CACHE_ONLY
    hint = max(640, px * 2)  # a modest thumbnail is plenty for a px-sized WebP (was 1024)

    def _grab(a):
        rel = f'assets/{deck_stem}/{a.qid}.webp'
        try:
            raw = fetch_raw(a.image_url, CACHE_DIR, a.qid, hint_width=hint, cache_only=cache_only)
            return a.qid, rel, to_webp(raw, px), None
        except Exception as e:  # dead/oversized image — skip this artwork, keep the deck
            return a.qid, rel, None, e

    assets: dict[str, bytes] = {}
    rel_by_qid: dict[str, str] = {}
    with ThreadPoolExecutor(max_workers=workers) as ex:
        for qid, rel, webp, err in ex.map(_grab, arts):
            if err is not None:
                print(f'  ! {qid}: image fetch failed ({err}); skipped', file=sys.stderr)
                continue
            assets[rel] = webp
            rel_by_qid[qid] = rel

    items, labels, prompts, answers, imgs, opts, links = [], [], [], [], [], [], []
    for a in arts:  # assemble in fame order, keeping only successfully-imaged works
        rel = rel_by_qid.get(a.qid)
        if rel is None:
            continue
        for attr in ('title', 'creator'):
            if attr == 'creator' and not a.creator:
                continue  # anonymous work → title-only card (no impossible creator card)
            items.append(f'{a.qid}|{attr}')
            labels.append(f'{a.title} — {attr}')
            prompts.append(attr)
            answers.append(getattr(a, attr))
            imgs.append(rel)
            opts.append(choices[attr][a.qid])
            links.append(a.sitelinks)      # fame count; the deck's only "how known is it"

    return {
        'order': s.order,
        'name': title,
        'deck_type': 'artworks',
        'mode': 'image-mc',
        'title': title,
        'items': items,
        'labels': labels,
        'prompts': prompts,
        'answers': answers,
        'img': imgs,
        'choices': opts,
        'sitelinks': links,
        'group': s.group,
        'poem_title': None,
        'config_path': str(s.yaml_path),
        'config_hash': config_hash(s.yaml_path),
        '_assets': assets,
        '_filename': s.filename,
    }


def _slot_selected(s: _Slot, only: str | None) -> bool:
    return only is None or fnmatch(s.filename.removesuffix('.json'), only)


def _is_manual(path: Path) -> bool:
    """True if ``path`` is a hand-authored artifact this generator does not produce
    (``source: manual`` — e.g. the CC-CEDICT vocab deck). A full export clears the
    output dir, but these have no generator config to rebuild from, so wiping them
    would delete committed content. Unreadable/malformed files are treated as
    generated (cleared for an authoritative rebuild)."""
    try:
        return json.loads(path.read_text(encoding='utf-8')).get('source') == 'manual'
    except (OSError, ValueError):
        return False


def find_orphan_artifacts(config_dir: Path, decks_dir: Path) -> list[Path]:
    """Artifacts in ``decks_dir`` that no config would produce any more.

    Deleting a config removes the recipe but not the already-built artifact: ``decks_dir``
    is gitignored build output, and a partial run (``only``) deliberately skips the
    stale-clear. The orphan then survives every targeted re-export, and the orchestrator's
    ``decks`` sync copies it onward verbatim — so a deck deleted on purpose can reappear in
    the quiz weeks later (the Shakespeare sonnet decks did exactly this, 2026-07-15 →
    2026-07-25). Cheap to check: ``_discover_slots`` reads configs only, no network.

    ``source: manual`` decks are never orphans — they are hand-authored and have no config
    to be built from, which is why the stale-clear preserves them too.
    """
    expected = {s.filename for s in _discover_slots(config_dir)}
    return sorted(p for p in Path(decks_dir).glob('*.json')
                  if p.name not in expected and not _is_manual(p))


def _warn_orphans(config_dir: Path, decks_dir: Path) -> list[Path]:
    orphans = find_orphan_artifacts(config_dir, decks_dir)
    if orphans:
        print(f'  ! {len(orphans)} artifact(s) in {decks_dir} have no config — a deleted '
              f'config leaves its build output behind, and the sync copies it onward:',
              file=sys.stderr)
        for p in orphans:
            print(f'  !   {p.name}', file=sys.stderr)
        print('  ! delete them, or run a full export (no --only) to clear them',
              file=sys.stderr)
    return orphans


def export_decks(config_dir: Path = DEFAULT_CONFIG_DIR,
                 decks_dir: Path = DEFAULT_DECKS_DIR,
                 only: str | None = None,
                 reset_identity: bool = False) -> list[Path]:
    """Write deck artifacts to ``decks_dir`` and return their paths.

    A full export (``only=None``) clears ``decks_dir`` first — a rebuild is authoritative
    — but preserves hand-authored ``source: manual`` artifacts (see ``_is_manual``), which
    have no generator config to rebuild from. With ``only``, nothing is cleared and only
    matching decks are overwritten; their
    ``order`` and ``config_path`` are taken from the existing artifact when one is present.
    Those two fields are IDENTITY, not content: ``config_path`` keys the quiz's sessions
    table (`WHERE config_path=?`) and its artifact lookup, and ``order`` drives deck-list
    sort. Re-deriving them during a partial refresh would strand study history and shuffle
    the list — the export directory is an accumulation across runs, so a fresh numbering
    agrees with neither. Pass ``reset_identity=True`` to re-derive them anyway (e.g. after
    genuinely moving the repo).
    """
    decks_dir = Path(decks_dir)
    decks_dir.mkdir(parents=True, exist_ok=True)
    if only is None:  # full rebuild is authoritative: drop stale JSON *and* image assets
        for stale in decks_dir.glob('*.json'):
            if not _is_manual(stale):
                stale.unlink()
        _rmtree(decks_dir / 'assets')

    artifacts = build_deck_artifacts(config_dir, only=only)
    written: list[Path] = []
    for a in artifacts:
        a = dict(a)
        path = decks_dir / a.pop('_filename')
        assets = a.pop('_assets', None)
        if only is not None and not reset_identity and path.exists():
            prev = json.loads(path.read_text(encoding='utf-8'))
            a['order'] = prev.get('order', a['order'])
            a['config_path'] = prev.get('config_path', a['config_path'])
        if assets is not None:
            _write_assets(decks_dir, deck_stem=path.stem, assets=assets)
        path.write_text(json.dumps(a, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        written.append(path)

    # Runs after every export, not just partial ones: on a full rebuild the clear above
    # means there should be none, so a hit there signals a filename/slot mismatch instead.
    _warn_orphans(config_dir, decks_dir)
    return written


def _rmtree(path: Path) -> None:
    for child in sorted(path.glob('**/*'), reverse=True):
        child.unlink() if child.is_file() else child.rmdir()
    if path.exists():
        path.rmdir()


def _write_assets(decks_dir: Path, deck_stem: str, assets: dict[str, bytes]) -> None:
    """Sync this deck's asset subfolder to exactly ``assets``, writing only what differs.

    Rebuilt in lockstep with the JSON on both a full run and an ``--only`` refresh — the
    ``img`` paths in the artifact are relative to ``decks_dir``. A file the deck no longer
    references is deleted, so a dropped artwork never lingers.

    **Content-aware, not wholesale.** ``to_webp`` is deterministic, so re-exporting an
    unchanged image cache regenerates byte-identical files, and rewriting all of them
    restated ~150 MB per run to produce no change at all. Note this skips the *write*, not
    the re-encode — that happens upstream in ``_build_artwork_deck``'s thread pool and is
    only avoidable by caching the fetch itself. The saving that matters is downstream: these
    files are Git LFS-tracked in the quiz repo, and a correction touching one answer string
    should not restate 5.5k blobs. Comparing bytes (rather than trusting mtime or size, which
    a re-encode can preserve while content changes) keeps the guarantee that the tree always
    ends up matching ``assets``.
    """
    root = decks_dir / 'assets' / deck_stem
    root.mkdir(parents=True, exist_ok=True)
    wanted = {(decks_dir / rel).resolve() for rel in assets}
    for existing in root.glob('**/*'):
        if existing.is_file() and existing.resolve() not in wanted:
            existing.unlink()
    for rel, data in assets.items():
        dest = decks_dir / rel
        dest.parent.mkdir(parents=True, exist_ok=True)
        if dest.exists() and dest.read_bytes() == data:
            continue
        dest.write_bytes(data)


def main(argv=None) -> None:
    p = argparse.ArgumentParser(description='Export quiz decks as JSON artifacts.')
    p.add_argument('--config-dir', type=Path, default=DEFAULT_CONFIG_DIR)
    p.add_argument('--out', type=Path, default=DEFAULT_DECKS_DIR)
    p.add_argument('--only', default=None, metavar='GLOB',
                   help="Only rebuild decks whose artifact name matches (e.g. 'monarchs_britain', "
                        "'monarchs_*'). Others are left untouched and not fetched. Without it, "
                        "the output directory is CLEARED and every deck rebuilt "
                        "(hand-authored source:manual artifacts are preserved).")
    p.add_argument('--refresh-metadata', action='store_true',
                   help="Re-query Wikidata for artwork metadata instead of reusing "
                        "cache/artworks_meta.json (use when upstream data has changed).")
    p.add_argument('--cache-only', action='store_true',
                   help="Assemble artwork decks from already-downloaded images only, adding "
                        "nothing from the network. Keeps the deck's work set exactly as shipped "
                        "when re-exporting for an unrelated change (same as config cache_only, "
                        "without editing the config).")
    p.add_argument('--reset-identity', action='store_true',
                   help="With --only, re-derive order/config_path instead of preserving the "
                        "existing artifact's. Strands session history keyed on config_path.")
    args = p.parse_args(argv)
    global REFRESH_METADATA, CACHE_ONLY
    REFRESH_METADATA = args.refresh_metadata
    CACHE_ONLY = args.cache_only
    written = export_decks(args.config_dir, args.out, only=args.only,
                           reset_identity=args.reset_identity)
    scope = f"matching {args.only!r}" if args.only else 'all'
    print(f'Wrote {len(written)} deck artifacts ({scope}) to {args.out}')


_EQ_POOL_CACHE: dict[str, list[dict]] = {}

# Persistent, deterministic pool cache — building an equation's verified corruption pool is
# sympy-heavy (seconds each), so with ~300 equations/deck a full re-export is minutes. The pool
# depends only on (latex, corruption config), so it is cached to disk keyed by their hash.
# ``_POOL_ENGINE_VERSION`` MUST be bumped whenever ``corruptions.py`` / ``normalise.py`` change
# — otherwise a verifier fix would silently keep serving stale pools.
_POOL_ENGINE_VERSION = 'v2-numeric-residue-2026-07-23'
_POOL_CACHE_PATH = _ROOT / 'cache' / 'equation_pools.json'
_PERSIST_POOL_CACHE: dict[str, dict] | None = None


def _pool_cache_key(latex: str, types, pool_size: int) -> str:
    payload = json.dumps([latex, sorted(types), pool_size, _POOL_ENGINE_VERSION], ensure_ascii=False)
    return hashlib.sha256(payload.encode()).hexdigest()


# Committed sidecar of LLM-generated + adversarially-verified corruption pools for equations
# sympy cannot verify (boolean/set/info-theory/matrix notation). Authoritative over build_pool
# and independent of the engine version — these were never sympy-derived. Always 1-error
# (`kind='one'`): a single adversarially-verified corruption has no pairwise-cancellation risk.
_LLM_POOLS_PATH = _ROOT / 'configs' / 'equations' / 'llm_pools.json'
_LLM_POOLS: dict[str, dict] | None = None


def _norm_latex(s: str) -> str:
    return re.sub(r'\s+', '', s or '')


def _load_llm_pools() -> dict[str, dict]:
    global _LLM_POOLS
    if _LLM_POOLS is None:
        try:
            _LLM_POOLS = json.loads(_LLM_POOLS_PATH.read_text())
        except (OSError, ValueError):
            _LLM_POOLS = {}
    return _LLM_POOLS


def _load_persist_pool_cache() -> dict[str, dict]:
    global _PERSIST_POOL_CACHE
    if _PERSIST_POOL_CACHE is None:
        try:
            _PERSIST_POOL_CACHE = json.loads(_POOL_CACHE_PATH.read_text())
        except (OSError, ValueError):
            _PERSIST_POOL_CACHE = {}
    return _PERSIST_POOL_CACHE


def _save_persist_pool_cache() -> None:
    if _PERSIST_POOL_CACHE is None:
        return
    _POOL_CACHE_PATH.parent.mkdir(parents=True, exist_ok=True)
    _POOL_CACHE_PATH.write_text(json.dumps(_PERSIST_POOL_CACHE, ensure_ascii=False))


def _equation_rows(yaml_path: Path) -> list[dict]:
    """Build every equation's MathML + verified pool once per config, cached so a config's
    two variant slots don't each re-run the (sympy-heavy) verification. Pools also persist to
    a disk cache (``cache/equation_pools.json``) so unchanged equations skip sympy entirely on
    re-export."""
    key = str(yaml_path)
    if key in _EQ_POOL_CACHE:
        return _EQ_POOL_CACHE[key]
    cfg = yaml.safe_load(yaml_path.read_text())
    ccfg = cfg.get('corruption') or {}
    types = ccfg.get('types', list(_DEFAULT_CORRUPTION_TYPES))
    pool_size = ccfg.get('pool_size', 12)
    persist = _load_persist_pool_cache()
    llm = _load_llm_pools()
    rows, dirty = [], False
    for eq in load_equations(cfg):
        clean = to_mathml(eq.latex)
        recovered = llm.get(_norm_latex(eq.latex))
        if recovered is not None:                      # LLM-verified pool, forced 1-error
            pool, bad, kind = recovered['pool'], [], 'one'
        else:
            ckey = _pool_cache_key(eq.latex, types, pool_size)
            hit = persist.get(ckey)
            if hit is not None:
                pool, bad = hit['pool'], hit['bad']
            else:
                pool, bad = build_pool(eq, types, pool_size)
                persist[ckey] = {'pool': pool, 'bad': bad}
                dirty = True
            kind = classify(pool, bad)
        rows.append({
            'eq': eq, 'pool': pool, 'bad': bad, 'kind': kind,
            'mathml': annotate(clean, eligible_indices(clean)),
        })
    if dirty:
        _save_persist_pool_cache()
    _EQ_POOL_CACHE[key] = rows
    return rows


def _build_equation_deck(s: _Slot) -> dict | None:
    """One variant ('two' or 'one' errors) of a curated equation config.

    Equations are partitioned by ``classify``: an equation supporting several distinct
    two-error pairs goes to the 2-error deck, one with a usable but thin pool to the 1-error
    deck, and one with no verified corruption is dropped (warned). A variant with no
    qualifying equations yields no deck (``None``).

    The ``item`` is the canonical LaTeX, so ``item_key`` depends only on the equation — an
    equation that later moves between the two decks keeps its FSRS history.
    """
    variant = s.poem_cfg['variant']
    ptitle = s.poem_cfg['poem_title']
    cfg = yaml.safe_load(s.yaml_path.read_text())
    base = cfg.get('deck_name', s.yaml_path.stem)

    rows = _equation_rows(s.yaml_path)
    if variant == 'two':
        for r in rows:
            if r['kind'] == 'drop':
                print(f"  ! {r['eq'].label!r}: no verified corruption — dropped", file=sys.stderr)
        for w in (w for r in rows if r['kind'] == 'two'
                  for w in pool_warnings(r['eq'], r['pool'], r['bad'])):
            print(f'  ! {w}', file=sys.stderr)

    chosen = [r for r in rows if r['kind'] == variant]
    if not chosen:
        return None

    return {
        'order': s.order,
        'name': f'{base} ({ptitle})',
        'deck_type': 'equations',
        'mode': 'error-spot',
        'title': f'{base} ({ptitle})',
        'n_wrong': 2 if variant == 'two' else 1,
        'items': [r['eq'].latex for r in chosen],
        'labels': [r['eq'].label for r in chosen],
        'mathml': [r['mathml'] for r in chosen],
        'pool': [r['pool'] for r in chosen],
        'bad_pairs': [r['bad'] for r in chosen],
        'group': s.group,
        'poem_title': ptitle,
        'config_path': str(s.yaml_path),
        'config_hash': config_hash(s.yaml_path),
        '_filename': s.filename,
    }


# MUST stay the last statement in this module. Under `python -m deck_generator.deck_export`
# the file executes top-to-bottom as __main__, so a guard placed mid-file calls main() before
# the definitions below it exist (this sat above _EQ_POOL_CACHE and raised NameError). The
# `deck-export` console script hid it: an entry point imports the module fully first, so only
# the -m form — the one the orchestrator's Dagster asset uses — ever broke.
if __name__ == "__main__":
    main()
