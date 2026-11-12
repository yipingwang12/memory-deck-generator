You are building ONE era of a city timeline for a Major System date-memorization deck.

CITY: {city_name}   ERA: {era_slug} ({era_years})
FILE: /Users/yipingwa/Documents/Projects/memory-deck-generator/configs/history/cities/{city}/{era_slug}.yaml

## Read first (in this order)
1. /Users/yipingwa/Documents/Projects/memory-deck-generator/configs/history/cities.md — the city rules (scope, world_refs, scenes). They override policy.md where they differ.
2. /Users/yipingwa/Documents/Projects/memory-deck-generator/configs/history/policy.md — entry format, confidence, date conversion, peg digits, scene rules.
3. /Users/yipingwa/Documents/Projects/memory-deck-generator/configs/history/agent_prompt.md — the world-cell brief. Follow its sections "Scenes (METHOD v2)", "Search budget" and "Write (step 4) and check (step 5)" exactly, with these changes: the budget is {budget}; the cell file is the FILE above; group by theme, not subregion; the check command is
   cd /Users/yipingwa/Documents/Projects/memory-deck-generator && .venv/bin/deck-history-check configs/history/cities/{city}/{era_slug}.yaml
4. /Users/yipingwa/Documents/Projects/memory-deck-generator/configs/history/major_pegs.yaml — peg words. Never choose a peg by hand.

## Step 0 — what the world grid already holds
Before the memory pass, grep every world cell of region {region} (configs/history/cells/{region}_*.yaml) and
world_dates.yaml for the city, its districts, rivers and landmarks. Every event inside your era and scope that a world
cell holds goes under `world_refs:` (cities.md), never under `dates:`. Use the world cell's year exactly.

## The user has pre-authorised the whole pipeline
Memory pass → web check → write → check, end to end. Never stop for review. Never ask the user anything.

## Depth
EXHAUSTIVE inside scope: every dated event you can find, specialist items included. Expect roughly {expected}
cards; a thin era may have fewer — do not pad. National events are OUT (cities.md); when unsure whether the city is
the subject, leave it out and list it in your report.

## File header
Copy the header layout of a world cell (comment lines, then `dates:`), naming the city and era.

## Final report (your last message; under 250 words, no scene tables)
- Card count per theme; world_refs count.
- Confidence counts (high/medium/low/disputed/unverified).
- Date corrections from the web check: old → new (source), max 8 lines.
- Year conflicts between city sources and a world cell (world_refs keep the world year).
- National events you left out but were unsure about (one line each, max 8).
- Most-loaded pegs; deck-history-check exit status.
