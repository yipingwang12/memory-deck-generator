from unittest.mock import MagicMock, patch

import pytest

from deck_generator.wikisource import fetch_text, fetch_wikitext, poem_text

# The markup that actually appears in the Duineser Elegien transcription: a page-break
# marker on its own line, a line-number marker glued to the front of every fifth line, an
# argument-less indent template that repeats, spaced-type emphasis, and a bold heading.
_PAGE = """\
{{Textdaten
|TITEL=Die erste Elegie
}}

<poem>
{{Seite|7}}
'''DIE ERSTE ELEGIE'''

WER, wenn ich schriee, hörte mich denn aus der Engel
Ordnungen? und gesetzt selbst, es nähme
{{Zeile|5}}als des Schrecklichen Anfang, den wir noch grade ertragen,
Weißt du’s {{SperrSchrift|noch}} nicht? Wirf aus den Armen die Leere
{{idt}}{{idt}}{{idt}}{{idt}}Verhalt ihn......
Ein [[Engel]] und die [[Duineser Elegien|Elegien]].
</poem>

[[Kategorie:Rainer Maria Rilke]]
"""


def _mock_response(payload: dict):
    resp = MagicMock()
    resp.json.return_value = payload
    resp.raise_for_status.return_value = None
    return resp


def _lines(text: str) -> list[str]:
    return [l for l in text.splitlines() if l.strip()]


class TestPoemText:
    def test_takes_only_the_poem_block(self):
        assert 'Textdaten' not in poem_text(_PAGE)
        assert 'Kategorie' not in poem_text(_PAGE)

    def test_drops_page_and_line_markers_without_eating_the_verse(self):
        """{{Zeile|N}} is glued to the FRONT of a line — dropping the whole line would
        silently lose every fifth verse."""
        assert 'als des Schrecklichen Anfang, den wir noch grade ertragen,' in _lines(poem_text(_PAGE))
        assert '{{Seite' not in poem_text(_PAGE)

    def test_unwraps_spaced_type_keeping_the_word(self):
        assert 'Weißt du’s noch nicht? Wirf aus den Armen die Leere' in _lines(poem_text(_PAGE))

    def test_drops_argument_less_indent_template(self):
        """{{idt}} takes no argument and repeats; a pattern requiring `|` leaves it in."""
        assert 'Verhalt ihn......' in _lines(poem_text(_PAGE))

    def test_resolves_links_to_their_shown_text(self):
        assert 'Ein Engel und die Elegien.' in _lines(poem_text(_PAGE))

    def test_strips_bold_markers(self):
        assert 'DIE ERSTE ELEGIE' in _lines(poem_text(_PAGE))

    def test_leaves_no_residual_markup(self):
        out = poem_text(_PAGE)
        for token in ('{{', '}}', '[[', ']]', "'''", '<'):
            assert token not in out

    def test_page_without_a_poem_block_falls_back_to_the_whole_text(self):
        assert 'Just a line.' in poem_text('Just a line.')


class TestFetch:
    def test_fetches_parses_and_caches(self, tmp_path):
        payload = {'parse': {'wikitext': _PAGE}}
        with patch('deck_generator.wikisource.requests.get',
                   return_value=_mock_response(payload)) as get:
            assert 'WER, wenn ich schriee' in fetch_text('Die erste Elegie', cache_dir=tmp_path)
        get.assert_called_once()
        assert list((tmp_path / 'de').glob('*.wikitext'))

    def test_cache_hit_skips_network(self, tmp_path):
        payload = {'parse': {'wikitext': _PAGE}}
        with patch('deck_generator.wikisource.requests.get', return_value=_mock_response(payload)):
            fetch_wikitext('Die erste Elegie', cache_dir=tmp_path)
        with patch('deck_generator.wikisource.requests.get') as get:
            fetch_wikitext('Die erste Elegie', cache_dir=tmp_path)
        get.assert_not_called()

    def test_sends_an_identifying_user_agent(self, tmp_path):
        """Wikimedia 403s the default requests UA and placeholder ones alike."""
        payload = {'parse': {'wikitext': _PAGE}}
        with patch('deck_generator.wikisource.requests.get',
                   return_value=_mock_response(payload)) as get:
            fetch_wikitext('Die erste Elegie', cache_dir=tmp_path)
        ua = get.call_args.kwargs['headers']['User-Agent']
        assert 'http' in ua and 'example.com' not in ua

    def test_api_error_is_raised_not_cached(self, tmp_path):
        payload = {'error': {'code': 'missingtitle', 'info': 'The page does not exist.'}}
        with patch('deck_generator.wikisource.requests.get', return_value=_mock_response(payload)):
            with pytest.raises(ValueError, match='does not exist'):
                fetch_wikitext('Nope', cache_dir=tmp_path)
        assert not list(tmp_path.rglob('*.wikitext'))

    def test_language_selects_the_wiki_and_the_cache_namespace(self, tmp_path):
        payload = {'parse': {'wikitext': _PAGE}}
        with patch('deck_generator.wikisource.requests.get',
                   return_value=_mock_response(payload)) as get:
            fetch_wikitext('Some Page', lang='fr', cache_dir=tmp_path)
        assert 'fr.wikisource.org' in get.call_args.args[0]
        assert (tmp_path / 'fr').is_dir()
