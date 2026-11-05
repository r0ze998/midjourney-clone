import { Big_Shoulders, Geist_Mono, Zen_Old_Mincho } from 'next/font/google';

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

// ヒーローの見出し「MAKE THE WORLD WORK.」だけに使う（SIL OFL 1.1）。持ち主の選択（2026-11-04）
// Big Shoulders は opsz 軸の大きい側が Display の形（見比べた候補 4）
export const display = Big_Shoulders({
  variable: '--font-big-shoulders',
  subsets: ['latin'],
  weight: 'variable',
  axes: ['opsz'],
});

export const fontVariables = `${serif.variable} ${mono.variable} ${display.variable}`;
