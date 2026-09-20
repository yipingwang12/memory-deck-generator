#!/usr/bin/env python3
"""Extract body text from a two-column journal PROOF, dropping the margin line numbers.

    ./scripts/extract_proof_pdf.py cache/papers/<slug>.pdf configs/papers/<slug>.source.txt

An in-press proof carries a line number every line in both margins, and plain `pdftotext`
weaves them into the sentences — "the use of at least two 44 sequencing reads per UMI" — so
every quote a card is built from fails `deck-papers`' verbatim check for a reason that has
nothing to do with the card. `-layout` keeps them in their own column but leaves the reader
to guess column boundaries per page.

This crops by x-coordinate instead, one column at a time, using the word bounding boxes
`pdftotext -bbox` reports. Column edges are *measured per page*, not assumed: a proof's
front page carries a correspondence sidebar the body pages do not, and hardcoded offsets
would silently splice it into the abstract.

The heuristic: bucket every word's left edge, treat a bucket that is almost entirely bare
integers as a line-number margin, and take the remaining runs as columns in reading order.
It reports what it found so a bad split is visible rather than silently shipped.
"""
from __future__ import annotations

import argparse
import re
import subprocess
import sys
from pathlib import Path

WORD = re.compile(r'xMin="([\d.]+)"\s+yMin="([\d.]+)"\s+xMax="([\d.]+)"[^>]*>([^<]*)</word>')
BUCKET = 20
#: A bucket this pure in bare integers is a line-number margin, not prose carrying numbers.
MARGIN_DIGIT_SHARE = 0.8


def words(pdf: Path, page: int) -> list[tuple[float, float, float, str]]:
    out = subprocess.run(['pdftotext', '-f', str(page), '-l', str(page), '-bbox',
                          str(pdf), '-'], capture_output=True, text=True, check=True).stdout
    return [(float(a), float(b), float(c), d) for a, b, c, d in WORD.findall(out)]


def columns(ws: list[tuple[float, float, float, str]]) -> list[tuple[float, float]]:
    """(x_start, x_end) of each body column on this page, left to right."""
    buckets: dict[int, list[str]] = {}
    for x, _, _, text in ws:
        buckets.setdefault(int(x // BUCKET), []).append(text)
    body = sorted(b for b, texts in buckets.items()
                  if sum(t.isdigit() for t in texts) / len(texts) < MARGIN_DIGIT_SHARE)
    if not body:
        return []
    runs, start, prev = [], body[0], body[0]
    for b in body[1:]:
        if b != prev + 1:                       # a gap: the gutter between columns
            runs.append((start, prev))
            start = b
        prev = b
    runs.append((start, prev))
    return [(a * BUCKET - 2, (z + 1) * BUCKET + 2) for a, z in runs]


def crop(pdf: Path, page: int, x0: float, x1: float) -> str:
    return subprocess.run(
        ['pdftotext', '-f', str(page), '-l', str(page),
         '-x', str(int(x0)), '-y', '0', '-W', str(int(x1 - x0)), '-H', '10000',
         str(pdf), '-'], capture_output=True, text=True, check=True).stdout


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument('pdf', type=Path)
    ap.add_argument('out', type=Path)
    ap.add_argument('--min-width', type=float, default=80.0,
                    help='ignore narrow runs (page furniture, not a body column)')
    args = ap.parse_args()

    pages = int(subprocess.run(['pdfinfo', str(args.pdf)], capture_output=True, text=True,
                               check=True).stdout.split('Pages:')[1].split()[0])
    chunks = []
    for page in range(1, pages + 1):
        cols = [c for c in columns(words(args.pdf, page)) if c[1] - c[0] >= args.min_width]
        print(f'page {page:2d}: {len(cols)} column(s) '
              f"{['%d-%d' % (a, b) for a, b in cols]}", file=sys.stderr)
        for x0, x1 in cols:
            chunks.append(crop(args.pdf, page, x0, x1))

    text = '\n'.join(chunks)
    # Soft hyphens are a line-break artifact of the typesetter, invisible to a reader and
    # not folded by deck-papers' `normalise` — left in, every quote spanning one fails.
    text = re.sub('­\n', '', text).replace('­', '')
    args.out.write_text(text, encoding='utf-8')
    print(f'wrote {args.out} ({len(text)} chars)', file=sys.stderr)


if __name__ == '__main__':
    main()
