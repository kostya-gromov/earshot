export interface RunRequestInput {
  url: string;
}

export type RunRequestCheck =
  { ok: true; url: string } | { ok: false; field: 'url'; message: string };

// Hosts only the person's own machine or network can reach; the engine could never open them.
const privateHost = /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|\[::1\])|\.local$/;

function parseHttps(value: string): URL | undefined {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url : undefined;
  } catch {
    return undefined;
  }
}

/** Checks the "Run it" story address. Messages say what is wrong and how to fix it (apps/atlas/CLAUDE.md). */
export function checkRunRequest({ url }: RunRequestInput): RunRequestCheck {
  const address = url.trim();
  if (address === '') {
    return {
      ok: false,
      field: 'url',
      message: 'Enter the address of a public page, for example a Storybook story.',
    };
  }
  const parsed = parseHttps(address);
  if (!parsed) {
    return {
      ok: false,
      field: 'url',
      message: 'Enter a full public URL that starts with https://.',
    };
  }
  if (privateHost.test(parsed.hostname)) {
    return {
      ok: false,
      field: 'url',
      message: 'That address only opens on your own computer or network. Enter a public URL.',
    };
  }
  return { ok: true, url: address };
}
