import type { Metadata } from 'next';
import { Geist_Mono, Noto_Sans_JP, Yuji_Syuku } from 'next/font/google';
import { site } from '../content/site';
import './globals.css';

const notoSansJp = Noto_Sans_JP({
  variable: '--font-noto-sans-jp',
  subsets: ['latin'],
  weight: ['400', '500', '700'],
});

const yujiSyuku = Yuji_Syuku({
  variable: '--font-yuji-syuku',
  subsets: ['latin'],
  weight: '400',
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} | ${site.nameEn}`,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  openGraph: {
    url: site.url,
    title: `${site.name} | ${site.nameEn}`,
    description: site.description,
    siteName: site.name,
    locale: 'ja_JP',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${notoSansJp.variable} ${yujiSyuku.variable} ${geistMono.variable}`}
    >
      <body className="antialiased scanlines">
        {children}
      </body>
    </html>
  );
}
