/*
 * ComboBoxTokenFieldValue, word for word from the React Aria docs' TokenField "ComboBox" example
 * (packages/dev/s2-docs/pages/react-aria/ComboBoxTokenFieldValue.ts in adobe/react-spectrum, main,
 * fetched 2026-11-13; Apache-2.0). The docs page imports it as './ComboBoxTokenFieldValue' and does
 * not print it, and it is not published on npm, so it is written out here. One change: `Key` is
 * imported from react-aria-components, which re-exports the same type, so the harness needs no
 * second package.
 */
/* eslint-disable prefer-const, complexity, @typescript-eslint/no-this-alias --
   third-party code kept word for word, so the page is the docs example and not our rewrite of it. */
import { TokenFieldValue } from 'react-aria-components/TokenField';
import type { Key } from 'react-aria-components';

export class ComboBoxTokenFieldValue extends TokenFieldValue<Key> {
  getSelectedKeys(): Key[] {
    return this.segments.filter((seg) => seg.type === 'token').map((seg) => seg.value!);
  }

  getInputValue(): string {
    let segment = this.segments[this.caretPosition.index];
    return segment?.type === 'text' ? segment.text : '';
  }

  setSelectedKeys(keys: Key[]): ComboBoxTokenFieldValue {
    let selectedKeys = this.getSelectedKeys();
    let added: Key[] = [];
    for (let key of keys) {
      if (!selectedKeys.includes(key)) {
        added.push(key);
      }
    }
    let removed = new Set();
    for (let key of selectedKeys) {
      if (!keys.includes(key)) {
        removed.add(key);
      }
    }

    let value = this;
    for (let key of removed) {
      let index = value.segments.findIndex((seg) => seg.type === 'token' && seg.value! === key);
      value = value.replaceRangeWithSegments(
        { index: index, offset: 0 },
        { index: index, offset: value.segments[index]?.text.length ?? 0 },
        [],
        false,
      );
    }

    if (added.length > 0) {
      let segment = value.segments[value.caretPosition.index];
      value = value.replaceRangeWithSegments(
        { index: value.caretPosition.index, offset: 0 },
        segment?.type === 'text'
          ? {
              index: value.caretPosition.index,
              offset: value.segments[value.caretPosition.index]?.text.length ?? 0,
            }
          : { index: value.caretPosition.index, offset: 0 },
        added.map((value) => {
          return { type: 'token', text: String(value), value: value };
        }),
        false,
      );
    }

    return value;
  }
}
