# 2026-11-19: Atlas playground (reference implementations), VoiceOver

- **Who:** the owner, by hand.
- **Screen reader:** VoiceOver on macOS. Version not recorded.
- **Browser:** not recorded.
- **Target:** the playground on the Atlas pattern pages, running the reference implementations, on a local build.

## What was done

The owner used the playground with VoiceOver and compared what was heard with the "You would hear" transcript, the semantic model.

## What was heard

What VoiceOver said matched the transcript. There were small differences between the two. They were judged minor and were not written down, so they cannot be checked against the model here.

## What this check does not cover

This was a check of the reference implementations only. The M2 spot-check in `README.md` asks about the measured third-party systems, and none of its items was checked:

- Atlassian Select: Left Arrow, Backspace and Shift+Tab from the empty input, and the dangling `aria-activedescendant`.
- The "no announcement" findings for Fluent 2, Primer, MUI and React Aria.
- The changed input description in MUI and Primer.

It is also not recorded whether the third remove button was heard as "3 of 3" (ADR 0003).

The publishing gate in `README.md` therefore stays open.

## Next time

Write down the macOS, VoiceOver and browser versions. For each difference from the transcript, record the step, what the transcript said and what VoiceOver said, even when it looks minor. These differences are what the semantic model is checked against.
