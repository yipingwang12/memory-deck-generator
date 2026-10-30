"""Write ChatGPT prompt sheets for company memory scenes → results/generate_scene_images/<slug>/chatgpt-instant/realistic/prompts.md.

    uv run python scripts/chatgpt_scene_prompts.py SLUG [SLUG ...] [--force]

For drawing scenes by hand in a ChatGPT subscription instead of the paid Gemini API. Never
overwrites an existing prompts.md (it may hold hand-edited prompts) unless --force.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import yaml

from deck_generator import scene_images as si

COMPANIES = Path(__file__).resolve().parents[1] / 'configs' / 'companies'


def write_sheet(slug: str, force: bool) -> Path | None:
    scenes = yaml.safe_load((COMPANIES / f'{slug}.mnemonics.yaml').read_text())
    title = yaml.safe_load((COMPANIES / f'{slug}.yaml').read_text())['deck_name']
    path = si.image_dir(slug, model=si.CHATGPT_MODEL) / 'prompts.md'
    if path.exists() and not force:
        return None
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(si.chatgpt_sheet(scenes, title))
    return path


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument('slugs', nargs='+')
    ap.add_argument('--force', action='store_true', help='overwrite an existing prompts.md')
    args = ap.parse_args()
    for slug in args.slugs:
        if write_sheet(slug, args.force) is None:
            print(f'warning: {slug}: prompts.md exists, skipped (--force to overwrite)', file=sys.stderr)
    return 0


if __name__ == '__main__':
    sys.exit(main())
