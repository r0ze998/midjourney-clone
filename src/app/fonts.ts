import { Geist_Mono, Zen_Old_Mincho } from 'next/font/google';

// 見出し: Zen Old Mincho / ラベル・模型の英字: Geist Mono（どちらも SIL OFL 1.1）。
// 本文は端末の日本語書体（Hiragino・Noto Sans CJK・Yu Gothic）を使う。本文用の Web フォントを
// 読むと初回の転送量が 1MB 近く増えるため。
export const serif = Zen_Old_Mincho({
  variable: '--font-zen-old-mincho',
  subsets: ['latin'],
  weight: ['400'],
});

export const mono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  weight: ['400', '500'],
});

export const fontVariables = `${serif.variable} ${mono.variable}`;
