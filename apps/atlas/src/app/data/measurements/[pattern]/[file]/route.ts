import { patterns as published, patternsInProgress } from '@earshot/contracts';
import { loadMeasurementFiles } from '@/data/measurements';

// Exported as static files at build time, so every card's "Raw JSON" link serves the very file
// the page was built from. A pattern in progress is measured before it has a page; its files are served as well.
export const dynamic = 'force-static';

const patterns = { ...published, ...patternsInProgress };

export async function generateStaticParams() {
  const params = await Promise.all(
    Object.values(patterns).map(async (pattern) =>
      (await loadMeasurementFiles(pattern)).map(({ file }) => ({
        pattern: pattern.id,
        file: file.split('/').at(-1) ?? file,
      })),
    ),
  );
  return params.flat();
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ pattern: string; file: string }> },
) {
  const { pattern: patternId, file } = await params;
  const pattern = patterns[patternId];
  const loaded = pattern ? await loadMeasurementFiles(pattern) : [];
  const match = loaded.find((entry) => entry.file.endsWith(`/${file}`));
  if (!match) return new Response('Not found', { status: 404 });
  // Indented, so a reader who follows "Raw JSON" can find a scenario or a verdict in it: on one
  // line it was 53 KB of unbroken text (design review 2026-11-13). The values are the engine's,
  // parsed and validated at build time; only the whitespace is ours.
  return new Response(`${JSON.stringify(match.measurement, null, 2)}\n`, {
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}
