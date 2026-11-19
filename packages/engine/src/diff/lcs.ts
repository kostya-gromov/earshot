export interface LcsPair {
  beforeIndex: number;
  afterIndex: number;
}

function createTable(beforeLength: number, afterLength: number): number[][] {
  return Array.from({ length: beforeLength + 1 }, () => Array<number>(afterLength + 1).fill(0));
}

export function longestCommonSubsequence(
  before: readonly string[],
  after: readonly string[],
): LcsPair[] {
  const table = createTable(before.length, after.length);

  for (let beforeIndex = before.length - 1; beforeIndex >= 0; beforeIndex -= 1) {
    for (let afterIndex = after.length - 1; afterIndex >= 0; afterIndex -= 1) {
      const row = table[beforeIndex]!;
      if (before[beforeIndex] === after[afterIndex]) {
        row[afterIndex] = table[beforeIndex + 1]![afterIndex + 1]! + 1;
      } else {
        row[afterIndex] = Math.max(table[beforeIndex + 1]![afterIndex]!, row[afterIndex + 1]!);
      }
    }
  }

  const pairs: LcsPair[] = [];
  let beforeIndex = 0;
  let afterIndex = 0;

  while (beforeIndex < before.length && afterIndex < after.length) {
    if (before[beforeIndex] === after[afterIndex]) {
      pairs.push({ beforeIndex, afterIndex });
      beforeIndex += 1;
      afterIndex += 1;
      continue;
    }

    const advanceBefore = table[beforeIndex + 1]![afterIndex]!;
    const advanceAfter = table[beforeIndex]![afterIndex + 1]!;
    if (advanceBefore >= advanceAfter) beforeIndex += 1;
    else afterIndex += 1;
  }
  return pairs;
}
