import { expect, it } from 'vitest';
import { compactTokens } from '../../src/data/compact-tokens';

const pre = (body: string) =>
  `<pre class="shiki" style="--shiki-light:#1f2328;--shiki-dark:#e6edf3;--shiki-light-bg:#fff"><code><span class="line">${body}</span></code></pre>`;

it('unwraps tokens in the base text colour and gives each other colour pair one class', () => {
  const { htmls, css } = compactTokens([
    pre(
      '<span style="--shiki-light:#1F2328;--shiki-dark:#E6EDF3">a</span>' +
        '<span style="--shiki-light:#a40e26;--shiki-dark:#FF7B72">const</span>',
    ),
    pre('<span style="--shiki-light:#a40e26;--shiki-dark:#FF7B72">let</span>'),
  ]);
  expect(htmls[0]).toContain('<span class="line">a<span class="sk0">const</span></span>');
  expect(htmls[1]).toContain('<span class="sk0">let</span>');
  expect(css).toBe('.sk0{color:light-dark(#a40e26,#FF7B72)}');
});

it('leaves a token alone when its style is not a plain colour pair', () => {
  const token =
    '<span style="--shiki-light:#a40e26;--shiki-dark:#FF7B72;font-style:italic">x</span>';
  expect(compactTokens([pre(token)]).htmls[0]).toContain(token);
});
