import type { NextConfig } from 'next';

// ADR 0001: static export only. No API routes, middleware, ISR or server actions.
const config: NextConfig = {
  output: 'export',
  // Every page exports as <route>/index.html, so the "/route/" links the site uses resolve on any
  // static host and on the local test server, without host-specific clean-URL rules.
  trailingSlash: true,
  reactStrictMode: true,
  // Static export has no image optimisation server.
  images: { unoptimized: true },
  // CSS stays in linked files. `experimental.inlineCss` also writes every rule into the RSC
  // payload, which made the pattern page's document 114 KB gzip instead of 64 KB and cost it the
  // Lighthouse gate (docs/follow-ups/web-vitals.md, 2026-11-14).
  // Workspace packages ship TypeScript source (ADR 0002); Next compiles them with the app.
  transpilePackages: ['@earshot/contracts', '@earshot/reference'],
};

export default config;
