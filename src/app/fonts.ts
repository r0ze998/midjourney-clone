import { Geist_Mono, Noto_Sans_JP, Shippori_Mincho } from 'next/font/google';

// 本文: Noto Sans JP / 見出し: Shippori Mincho / 記録・ラベル: Geist Mono（いずれも SIL OFL 1.1）
export const sans = Noto_Sans_JP({
  variable: '--font-noto-sans-jp',
  subsets: ['latin'],
  weight: ['400', '500', '700'],
});

export const serif = Shippori_Mincho({
  variable: '--font-shippori',
  subsets: ['latin'],
  weight: ['500', '600'],
});

export const mono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  weight: ['400', '500'],
});

export const fontVariables = `${sans.variable} ${serif.variable} ${mono.variable}`;
