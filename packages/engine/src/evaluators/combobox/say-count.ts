import type { VerdictResult } from '@earshot/contracts';
import type { EvaluatorInput } from '../../model/evaluator.ts';
import { notJudged } from './facts.ts';
import { saidTexts } from '../../model/change-announcement.ts';
import { suggestionsAnnouncement, typingStep } from './say-results.ts';

const numberWords = ['zero', 'one', 'two', 'three', 'four', 'five', 'six'];

/** The number as digits or as an English word; runs use the en-US locale. */
function saysCount(text: string, count: number): boolean {
  const word = numberWords[count];
  return new RegExp(`\\b(${count}${word ? `|${word}` : ''})\\b`, 'i').test(text);
}

const unannounced =
  'so there is no message whose count could be judged. Whether that differs is the business of "Say that the suggestions changed".';

/**
 * Earshot recommendation: the message gives the number of suggestions, or says there are none.
 * Judged only where the change was announced, so a silent combobox is charged once, to
 * say-results.
 */
export function evaluateSayCount(input: EvaluatorInput): VerdictResult {
  const typed = typingStep(input);
  if ('verdict' in typed) return typed;
  const announcement = suggestionsAnnouncement(typed.step, input.recorded ?? []);
  if (announcement.kind === 'silent') {
    return notJudged(
      'Change not announced',
      `Nothing was written to a live region, ${unannounced}`,
    );
  }
  if (announcement.kind !== 'announced') {
    return notJudged(
      'Change not announced',
      `No text counted as an announcement of the change, ${unannounced}`,
    );
  }
  const count = typed.after.popup.options.length;
  const said = saidTexts(announcement.texts);
  const wanted = `the number ${count}`;
  if (!announcement.texts.some(({ text }) => saysCount(text, count))) {
    return {
      verdict: 'differs',
      summary: 'Announced without the count',
      reason: `A live region said ${said}; it does not say ${wanted}.`,
    };
  }
  return {
    verdict: 'follows',
    summary: 'Says how many there are',
    reason: `A live region said ${said}, which says ${wanted}.`,
  };
}
