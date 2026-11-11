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
import re
import subprocess
import time
from dataclasses import dataclass
from pathlib import Path

import requests
from PIL import Image

ROOT = Path(__file__).resolve().parents[2] / 'results' / 'generate_scene_images'
API = 'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent'
FULL_MODEL = 'gemini-3.1-flash-image'
LITE_MODEL = 'gemini-3.1-flash-lite-image'
#: Lite draws by default (user's choice, 2026-11-05); pass ``--model`` for the full model.
DEFAULT_MODEL = LITE_MODEL
#: Gemini directories the build ships from, in order. Full first: the 24 decks drawn with it
#: before the switch keep their look even if a Lite set is drawn later.
SHIPPED_MODELS = (FULL_MODEL, LITE_MODEL)
#: Requested on every draw. Unset, the model picks: Lite drew two whole decks portrait.
ASPECT_RATIO = '16:9'
KEYCHAIN_SERVICE = 'gemini-api-key'
MANIFEST = 'manifest.json'
#: The Three.js renderer's folder and file-stem suffix (``q01_anime.webp``). Its pictures are
#: authored in-repo rather than bought from an API, so they carry no model/style directory.
THREEJS_DIR = 'threejs'
THREEJS_SUFFIX = '_anime'

_NO_TEXT = ('Each named object is large, clear and easy to recognise. '
            'No text, letters, numbers or captions anywhere in the image.')
STYLES = {
    'storybook': f'Bright, simple storybook illustration. {_NO_TEXT}',
    'realistic': f'Photorealistic image, natural light, real materials and textures. {_NO_TEXT}',
}
DEFAULT_STYLE = 'realistic'


class NoImage(RuntimeError):
    """The API answered without an image (safety block, text-only reply)."""


@dataclass
class Job:
    name: str           # 'anchor' or the card qid; also the file stem
    prompt: str
    done: bool = False
    scene: str | None = None   # the scene text the prompt was built from; None for the anchor

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


CHATGPT_MODEL = 'chatgpt-instant'
CHATGPT_SETUP = (
    "I'm making memory-aid pictures for a flashcard story. All pictures share one character: "
    'a single {anchor}. Keep this exact {anchor} identical in every picture I ask for in this chat.\n\n'
    'Style for every picture: photorealistic, natural light, real materials and textures. Every '
    'object I write in CAPITALS must be large, clear and easy to recognise; it is what the viewer '
    'has to remember. Make each scene striking or a little strange, because unusual images are '
    'easier to recall. No captions or labels; the only lettering allowed is lettering a scene '
    'itself describes, exactly as written there. Draw one picture per message and never combine two scenes; each picture gets its '
    'own full frame, with no borders or panels.\n\n'
    'First picture: the {anchor} alone, facing the viewer, as a character reference.')


def strip_hints(scene: str) -> str:
    """Drop bracketed source hints ("a HARP (ARPA-H)"): an image model draws them as labels."""
    return re.sub(r'\s*\([^)]*\)', '', scene)


def chatgpt_sheet(scenes: dict, title: str) -> str:
    """prompts.md for drawing one company's scenes by hand in ChatGPT: a setup message, then one
    prompt per scene in story order, story links as notes."""
    by_qid = {c['qid']: c['scene'] for c in scenes['cards']}
    order = scenes.get('story') or list(by_qid)
    rows, n = [], 0
    for entry in order:
        if entry == '---':
            continue
        if entry not in by_qid:
            rows.append(f'| — | — | *Story link, no picture: {entry}* |')
            continue
        n += 1
        rows.append(f'| {n} | {entry} | {strip_hints(by_qid[entry])} |')
    setup = CHATGPT_SETUP.format(anchor=scenes['anchor'])
    return (f'# {title} — ChatGPT scene prompts\n\n'
            'ChatGPT (Instant), one chat. Paste message 1, then each scene prompt as its own '
            'message. Save each picture as `<qid>.png` in this folder.\n\n'
            f'## Message 1 — rules + anchor\n\n```\n{setup}\n```\n\n'
            '## Scenes (story order)\n\n| # | qid | Prompt |\n|---|---|---|\n'
            + '\n'.join(rows) + '\n')


def request_body(prompt: str, reference: bytes | None = None) -> dict:
    """``reference``: the anchor picture as JPEG bytes (``reference_bytes``)."""
    parts: list[dict] = [{'text': prompt}]
    if reference is not None:
        parts.append({'inline_data': {'mime_type': 'image/jpeg',
                                      'data': base64.b64encode(reference).decode()}})
    return {'contents': [{'parts': parts}],
            'generationConfig': {'responseModalities': ['IMAGE'],
                                 'imageConfig': {'aspectRatio': ASPECT_RATIO}}}


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
    jobs += [Job(c['qid'], scene_prompt(c['scene'], anchor, style, anchor_ref), scene=c['scene'])
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


def threejs_dir(slug: str, root: Path = ROOT) -> Path:
    """Where one company's hand-authored Three.js pictures live: ``<root>/<slug>/threejs/``.
    Flat, with no model/style level: the renderer is the repo's own kit, not a paid API."""
    return root / slug / THREEJS_DIR


def is_current(entry: dict | None, scene: str) -> bool:
    """True when the manifest ``entry`` records a picture drawn from ``scene`` as it reads now.

    The one test of "this picture matches its scene", for both renderers. Entries carry the
    scene text in ``scene``; entries written before that field existed are matched on the
    quoted scene inside their prompt."""
    if not entry:
        return False
    if 'scene' in entry:
        return entry['scene'] == scene
    return f'"{scene}"' in entry.get('prompt', '')


def current_images(scenes: dict, out_dir: Path, suffix: str = '') -> set[str]:
    """qids whose image exists AND was drawn from the scene as it reads now — a picture of
    an edited scene would teach the old scene. ``suffix`` names the file variant
    (``_anime`` for Three.js finals), so one manifest convention serves both renderers."""
    seen = _manifest(out_dir) if out_dir.is_dir() else {}
    return {c['qid'] for c in scenes['cards']
            if (out_dir / f"{c['qid']}{suffix}.webp").is_file()
            and is_current(seen.get(c['qid']), c['scene'])}


def record_threejs(scenes: dict, out_dir: Path, source: Path | None = None) -> set[str]:
    """Stamp the Three.js finals in ``out_dir`` into the manifest and return the qids stamped.

    A Three.js picture has no prompt — it is a hand-written scene page — so the manifest
    records the scene text it was drawn from, which :func:`is_current` checks. Stamping
    *asserts* the picture matches the text as it now reads, so a picture older than ``source``
    (the scenes YAML) is refused rather than certified: the scene may have been edited after
    it was drawn, and a wrong certificate is worse than no picture. The exception is a picture
    already stamped for the scene text as it reads now: an edit to a different scene in the
    same file changes the file time but not this scene, so its stamp stays.
    """
    data = _manifest(out_dir)
    edited = source.stat().st_mtime if source and source.exists() else None
    stamped = set()
    for card in scenes['cards']:
        qid = card['qid']
        image = out_dir / f'{qid}{THREEJS_SUFFIX}.webp'
        if not image.is_file():
            continue
        if (edited is not None and edited > image.stat().st_mtime
                and not is_current(data.get(qid), card['scene'])):
            continue
        data[qid] = {'digest': hashlib.sha256(card['scene'].encode()).hexdigest()[:16],
                     'model': THREEJS_DIR, 'scene': card['scene'],
                     'prompt': f'Three.js scene page {qid}{THREEJS_SUFFIX}.html '
                               f'for scene "{card["scene"]}"'}
        stamped.add(qid)
    if stamped:
        out_dir.mkdir(parents=True, exist_ok=True)
        (out_dir / MANIFEST).write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n')
    return stamped


def record(out_dir: Path, job: Job, model: str) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    data = _manifest(out_dir)
    data[job.name] = {'digest': job.digest, 'model': model, 'prompt': job.prompt,
                      **({'scene': job.scene} if job.scene is not None else {})}
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
    """The batch state, wherever the response puts it (top level, or an Operation's metadata).

    A done Operation with no state counts as succeeded only when it carries no ``error``."""
    state = op.get('state') or (op.get('metadata') or {}).get('state')
    if state:
        return state
    if op.get('error'):
        return 'BATCH_STATE_FAILED'
    return 'BATCH_STATE_SUCCEEDED' if op.get('done') else 'BATCH_STATE_UNSPECIFIED'


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
