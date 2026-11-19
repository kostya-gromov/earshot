import type { Step } from '@earshot/contracts';
import {
  judgeChangeAnnouncement,
  liveTexts,
  saidTexts,
  textsSeenWithout,
  type ChangeAnnouncement,
  type LiveText,
  type RecordedScenario,
} from '../../model/change-announcement.ts';
import { removedNode } from './facts.ts';

export interface AnnouncementDifference {
  summary: string;
  reason: string;
}

const normalizedWords = (value: string): readonly string[] =>
  value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .split(' ');

function hasSelectedCount(words: readonly string[], expectedCount: number): boolean {
  return words.some((word, index) => {
    if (word !== 'selected') return false;
    const count = words
      .slice(0, index)
      .reverse()
      .find((candidate) => /^\d+$/.test(candidate));
    return count === String(expectedCount);
  });
}

/** Whole-word match, so a removed icon named "Remove" does not match the word "removed". */
function containsPhrase(words: readonly string[], phrase: string): boolean {
  const target = normalizedWords(phrase);
  if (target[0] === '') return false;
  return words.some((_, start) => target.every((word, offset) => words[start + offset] === word));
}

/**
 * "Say": whether the removal is announced, by the rule every pattern shares (model/
 * change-announcement.ts). A text names the removal when it holds the label of a node that left
 * the accessibility tree in this step, so the check depends neither on how the remove control is
 * named nor on the verb a system uses ("removed", "deselected"). A text that live regions also
 * held in a step that removed nothing, anywhere in the recording, is not an announcement of it.
 */
export function removalAnnouncement(
  step: Step,
  recorded: readonly RecordedScenario[],
): ChangeAnnouncement {
  const removedNames = step.axDiff.removed.map(({ name }) => name).filter((name) => name !== '');
  return judgeChangeAnnouncement({
    step,
    names: (text) =>
      removedNames.length === 0
        ? undefined
        : removedNames.some((name) => containsPhrase(normalizedWords(text), name)),
    seenWithout: textsSeenWithout(recorded, removedNode),
    change: { noun: 'removal', named: 'the removed value' },
  });
}

/** "Count": a text that announces the removal also gives the new count. */
export function countDifference(
  step: Step,
  announced: readonly LiveText[],
  expectedCount: number,
): AnnouncementDifference | undefined {
  if (announced.some(({ text }) => hasSelectedCount(normalizedWords(text), expectedCount))) {
    return undefined;
  }
  return {
    summary: 'Announced without the new count',
    reason: `Removal was announced as ${saidTexts(liveTexts(step))} without the new count of ${expectedCount}.`,
  };
}
