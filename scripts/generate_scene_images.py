"""Draw one picture per company memory scene → results/generate_scene_images/<slug>/<model>/<style>/.

    uv run python scripts/generate_scene_images.py alnylam_pharmaceuticals [--style realistic] [--only q01,q04] [--no-anchor] [--model M] [--dry-run]
    uv run python scripts/generate_scene_images.py SLUG [SLUG ...] --batch submit     # half price
    uv run python scripts/generate_scene_images.py --batch wait --state FILE

Anchor picture first, then each scene with the anchor as a reference. Skips images whose
prompt is unchanged (manifest.json), so a rerun only pays for new or edited scenes. In batch
mode the anchors are drawn directly (scenes need them), the scenes go to inline batches, and
`wait` polls with exponential backoff (1 min doubling, 30 min cap) then saves the results.
"""

from __future__ import annotations

import argparse
import json
import sys
import time
from datetime import datetime
from pathlib import Path

import yaml

from deck_generator import scene_images as si

ROOT = Path(__file__).resolve().parents[1]
STATE_DIR = si.ROOT / '_batches'


def _load_scenes(slug: str) -> dict:
    return yaml.safe_load((ROOT / 'configs' / 'companies' / f'{slug}.mnemonics.yaml').read_text())


def _draw(job: si.Job, out_dir: Path, key: str, model: str, reference: bytes | None) -> bool:
    try:
        image = si.generate(job.prompt, key, model, reference)
    except si.NoImage as e:
        print(f'{job.name}: {e}', file=sys.stderr)
        return False
    si.save_webp(image, out_dir / f'{job.name}.webp')
    si.record(out_dir, job, model)
    print(f'{job.name}: ok', flush=True)
    return True


def run_direct(args) -> int:
    slug = args.slugs[0]
    anchor_ref = not args.no_anchor
    out_dir = si.image_dir(slug, args.model, args.style, anchor_ref=anchor_ref)
    only = set(args.only.split(',')) if args.only else None
    jobs = si.plan(_load_scenes(slug), out_dir, args.style, only, anchor_ref)
    todo = [j for j in jobs if not j.done]
    print(f'{len(todo)} of {len(jobs)} images to draw with {args.model}, style {args.style}')
    if args.dry_run or not todo:
        return 0
    key = si.api_key()
    failed = []
    for job in todo:
        is_anchor = job.name == 'anchor'
        ref = si.reference_bytes(out_dir / 'anchor.webp') if anchor_ref and not is_anchor else None
        if not _draw(job, out_dir, key, args.model, ref):
            if is_anchor:
                return 1
            failed.append(job.name)
    if failed:
        print(f'failed: {", ".join(failed)}', file=sys.stderr)
    return 1 if failed else 0


def run_submit(args) -> int:
    """Draw missing anchors directly, then submit every missing scene as inline batches."""
    anchors, items = [], []
    for slug in args.slugs:
        out_dir = si.image_dir(slug, args.model, args.style)
        for job in si.plan(_load_scenes(slug), out_dir, args.style):
            if not job.done:
                item = si.BatchItem(f'{slug}/{job.name}', out_dir, job)
                (anchors if job.name == 'anchor' else items).append(item)
    print(f'{len(args.slugs)} companies: {len(anchors)} anchors to draw now, '
          f'{len(items)} scenes to batch with {args.model}, style {args.style}')
    if args.dry_run or not (anchors or items):
        return 0
    key = si.api_key()
    for a in anchors:
        if not _draw(a.job, a.out_dir, key, args.model, None):
            return 1
    refs: dict[Path, bytes] = {}
    entries = []
    for it in items:
        if it.out_dir not in refs:
            refs[it.out_dir] = si.reference_bytes(it.out_dir / 'anchor.webp')
        entries.append(si.batch_entry(it, refs[it.out_dir]))
    stamp = datetime.now().strftime('%Y%m%d-%H%M%S')
    names = [si.submit_batch(c, key, args.model, f'scenes-{stamp}-{n}')
             for n, c in enumerate(si.chunk(entries))]
    STATE_DIR.mkdir(parents=True, exist_ok=True)
    state = STATE_DIR / f'{stamp}.json'
    state.write_text(json.dumps({
        'model': args.model, 'style': args.style, 'batches': names,
        'items': {it.key: {'out_dir': str(it.out_dir), 'name': it.job.name, 'prompt': it.job.prompt}
                  for it in items}}, indent=2) + '\n')
    print(f'submitted {len(names)} batch(es): {", ".join(names)}\nstate: {state}')
    return 0


def run_wait(args) -> int:
    """Poll every batch in the state file until finished, then save its images."""
    state = json.loads(Path(args.state).read_text())
    key = si.api_key()
    delay, pending, ops = 60, list(state['batches']), {}
    while pending:
        for name in list(pending):
            op = si.get_batch(name, key)
            st = si.batch_state(op)
            print(f'{datetime.now():%H:%M} {name}: {st}', flush=True)
            if si.batch_finished(st):
                ops[name] = op
                pending.remove(name)
        if pending:
            time.sleep(delay)
            delay = min(delay * 2, 1800)
    saved, failed = 0, []
    for op in ops.values():
        for k, result in si.batch_results(op).items():
            meta = state['items'].get(k)
            if meta is None:
                continue
            if isinstance(result, str):
                failed.append(f'{k}: {result}')
                continue
            out_dir = Path(meta['out_dir'])
            si.save_webp(result, out_dir / f"{meta['name']}.webp")
            si.record(out_dir, si.Job(meta['name'], meta['prompt']), state['model'])
            saved += 1
    missing = len(state['items']) - saved - len(failed)
    print(f'saved {saved} images; {len(failed)} failed; {missing} absent from the results')
    for f in failed:
        print(f'  {f}', file=sys.stderr)
    return 0 if not failed and not missing else 1


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('slugs', nargs='*')
    ap.add_argument('--model', default=si.DEFAULT_MODEL)
    ap.add_argument('--style', default=si.DEFAULT_STYLE, choices=sorted(si.STYLES))
    ap.add_argument('--only', help='comma-separated qids; the anchor is always drawn')
    ap.add_argument('--no-anchor', action='store_true',
                    help='no anchor reference picture; the model draws its own anchor each time')
    ap.add_argument('--batch', choices=('submit', 'wait'))
    ap.add_argument('--state', help='batch state file written by --batch submit')
    ap.add_argument('--dry-run', action='store_true', help='list what would be drawn; no API call')
    args = ap.parse_args()
    if args.batch == 'wait':
        return run_wait(args)
    if not args.slugs:
        ap.error('name at least one company slug')
    if args.batch == 'submit':
        return run_submit(args)
    if len(args.slugs) != 1:
        ap.error('direct mode takes one slug; use --batch submit for several')
    return run_direct(args)


if __name__ == '__main__':
    sys.exit(main())
