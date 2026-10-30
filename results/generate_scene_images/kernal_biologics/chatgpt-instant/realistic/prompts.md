# Kernal Biologics — ChatGPT scene prompts

ChatGPT (Instant), one chat, 2026-10-29. Scene text adapted from `configs/companies/kernal_biologics.mnemonics.yaml`: bracketed source hints dropped (drawn as labels otherwise); quoted words = only text allowed in image. No background instruction — detailed background may itself be a memory cue.

## Message 1 — rules + anchor

```
I'm making memory-aid pictures for a flashcard story. All pictures share one character: a single corn KERNEL, golden-yellow, about the size of a person, with a simple friendly face, small arms and legs. Keep this exact KERNEL identical in every picture I ask for in this chat.

Style for every picture: photorealistic, natural light, real materials and textures. Every object I write in CAPITALS must be large, clear and easy to recognise; it is what the viewer has to remember. Make each scene striking or a little strange, because unusual images are easier to recall. No text, letters, numbers or captions anywhere, except words I put in quotes.

First picture: the KERNEL alone, full body, facing the viewer, as a character reference.
```

## Scenes (story order)

| # | qid | Prompt |
|---|---|---|
| 1 | q10 | The KERNEL first sprouts, green shoots and roots, under a stone BRIDGE over the Charles River in Boston. |
| 2 | q01 | The KERNEL prints a letter on an old printing press; the letter is stamped with a big "2.0", a second-generation message. |
| 3 | q03 | Each of the KERNEL's letters rides toward a group of T cells inside a tiny glistening drop of popcorn BUTTER. |
| 4 | q02 | The KERNEL's letters turn into small T-cell soldiers that form inside a patient's own body, not in a lab: show the soldiers inside a translucent human body. |
| 5 | q04 | The KERNEL's lead soldier stands at the front, with "KR-402" painted large on its chest. |
| 6 | q05 | The KERNEL's soldiers fight MULTIPLE SCARS on glowing nerve fibres, patching each scar. |
| — | — | *Story link, no picture: The soldiers need pay, so the KERNEL asks for help.* |
| 7 | q06 | A golden HARP plays by itself, and a REEF made of stacked coins grows up around the KERNEL until it reaches the KERNEL's full height. |
| 8 | q07 | The HARP plays from sheet music titled "EMBODY", and the KERNEL builds a glowing cure inside a translucent human body. |
| 9 | q08 | A tall red TREE, a FARMER in overalls and a JACK-in-the-box spilling white mice share a pile of the KERNEL's gold coins. |
| 10 | q09 | The KERNEL walks through a gate made of two giant LOLLIPOPS toward a LIGHTHOUSE on a harbour pier. |

## Files

- Source: `kernel_flashcards_download.zip` (`kernel_reference.png`, `scene_NN.png`) → `anchor.webp`, `<qid>.webp` (max 768 px, WebP q85, via `scene_images.save_webp`).
- Zip images cut from one sheet: slivers of neighbouring pictures + white gutters cropped from `kernel_reference`, `scene_01`, `04`, `08`, `10`; white bottom band from `scene_06`, `07`.
- **No `scene_05`**: ChatGPT drew scenes 5 + 6 as one picture (KR-402 soldier on scarred nerves) → same image as `q04.webp` and `q05.webp`.
- No `manifest.json`: prompts above are paraphrases, so `scene_images.current_images` (needs exact scene text) would not ship them.
