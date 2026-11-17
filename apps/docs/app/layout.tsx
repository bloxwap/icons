import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { BloxwapSans } from '@bloxwap/font/sans';
import { BloxwapMono } from '@bloxwap/font/mono';
import { Provider } from '@/components/provider';
import { basePath, siteUrl } from '@/lib/site';
import './global.css';
export const metadata: Metadata = {
  metadataBase: new URL(`${siteUrl}${basePath}/`),
  title: { default: 'Bloxwap Icons — One library. Every interface.', template: '%s · Bloxwap Icons' },
  description: 'Explore the Bloxwap icon library. Consistent vector icons for React, React Native, and SVG, with a searchable catalog and ready-to-use examples.',
  icons: { icon: `${basePath}/icon.svg` },
  openGraph: { title: 'Bloxwap Icons', description: 'One library. Every interface.', type: 'website', siteName: 'Bloxwap Icons' },
};
export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="en" suppressHydrationWarning className={`${BloxwapSans.variable} ${BloxwapMono.variable} dark`}><body className="flex min-h-screen flex-col antialiased"><a href="#main" className="skip-link">Skip to content</a><Provider>{children}</Provider></body></html>;
}
