You are building ONE history topic cell for a Major System date-memorization deck.

CELL: {region_name} × {theme_name} × {period_name}
FILE: /Users/yipingwa/Documents/Projects/memory-deck-generator/configs/history/cells/{slug}.yaml

## Read first (in this order)
1. /Users/yipingwa/Documents/Projects/.claude/skills/history-cell/SKILL.md — the procedure.
2. /Users/yipingwa/Documents/Projects/memory-deck-generator/configs/history/policy.md — the rules (entry format, date conversion, peg digits, scene rules). Follow them exactly.
3. /Users/yipingwa/Documents/Projects/memory-deck-generator/configs/history/cells/oceania_science_pre500bce.yaml — the pilot cell; copy its header and layout.
4. /Users/yipingwa/Documents/Projects/memory-deck-generator/configs/history/major_pegs.yaml — peg words. Never choose a peg by hand; the digit rule fixes it.
5. Grep /Users/yipingwa/Documents/Projects/memory-deck-generator/configs/history/world_dates.yaml for events in this cell's scope and keep dates consistent (if web sources show world_dates is wrong, use the correct date and report the conflict — do not edit world_dates.yaml).

## The user has pre-authorised the whole pipeline
Do NOT stop after the memory pass and do NOT wait for permission before the web check. Run skill steps 1–5 end to end, then report (step 6 format below). Never ask the user anything.

## Scope
- Region, theme and period definitions: /Users/yipingwa/Documents/Projects/memory-deck-generator/configs/history/grid.md — use the entries for your slugs.
- Put an event here only if this theme is its MAIN theme. Event must happen inside the region and the period.
- Depth: EXHAUSTIVE. Every dated event you can find, specialist items included, like the pilot. Do not stop at a round number. Expect roughly 60–150 entries; a thin cell may have fewer — that is fine, do not pad.
- Group entries by subregion with `# <subregion>` comments.

## Search budget
Web search is capped per session and shared by every agent running in parallel. You may use at
most {budget} searches. Count them; never go over.
WebFetch does NOT use the search budget: search to FIND a good timeline or reference page, then
fetch it and confirm every entry it covers. Fetch works on encyclopedia.com, MacTutor
(mathshistory.st-andrews.ac.uk), historyworld.net, lindahall.org, worldhistory.org (some pages),
and the Kiwix Wikipedia mirror at kaweah.freedombox.rocks (source as "WP mirror: <article>"; give up
after two timeouts). Do NOT use IPFS mirrors (dweb.link, ipfs.aleph.im, 4everland): the auto-mode
permission check refuses them. Also useful: Livius, Thayer (penelope.uchicago.edu), SAHO, Historic UK. Fetch refuses on
britannica.com, metmuseum.org, britishmuseum.org, smarthistory.org — use their search summaries only.
Every entry a source confirms gets a short `source:` field (policy.md). Spend them in this order: items you would mark low or disputed, items with no
date, items near a period boundary, then extension searches. Everything you do not search is
`unverified` — never `high` or `medium` from memory. If a search is refused, stop searching and write the cell.
SPEND THE WHOLE BUDGET. Wave 3 agents stopped with searches unspent and wrote thin cells. If you
have searches left after checking, use them for extension searches until the budget is used.
Astronomical years: sources such as Sachs–Hunger diaries write -651 for 652 BCE (year 0 exists).
Convert to BCE before you apply policy.md. Inventions: no rule yet for demonstration vs patent
year; use the year that survey histories quote, and list each such case in your report.

## Web check (step 3)
- Load WebSearch with ToolSearch ("select:WebSearch") if it is deferred. Use "standard" mode by default; "extended" only for hard items. Send searches in parallel batches.
- Check every item below `high` and every item with no date. Also run extension searches ("earliest/first/oldest <theme> <subregion>", finds of the last ~10 years).
- No Wikidata. Wikimedia sites are blocked at the network layer — do not try to open them; prefer journal, museum, university, encyclopedia (Britannica) pages.
- No source → `confidence: unverified`, keep it.

## Write (step 4) and check (step 5)
- All text in ASD-STE100 style (short sentences, simple approved words, active voice).
- Run: cd /Users/yipingwa/Documents/Projects/memory-deck-generator && .venv/bin/deck-history-check configs/history/cells/{slug}.yaml
- Exit 0 is required. Fix every problem it prints and re-run.
- Write ONLY your one cell file. Do not edit any other file. Do not commit.

## Final report (your last message; under 250 words, no scene tables)
- Entry count, per subregion.
- Confidence counts (high/medium/low/disputed/unverified).
- Date corrections made during the web check: old → new (source), max 8 lines.
- Conflicts with world_dates.yaml, if any.
- Most-loaded pegs (from the check output).
- deck-history-check exit status.
