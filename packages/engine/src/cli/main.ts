/**
 * Earshot engine CLI.
 *
 *   pnpm engine debug --target reference --keys Backspace,Backspace [--headed] [--json]
 *   pnpm engine run --pattern input-with-chips --target reference [--runs 3] [--headed]
 *   pnpm engine run --pattern input-with-chips --all [--runs 3] [--headed]
 */
import { parseArgs } from 'node:util';
import { runDebug } from './debug.ts';
import { runAllCommand, runCommand } from './run.ts';

const USAGE = `Usage:
  pnpm engine debug --pattern input-with-chips --target reference --scenario backspace-twice [--keys Key1,Key2] [--headed] [--json]
  pnpm engine run --pattern input-with-chips --target reference [--runs 3] [--headed] [--output file]
  pnpm engine run --pattern input-with-chips --all [--runs 3] [--headed]`;

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: {
    pattern: { type: 'string', default: 'input-with-chips' },
    target: { type: 'string', default: 'reference' },
    scenario: { type: 'string', default: 'backspace-twice' },
    keys: { type: 'string' },
    runs: { type: 'string', default: '3' },
    headed: { type: 'boolean', default: false },
    json: { type: 'boolean', default: false },
    output: { type: 'string' },
    all: { type: 'boolean', default: false },
  },
});

const [command] = positionals;

try {
  if (command === 'debug') {
    await runDebug({
      patternId: values.pattern,
      targetId: values.target,
      scenarioId: values.scenario,
      headed: values.headed,
      json: values.json,
      ...(values.keys ? { keys: values.keys.split(',').map((key) => key.trim()) } : {}),
    });
  } else if (command === 'run' && values.all) {
    const results = await runAllCommand({
      patternId: values.pattern,
      runs: Number(values.runs),
      headed: values.headed,
    });
    for (const result of results) {
      console.log(
        'file' in result ? `Wrote ${result.file}` : `Failed ${result.targetId}: ${result.error}`,
      );
    }
    if (results.some((result) => 'error' in result)) process.exitCode = 1;
  } else if (command === 'run') {
    const result = await runCommand({
      patternId: values.pattern,
      targetId: values.target,
      runs: Number(values.runs),
      headed: values.headed,
      ...(values.output ? { output: values.output } : {}),
    });
    console.log(`Wrote ${result.file}`);
  } else {
    console.error(USAGE);
    process.exitCode = 1;
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
