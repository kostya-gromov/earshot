import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Inter, Newsreader } from 'next/font/google';
import { themeBootScript, themeBootStyle } from '@/features/theme';
import { siteOrigin } from '@/lib/site-origin';
import { platformBootScript } from '@/ui';
import './globals.css';

// next/font self-hosts the files at build time with metric-matched fallbacks: no layout shift
// from fonts and no request to Google from the visitor's browser.
// The optical-size axis gives the large display cut its tighter shapes (D1a's title).
// Known gap (measured 2026-11-13): with a slow font the home page still shifts by 0.036 at
// 1440 px, because the fallback is about 5% narrower than this variable cut and a few lines
// re-break. One custom fallback scale, and one per weight, were tried and made 390 px or the
// title worse; see docs/follow-ups/web-vitals.md.
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  axes: ['opsz'],
});
// Serif italic is reserved for what a screen reader would say (apps/atlas/CLAUDE.md).
const newsreader = Newsreader({
  subsets: ['latin'],
  style: ['italic'],
  weight: ['400'],
  variable: '--font-newsreader',
  display: 'swap',
});

export const metadata: Metadata = {
  // Link previews need absolute addresses; the image itself is app/opengraph-image.png, taken
  // from the home page by scripts/og-image.ts.
  metadataBase: new URL(siteOrigin),
  title: { default: 'Earshot', template: '%s · Earshot' },
  description:
    'Keyboard behavior, focus and announcements of interactive components, measured across design systems.',
  openGraph: { siteName: 'Earshot', type: 'website' },
  twitter: { card: 'summary_large_image' },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // The boot scripts set data-theme and data-platform before React hydrates, so the
    // attributes may differ.
    <html lang="en" className={`${inter.variable} ${newsreader.variable}`} suppressHydrationWarning>
      <head>
        <style dangerouslySetInnerHTML={{ __html: themeBootStyle }} />
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
        <script dangerouslySetInnerHTML={{ __html: platformBootScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
