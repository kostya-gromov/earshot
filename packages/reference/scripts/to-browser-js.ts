/**
 * Turns a reference TypeScript module into the JavaScript the browser runs. Because the
 * reference uses erasable syntax only, this removes type annotations and rewrites `.ts`
 * import specifiers to `.js`, nothing else. The dev server, the engine and the Atlas
 * "Copy as JavaScript" action all use this one function, so they cannot drift apart.
 *
 * Two things to know:
 * - transpileModule does not reject non-erasable syntax such as enums; `erasableSyntaxOnly`
 *   in tsconfig.base.json does, through `pnpm typecheck`.
 * - The emitter reprints the file, so formatting can change (import quotes become double).
 *   Behavior is identical; text meant for people ("Copy as JavaScript") should be run
 *   through Prettier afterwards.
 */
import ts from 'typescript';

export function toBrowserJs(source: string, fileName: string): string {
  const { outputText, diagnostics = [] } = ts.transpileModule(source, {
    fileName,
    reportDiagnostics: true,
    compilerOptions: {
      target: ts.ScriptTarget.ES2023,
      module: ts.ModuleKind.ESNext,
      verbatimModuleSyntax: true,
      rewriteRelativeImportExtensions: true,
    },
  });
  if (diagnostics.length > 0) {
    const messages = diagnostics.map((d) => ts.flattenDiagnosticMessageText(d.messageText, '\n'));
    throw new Error(`${fileName}: ${messages.join('; ')}`);
  }
  return outputText;
}
