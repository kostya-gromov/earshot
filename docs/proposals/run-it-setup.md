# Proposal: how "Run it on your component" reaches the starting state

Status: accepted by the owner on 2026-11-08 (raised in his review the same day).

## Problem

Every scenario starts from a known state ("3 chips, empty input focused"). A URL alone does not
get us there: we do not know which names the component accepts, how to add a chip, or what the
component's root is. Without that, no scenario applies, and an email list would collect interest
in something we cannot run.

## Options

1. **Storybook play function, written by the team** (recommended). The team adds a story whose
   `play` function reaches the starting state with Testing Library; we run it, then the
   scenarios. It uses tools teams already have, and the setup is theirs, not our guess.
2. **A short setup form.** The team names the root (role and label) and the values to type. Works
   for simple components, breaks on async suggestion lists.
3. **Recorded setup.** The team clicks through the setup once in a recorder. Most flexible, most
   work for us; it is the scenario recorder from the earlier prototypes, which is out of scope.

## Recommendation

Option 1. Until it exists, the form keeps saying that nothing is sent, and the email field should
go: we should not collect addresses before we know what we can run. The section's copy then
explains the play function requirement up front.
