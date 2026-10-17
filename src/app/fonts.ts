import { Geist_Mono, Noto_Sans_JP, Zen_Old_Mincho } from 'next/font/google';

// 本文: Noto Sans JP / 社名・宣言: Zen Old Mincho / ラベル: Geist Mono（いずれも SIL OFL 1.1）
export const sans = Noto_Sans_JP({
  variable: '--font-noto-sans-jp',
  subsets: ['latin'],
  weight: ['400', '500'],
});

export const serif = Zen_Old_Mincho({
  variable: '--font-zen-old-mincho',
  subsets: ['latin'],
  weight: ['400', '900'],
});

export const mono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  weight: ['400', '500'],
});

export const fontVariables = `${sans.variable} ${serif.variable} ${mono.variable}`;
