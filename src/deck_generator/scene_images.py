"""Generated pictures for company memory scenes (Gemini image API, REST via ``requests``).

One anchor picture per company is made first and sent as a reference with every scene, so the
anchor (Alnylam's LAMB) looks the same in all of them. A manifest records each image's prompt,
so a changed scene is redrawn and an unchanged one is skipped.
"""

from __future__ import annotations

import base64
import hashlib
import io
import json
import subprocess
import time
from dataclasses import dataclass
from pathlib import Path

import requests
from PIL import Image

ROOT = Path(__file__).resolve().parents[2] / 'results' / 'generate_scene_images'
API = 'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent'
DEFAULT_MODEL = 'gemini-3.1-flash-image'
KEYCHAIN_SERVICE = 'gemini-api-key'
MANIFEST = 'manifest.json'

_NO_TEXT = ('Each named object is large, clear and easy to recognise. '
            'No text, letters, numbers or captions anywhere in the image.')
STYLES = {
    'storybook': f'Bright, simple storybook illustration on a plain light background. {_NO_TEXT}',
    'realistic': ('Photorealistic image, natural light, real materials and textures, '
                  f'uncluttered plain background. {_NO_TEXT}'),
}
DEFAULT_STYLE = 'realistic'


class NoImage(RuntimeError):
    """The API answered without an image (safety block, text-only reply)."""


@dataclass
class Job:
    name: str           # 'anchor' or the card qid; also the file stem
    prompt: str
    done: bool = False

    @property
    def digest(self) -> str:
        return hashlib.sha256(self.prompt.encode()).hexdigest()[:16]


def anchor_prompt(anchor: str, style: str = DEFAULT_STYLE) -> str:
    return (f'A single {anchor.lower()}, full body, facing the viewer, '
            f'as a character reference. {STYLES[style]}')


def scene_prompt(scene: str, anchor: str, style: str = DEFAULT_STYLE,
                 anchor_ref: bool = True) -> str:
    """``anchor_ref``: an anchor picture rides along as a reference, so the prompt asks to match it."""
    ref = f' The {anchor.lower()} must look exactly like the reference image.' if anchor_ref else ''
    return (f'Draw this memory scene: "{scene}" The image is a mnemonic aid: it must help a '
            f'reader remember the objects written in capitals, so every one of them must be '
            f'clearly visible. Make the scene striking, memorable or strange in some way, '
            f'because unusual images are easier to recall.{ref} {STYLES[style]}')


def request_body(prompt: str, reference: bytes | None = None) -> dict:
    """``reference``: the anchor picture as JPEG bytes (``reference_bytes``)."""
    parts: list[dict] = [{'text': prompt}]
    if reference is not None:
        parts.append({'inline_data': {'mime_type': 'image/jpeg',
                                      'data': base64.b64encode(reference).decode()}})
    return {'contents': [{'parts': parts}],
            'generationConfig': {'responseModalities': ['IMAGE']}}


def extract_image(response: dict) -> bytes:
    """The first image in a generateContent response, else NoImage naming the reason."""
    candidates = response.get('candidates') or []
    for cand in candidates:
        for part in (cand.get('content') or {}).get('parts') or []:
            data = (part.get('inlineData') or part.get('inline_data') or {}).get('data')
            if data:
                return base64.b64decode(data)
    reason = candidates[0].get('finishReason') if candidates else response.get('promptFeedback')
    raise NoImage(f'no image in response: {reason}')


def _manifest(out_dir: Path) -> dict:
    path = out_dir / MANIFEST
    return json.loads(path.read_text()) if path.exists() else {}


def plan(scenes: dict, out_dir: Path, style: str = DEFAULT_STYLE,
         only: set[str] | None = None, anchor_ref: bool = True) -> list[Job]:
    """The anchor job (unless ``anchor_ref`` is off) plus one job per scene (``only``: these
    qids); ``done`` when the image exists for this prompt."""
    anchor = scenes['anchor']
    jobs = [Job('anchor', anchor_prompt(anchor, style))] if anchor_ref else []
    jobs += [Job(c['qid'], scene_prompt(c['scene'], anchor, style, anchor_ref))
             for c in scenes['cards'] if only is None or c['qid'] in only]
    seen = _manifest(out_dir)
    for job in jobs:
        job.done = ((out_dir / f'{job.name}.webp').exists()
                    and seen.get(job.name, {}).get('digest') == job.digest)
    return jobs


def image_dir(slug: str, model: str = DEFAULT_MODEL, style: str = DEFAULT_STYLE,
              root: Path = ROOT, anchor_ref: bool = True) -> Path:
    """Where one company's images live: ``<root>/<slug>/<model>/<style>[_no_anchor]/``."""
    return root / slug / model / (style if anchor_ref else f'{style}_no_anchor')


def current_images(scenes: dict, out_dir: Path) -> set[str]:
    """qids whose image exists AND was drawn from the scene as it reads now — a picture of
    an edited scene would teach the old scene."""
    seen = _manifest(out_dir) if out_dir.is_dir() else {}
    return {c['qid'] for c in scenes['cards']
            if (out_dir / f"{c['qid']}.webp").is_file()
            and f'"{c["scene"]}"' in seen.get(c['qid'], {}).get('prompt', '')}


def record(out_dir: Path, job: Job, model: str) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    data = _manifest(out_dir)
    data[job.name] = {'digest': job.digest, 'model': model, 'prompt': job.prompt}
    (out_dir / MANIFEST).write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n')


def save_webp(image: bytes, path: Path, size: int = 768) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    img = Image.open(io.BytesIO(image)).convert('RGB')
    img.thumbnail((size, size))
    img.save(path, 'WEBP', quality=85)
    return path


def api_key() -> str:
    """Read from the macOS Keychain, so the key is never in a file, an env dump or a log."""
    return subprocess.run(['security', 'find-generic-password', '-s', KEYCHAIN_SERVICE, '-w'],
                          check=True, capture_output=True, text=True).stdout.strip()


def generate(prompt: str, key: str, model: str = DEFAULT_MODEL,
             reference: bytes | None = None, retries: int = 5) -> bytes:
    """One image. Backs off exponentially on 429/5xx; any other HTTP error raises."""
    delay = 10.0
    for attempt in range(retries):
        resp = requests.post(API.format(model=model), headers={'x-goog-api-key': key},
                             json=request_body(prompt, reference), timeout=180)
        if resp.status_code == 429 or resp.status_code >= 500:
            if attempt == retries - 1:
                resp.raise_for_status()
            time.sleep(delay)
            delay *= 2
            continue
        if not resp.ok:
            raise RuntimeError(f'HTTP {resp.status_code}: {resp.text[:500]}')
        return extract_image(resp.json())
    raise RuntimeError('unreachable')


def reference_bytes(path: Path) -> bytes:
    """The anchor as a compact JPEG: it rides inside every scene request, and a batch's
    inline requests must stay under 20 MB in total."""
    buf = io.BytesIO()
    Image.open(path).convert('RGB').save(buf, 'JPEG', quality=88)
    return buf.getvalue()


# --- batch mode: half price, asynchronous (target turnaround 24 h) ---------------------------

BATCH_API = 'https://generativelanguage.googleapis.com/v1beta/models/{model}:batchGenerateContent'
BATCH_GET = 'https://generativelanguage.googleapis.com/v1beta/{name}'
INLINE_LIMIT = 15_000_000       # Google's inline cap is 20 MB; keep a margin
_FINISHED = {'BATCH_STATE_SUCCEEDED', 'BATCH_STATE_FAILED', 'BATCH_STATE_CANCELLED',
             'BATCH_STATE_EXPIRED'}


@dataclass
class BatchItem:
    key: str            # '<slug>/<job name>' — returned with the response
    out_dir: Path
    job: Job


def batch_entry(item: BatchItem, reference: bytes | None) -> dict:
    return {'request': request_body(item.job.prompt, reference), 'metadata': {'key': item.key}}


def chunk(entries: list[dict], limit: int = INLINE_LIMIT) -> list[list[dict]]:
    """Split entries into batches whose JSON stays under ``limit`` bytes, order kept."""
    chunks: list[list[dict]] = [[]]
    size = 2
    for e in entries:
        n = len(json.dumps(e)) + 2
        if chunks[-1] and size + n > limit:
            chunks.append([])
            size = 2
        chunks[-1].append(e)
        size += n
    return [c for c in chunks if c]


def submit_batch(entries: list[dict], key: str, model: str, display_name: str) -> str:
    """Create one inline batch; returns its name (``batches/…``)."""
    body = {'batch': {'display_name': display_name,
                      'input_config': {'requests': {'requests': entries}}}}
    resp = requests.post(BATCH_API.format(model=model), headers={'x-goog-api-key': key},
                         json=body, timeout=600)
    if not resp.ok:
        raise RuntimeError(f'HTTP {resp.status_code}: {resp.text[:500]}')
    return resp.json()['name']


def get_batch(name: str, key: str) -> dict:
    resp = requests.get(BATCH_GET.format(name=name), headers={'x-goog-api-key': key}, timeout=300)
    if not resp.ok:
        raise RuntimeError(f'HTTP {resp.status_code}: {resp.text[:500]}')
    return resp.json()


def batch_state(op: dict) -> str:
    """The batch state, wherever the response puts it (top level, or an Operation's metadata)."""
    state = op.get('state') or (op.get('metadata') or {}).get('state')
    return state or ('BATCH_STATE_SUCCEEDED' if op.get('done') else 'BATCH_STATE_UNSPECIFIED')


def batch_finished(state: str) -> bool:
    return state in _FINISHED


def _find(obj, field: str):
    """The first value under ``field`` anywhere in a nested JSON object."""
    if isinstance(obj, dict):
        if field in obj:
            return obj[field]
        for v in obj.values():
            found = _find(v, field)
            if found is not None:
                return found
    return None


def batch_results(op: dict) -> dict[str, bytes | str]:
    """key → image bytes, or an error string for that request."""
    outer = _find(op, 'inlinedResponses') or {}
    rows = outer.get('inlinedResponses', []) if isinstance(outer, dict) else outer
    out: dict[str, bytes | str] = {}
    for row in rows:
        key = (row.get('metadata') or {}).get('key')
        if 'error' in row:
            out[key] = f"error: {row['error'].get('message', row['error'])}"
            continue
        try:
            out[key] = extract_image(row.get('response') or {})
        except NoImage as e:
            out[key] = str(e)
    return out
