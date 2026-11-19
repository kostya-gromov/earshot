import type { AxEntry, AxPropValue } from '../../src/model/ax-tree.ts';

interface EntryOptions {
  depth?: number;
  props?: Record<string, AxPropValue>;
}

export function axEntry(role: string, name: string, options: EntryOptions = {}): AxEntry {
  return {
    role,
    name,
    depth: options.depth ?? 0,
    props: options.props ?? {},
  };
}
