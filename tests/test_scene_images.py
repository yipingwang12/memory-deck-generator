"""Scene images — one generated picture per company memory scene (pilot: Alnylam)."""

from __future__ import annotations

import base64
import io
import json
import re

import pytest
from PIL import Image

from deck_generator import scene_images as si

SCENES = {
    'anchor': 'LAMB',
    'cards': [
        {'qid': 'q01', 'peg': 'sun', 'scene': 'Under a hot SUN, the LAMB signs its papers.'},
        {'qid': 'q13', 'scene': 'The LAMB sleeps under a BRIDGE.'},
    ],
}


def _png_b64(colour='red') -> str:
    buf = io.BytesIO()
    Image.new('RGB', (8, 8), colour).save(buf, 'PNG')
    return base64.b64encode(buf.getvalue()).decode()


class TestPrompts:
    def test_anchor_prompt_names_the_anchor(self):
        assert 'lamb' in si.anchor_prompt('LAMB').lower()

    def test_scene_prompt_carries_the_scene_and_the_style(self):
        p = si.scene_prompt('The LAMB sleeps under a BRIDGE.', 'LAMB')
        assert 'The LAMB sleeps under a BRIDGE.' in p
        assert si.STYLES[si.DEFAULT_STYLE] in p

    @pytest.mark.parametrize('style', sorted(si.STYLES))
    def test_every_style_forbids_text(self, style):
        assert 'no text' in si.scene_prompt('x', 'LAMB', style).lower()

    @pytest.mark.parametrize('style', sorted(si.STYLES))
    def test_no_style_constrains_the_background(self, style):
        # A detailed background can itself be a memory cue (user's choice, 2026-10-29).
        assert 'background' not in si.scene_prompt('x', 'LAMB', style).lower()
        assert 'background' not in si.anchor_prompt('LAMB', style).lower()

    def test_scene_prompt_says_it_is_a_mnemonic_for_the_capitalised_objects(self):
        p = si.scene_prompt('x', 'LAMB').lower()
        assert 'mnemonic' in p and 'capital' in p
        assert all(w in p for w in ('striking', 'memorable', 'strange'))

    def test_default_model_is_the_full_one(self):
        assert si.DEFAULT_MODEL == 'gemini-3.1-flash-image'

    def test_realistic_style_asks_for_a_photo(self):
        assert 'photorealistic' in si.anchor_prompt('LAMB', 'realistic').lower()

    def test_no_anchor_prompt_drops_only_the_reference_sentence(self):
        with_ref = si.scene_prompt('x', 'LAMB')
        without = si.scene_prompt('x', 'LAMB', anchor_ref=False)
        assert 'reference image' in with_ref and 'reference image' not in without
        assert with_ref.replace(' The lamb must look exactly like the reference image.', '') == without

    def test_no_anchor_images_live_apart(self):
        assert si.image_dir('a', anchor_ref=False) != si.image_dir('a')

    def test_unknown_style_raises(self):
        with pytest.raises(KeyError):
            si.scene_prompt('x', 'LAMB', 'cubist')


class TestRequestBody:
    def test_text_only(self):
        body = si.request_body('draw it')
        assert body['contents'][0]['parts'] == [{'text': 'draw it'}]
        assert body['generationConfig']['responseModalities'] == ['IMAGE']

    def test_reference_image_rides_as_inline_data(self):
        body = si.request_body('draw it', reference=b'JPGBYTES')
        part = body['contents'][0]['parts'][1]['inline_data']
        assert part['mime_type'] == 'image/jpeg'
        assert base64.b64decode(part['data']) == b'JPGBYTES'


class TestExtractImage:
    def test_returns_the_first_image_part(self):
        resp = {'candidates': [{'content': {'parts': [
            {'text': 'here you go'}, {'inlineData': {'mimeType': 'image/png', 'data': _png_b64()}}]}}]}
        assert si.extract_image(resp).startswith(b'\x89PNG')

    def test_no_image_raises_with_the_reason(self):
        resp = {'candidates': [{'finishReason': 'SAFETY', 'content': {'parts': []}}]}
        with pytest.raises(si.NoImage, match='SAFETY'):
            si.extract_image(resp)


class TestPlan:
    def test_one_job_per_scene_plus_the_anchor(self, tmp_path):
        jobs = si.plan(SCENES, tmp_path)
        assert [j.name for j in jobs] == ['anchor', 'q01', 'q13']

    def test_only_limits_the_scenes_but_keeps_the_anchor(self, tmp_path):
        assert [j.name for j in si.plan(SCENES, tmp_path, only={'q13'})] == ['anchor', 'q13']

    def test_style_changes_the_prompt_so_nothing_is_reused(self, tmp_path):
        a = si.plan(SCENES, tmp_path, 'storybook')[1]
        b = si.plan(SCENES, tmp_path, 'realistic')[1]
        assert a.digest != b.digest

    def test_no_anchor_plans_no_anchor_job(self, tmp_path):
        assert [j.name for j in si.plan(SCENES, tmp_path, anchor_ref=False)] == ['q01', 'q13']

    def test_existing_image_with_same_prompt_is_skipped(self, tmp_path):
        jobs = si.plan(SCENES, tmp_path)
        si.record(tmp_path, jobs[1], model='m')
        (tmp_path / 'q01.webp').write_bytes(b'x')
        assert [j.name for j in si.plan(SCENES, tmp_path) if not j.done] == ['anchor', 'q13']

    def test_changed_scene_is_regenerated(self, tmp_path):
        jobs = si.plan(SCENES, tmp_path)
        si.record(tmp_path, jobs[1], model='m')
        (tmp_path / 'q01.webp').write_bytes(b'x')
        changed = {**SCENES, 'cards': [{**SCENES['cards'][0], 'scene': 'A new scene.'}, SCENES['cards'][1]]}
        assert 'q01' in [j.name for j in si.plan(changed, tmp_path) if not j.done]


class TestCurrentImages:
    def test_image_drawn_from_the_current_scene_counts(self, tmp_path):
        job = si.plan(SCENES, tmp_path)[2]
        si.record(tmp_path, job, model='m')
        (tmp_path / 'q13.webp').write_bytes(b'x')
        assert si.current_images(SCENES, tmp_path) == {'q13'}

    def test_image_of_an_edited_scene_does_not(self, tmp_path):
        si.record(tmp_path, si.plan(SCENES, tmp_path)[2], model='m')
        (tmp_path / 'q13.webp').write_bytes(b'x')
        edited = {**SCENES, 'cards': [SCENES['cards'][0], {'qid': 'q13', 'scene': 'Edited.'}]}
        assert si.current_images(edited, tmp_path) == set()

    def test_listed_but_missing_file_does_not(self, tmp_path):
        si.record(tmp_path, si.plan(SCENES, tmp_path)[2], model='m')
        assert si.current_images(SCENES, tmp_path) == set()

    def test_no_dir_is_empty(self, tmp_path):
        assert si.current_images(SCENES, tmp_path / 'nope') == set()


class TestSave:
    def test_writes_webp(self, tmp_path):
        path = si.save_webp(base64.b64decode(_png_b64()), tmp_path / 'q01.webp')
        assert Image.open(path).format == 'WEBP'


class TestReference:
    def test_reference_is_a_small_jpeg(self, tmp_path):
        path = si.save_webp(base64.b64decode(_png_b64()), tmp_path / 'anchor.webp')
        data = si.reference_bytes(path)
        assert data[:3] == b'\xff\xd8\xff'


def _items(n, tmp_path):
    return [si.BatchItem(f'acme/q{i:02d}', tmp_path, si.Job(f'q{i:02d}', f'prompt {i}')) for i in range(n)]


class TestBatch:
    def test_entry_carries_the_request_and_its_key(self, tmp_path):
        item = _items(1, tmp_path)[0]
        e = si.batch_entry(item, b'REF')
        assert e['metadata']['key'] == 'acme/q00'
        assert e['request'] == si.request_body('prompt 0', b'REF')

    def test_chunks_stay_under_the_limit_and_keep_every_entry(self, tmp_path):
        entries = [si.batch_entry(i, b'x' * 3000) for i in _items(10, tmp_path)]
        chunks = si.chunk(entries, limit=9000)
        assert [e for c in chunks for e in c] == entries
        assert all(len(json.dumps(c)) <= 9000 for c in chunks)
        assert len(chunks) > 1

    def test_one_oversized_entry_still_gets_its_own_chunk(self, tmp_path):
        entries = [si.batch_entry(i, b'x' * 5000) for i in _items(2, tmp_path)]
        assert len(si.chunk(entries, limit=100)) == 2

    def test_state_is_read_at_top_level_or_under_metadata(self):
        assert si.batch_state({'metadata': {'state': 'BATCH_STATE_RUNNING'}}) == 'BATCH_STATE_RUNNING'
        assert si.batch_state({'state': 'BATCH_STATE_SUCCEEDED'}) == 'BATCH_STATE_SUCCEEDED'
        assert si.batch_state({'done': True}) == 'BATCH_STATE_SUCCEEDED'

    def test_finished_states(self):
        assert not si.batch_finished('BATCH_STATE_RUNNING')
        assert si.batch_finished('BATCH_STATE_SUCCEEDED')
        assert si.batch_finished('BATCH_STATE_FAILED')

    @pytest.mark.parametrize('wrap', [
        lambda inl: {'done': True, 'response': {'inlinedResponses': inl}},
        lambda inl: {'metadata': {'output': {'inlinedResponses': inl}}},
    ])
    def test_results_found_wherever_the_responses_sit(self, wrap):
        ok = {'candidates': [{'content': {'parts': [{'inlineData': {'data': _png_b64()}}]}}]}
        inl = {'inlinedResponses': [
            {'metadata': {'key': 'acme/q01'}, 'response': ok},
            {'metadata': {'key': 'acme/q02'}, 'error': {'message': 'boom'}},
            {'metadata': {'key': 'acme/q03'}, 'response': {'candidates': [{'finishReason': 'SAFETY'}]}},
        ]}
        got = si.batch_results(wrap(inl))
        assert got['acme/q01'].startswith(b'\x89PNG')
        assert 'boom' in got['acme/q02']
        assert 'SAFETY' in got['acme/q03']


STORY_SCENES = {
    'anchor': 'KERNEL',
    'story': ['q02', 'The soldiers need pay, so the KERNEL asks for help.', '---', 'q01'],
    'cards': [
        {'qid': 'q01', 'scene': 'A HARP (ARPA-H) plays beside the KERNEL.'},
        {'qid': 'q02', 'scene': 'The KERNEL fights MULTIPLE SCARS (multiple sclerosis) on 2 nerves.'},
    ],
}


class TestChatgptSheet:
    def test_scene_hint_brackets_are_dropped(self):
        assert si.strip_hints('A HARP (ARPA-H) plays (loudly).') == 'A HARP plays.'

    def test_scenes_follow_story_order_with_links_as_notes(self):
        sheet = si.chatgpt_sheet(STORY_SCENES, 'Kernal Biologics')
        q02, link, q01 = (sheet.index(s) for s in ('| 1 | q02 |', 'The soldiers need pay', '| 2 | q01 |'))
        assert q02 < link < q01

    def test_without_story_scenes_follow_card_order(self):
        sheet = si.chatgpt_sheet({**STORY_SCENES, 'story': None}, 'K')
        assert sheet.index('| 1 | q01 |') < sheet.index('| 2 | q02 |')

    def test_prompts_carry_no_hints_and_setup_names_the_anchor(self):
        sheet = si.chatgpt_sheet(STORY_SCENES, 'K')
        assert 'ARPA-H' not in sheet and 'A HARP plays beside the KERNEL.' in sheet
        assert 'a single KERNEL' in sheet

    def test_setup_forbids_combined_pictures_and_says_nothing_of_background(self):
        setup = si.CHATGPT_SETUP.lower()
        assert 'never combine' in setup and 'background' not in setup

    def test_setup_allows_only_lettering_a_scene_describes(self):
        setup = si.CHATGPT_SETUP.lower()
        assert 'no captions or labels' in setup and 'lettering a scene itself describes' in setup

    def test_setup_gives_no_example_lettering(self):
        # ChatGPT painted the old example "SPTX" (Seaport's ticker) on an Asimov flag, 2026-10-29.
        assert not re.search(r'[A-Z]{2,}[-\d]', si.CHATGPT_SETUP.replace('{anchor}', ''))
        assert 'SPTX' not in si.CHATGPT_SETUP
