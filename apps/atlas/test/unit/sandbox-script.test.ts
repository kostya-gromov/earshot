import { describe, expect, it } from 'vitest';
import { joinModules } from '../../src/lib/sandbox-script';

const shapes =
  'export const grey = (value) => [value];\nexport function box() {\n  return grey(1);\n}\n';
const board =
  "import {\n  box,\n  grey,\n} from './shapes.ts';\nimport { other } from './other.ts';\n\nexport function drawBoard() {\n  return [box(), grey(0)];\n}\n";

describe('joinModules', () => {
  it('leaves no import or export behind, also when an import spans lines', () => {
    const script = joinModules([shapes, board]);
    expect(script).not.toMatch(/^\s*(import|export)\b/m);
  });

  it('keeps every declaration, so a later module can use an earlier one', () => {
    const script = joinModules([shapes, board]);
    // The joined text is run as one script: the sandbox does the same.
    // eslint-disable-next-line @typescript-eslint/no-implied-eval -- that is the thing under test
    const drawBoard = new Function(`${script}\nreturn drawBoard();`) as () => unknown;
    expect(drawBoard()).toEqual([[1], [0]]);
  });
});
