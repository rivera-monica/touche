import type { Metadata } from 'next';
import { Suranna, Cormorant_Garamond, Inter, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';

const suranna = Suranna({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-suranna',
  display: 'swap',
});

const cormorant = Cormorant_Garamond({
  weight: ['500', '600'],
  subsets: ['latin'],
  variable: '--font-cormorant',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const plexMono = IBM_Plex_Mono({
  weight: ['400', '500', '600'],
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Touché — Master Recipe Dashboard',
  description: 'Touché candle recipe catalog and lineage tracker.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${suranna.variable} ${cormorant.variable} ${inter.variable} ${plexMono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
