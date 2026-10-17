// サイト全体の掲載情報。文言・リンクの更新はこのファイルだけで完結する。
//
// 掲載ルール
// - 根拠を確認できた事実だけを書く（出典はコメント）。構想は「目指していること」として書く。
// - 受賞・調達・ユーザー数・提携・公開日は、根拠がない限り載せない。
// - ja と en は同じ構成。片方だけ更新しない。

export type Lang = 'ja' | 'en';

export const site = {
  url: 'https://www.yukikaze.games',
  email: 'takehara998@gmail.com',
  x: 'https://x.com/r0ze_____',
  github: 'https://github.com/r0ze998',
  // 2026-10-17 に到達を確認
  wylls: 'https://wylls-site.vercel.app/',
} as const;

// 背景に流れる文字列。旧サイトから引き継いだ社訓・断片。
export const rainTexts = [
  '妖精を見るには妖精の目がいる',
  '人となりては童のことを捨てたり',
  '117',
  'すべては同じ木の枝',
  'Free my mind',
  '饒速日',
  'The answer',
  'yukikaze',
  'world game',
  '998',
] as const;

export type Content = {
  meta: { title: string; description: string; ogAlt: string };
  name: string;
  nameLatin: string;
  kicker: string;
  statement: string;
  lead: string;
  now: { label: string; name: string; desc: string; status: string; href: string };
  links: { label: string; href: string; note: string }[];
  company: { label: string; value: string }[];
  langSwitch: { label: string; href: string; hrefLang: Lang };
  externalHint: string;
  skip: string;
  rail: string;
};

const ja: Content = {
  meta: {
    title: '株式会社雪風 | Yukikaze Inc.',
    description:
      '株式会社雪風は、AIとブロックチェーンを使ってゲームを開発する京都の会社です。現在は、人間とAIが同じ世界で文明を形づくる戦略ゲーム「Wylls」をSolanaで開発しています。',
    ogAlt: '株式会社雪風 — ゲームで、新しいルールを試す。',
  },
  name: '株式会社雪風',
  nameLatin: 'YUKIKAZE INC.',
  kicker: 'KYOTO — GAME STUDIO',
  statement: 'ゲームで、\n新しいルールを試す。',
  lead: 'AIとブロックチェーンでゲームを作る、京都の会社です。経済とインターネットを作り直すための新しいルールを、人とAIが実際に遊べる世界として形にしています。',
  now: {
    label: 'NOW BUILDING',
    name: 'Wylls',
    desc: '人間とAIが同じ世界で文明を形づくる戦略ゲーム。Solana上で開発中。',
    status: '開発中 · 一般公開前',
    href: site.wylls,
  },
  links: [
    { label: 'X', href: site.x, note: '@r0ze_____' },
    { label: 'GitHub', href: site.github, note: 'r0ze998' },
    { label: 'Mail', href: `mailto:${site.email}`, note: site.email },
  ],
  company: [
    { label: '社名', value: '株式会社雪風' },
    { label: '所在地', value: '京都府京都市' },
    { label: '代表', value: '竹原 大智' },
    { label: '事業', value: 'AIとブロックチェーンを活用したゲームの開発' },
  ],
  langSwitch: { label: 'EN', href: '/en', hrefLang: 'en' },
  externalHint: '（外部サイト）',
  skip: '本文へ移動',
  rail: 'WORLD GAME — NOT WORLD WAR GAME',
};

const en: Content = {
  meta: {
    title: 'Yukikaze Inc. | 株式会社雪風',
    description:
      'Yukikaze Inc. is a Kyoto-based studio that builds games with AI and blockchain. We are currently developing Wylls, a strategy game on Solana where humans and AI shape a civilization in the same world.',
    ogAlt: 'Yukikaze Inc. — Testing new rules through games.',
  },
  name: 'Yukikaze Inc.',
  nameLatin: '株式会社雪風',
  kicker: 'KYOTO — GAME STUDIO',
  statement: 'Testing new rules\nthrough games.',
  lead: 'A Kyoto studio building games with AI and blockchain. We turn the new rules needed to rebuild the economy and the internet into worlds that people and AI can actually play.',
  now: {
    label: 'NOW BUILDING',
    name: 'Wylls',
    desc: 'A strategy game where humans and AI shape a civilization in the same world. In development on Solana.',
    status: 'In development · not yet public',
    href: site.wylls,
  },
  links: [
    { label: 'X', href: site.x, note: '@r0ze_____' },
    { label: 'GitHub', href: site.github, note: 'r0ze998' },
    { label: 'Mail', href: `mailto:${site.email}`, note: site.email },
  ],
  company: [
    { label: 'Company', value: 'Yukikaze Inc.' },
    { label: 'Location', value: 'Kyoto, Japan' },
    { label: 'Founder', value: 'Daichi Takehara' },
    { label: 'Business', value: 'Games built with AI and blockchain' },
  ],
  langSwitch: { label: 'JA', href: '/', hrefLang: 'ja' },
  externalHint: '(external site)',
  skip: 'Skip to content',
  rail: 'WORLD GAME — NOT WORLD WAR GAME',
};

export const content: Record<Lang, Content> = { ja, en };
