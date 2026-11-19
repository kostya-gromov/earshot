/**
 * Shiki writes both theme colours inline on every token, thousands of times per file, and the
 * page carries that HTML twice (markup and RSC payload). Same colours, fewer bytes: a token in
 * the block's base colour loses its span, every other colour pair becomes one shared class.
 */
const tokenPattern =
  /<span style="--shiki-light:(#[0-9a-fA-F]+);--shiki-dark:(#[0-9a-fA-F]+)">([^<]*)<\/span>/g;
const basePattern = /--shiki-light:(#[0-9a-fA-F]+);--shiki-dark:(#[0-9a-fA-F]+)/;

const pairKey = (light: string, dark: string) => `${light},${dark}`.toLowerCase();

export function compactTokens(htmls: readonly string[]): { htmls: string[]; css: string } {
  const classes = new Map<string, { name: string; light: string; dark: string }>();
  const classFor = (light: string, dark: string) => {
    const key = pairKey(light, dark);
    const known = classes.get(key);
    if (known) return known.name;
    const name = `sk${classes.size}`;
    classes.set(key, { name, light, dark });
    return name;
  };
  const compacted = htmls.map((html) => {
    const base = basePattern.exec(html);
    const baseKey = base ? pairKey(base[1]!, base[2]!) : undefined;
    return html.replace(tokenPattern, (_match, ...groups: string[]) => {
      const [light = '', dark = '', text = ''] = groups;
      return pairKey(light, dark) === baseKey
        ? text
        : `<span class="${classFor(light, dark)}">${text}</span>`;
    });
  });
  const css = [...classes.values()]
    .map(({ name, light, dark }) => `.${name}{color:light-dark(${light},${dark})}`)
    .join('');
  return { htmls: compacted, css };
}
