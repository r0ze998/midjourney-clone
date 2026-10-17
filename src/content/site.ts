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
  // 以下はすべて 2026-10-17 に到達を確認
  wylls: 'https://wylls-site.vercel.app/',
  wyllsRepo: 'https://github.com/r0ze998/wylls',
  wyllsPitch: 'https://youtu.be/WMAESO0xbek',
  oxark: 'https://r0ze998.github.io/0xark/',
  oxciv: 'https://r0ze998.github.io/0xciv/',
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
  nav: { label: string; href: string }[];
  approach: {
    label: string;
    heading: string;
    body: string[];
    quote: { text: string; source: string };
    name: { title: string; body: string };
  };
  works: {
    label: string;
    heading: string;
    wylls: {
      oneLiner: string;
      imageAlt: string;
      imageCaption: string;
      facts: { label: string; value: string }[];
      links: { label: string; href: string; note: string }[];
    };
    pastLabel: string;
    past: { name: string; year: string; platform: string; status: string; desc: string; href: string }[];
  };
  companySection: { label: string; heading: string };
  contact: { label: string; heading: string; body: string; note: string };
  footer: { top: string };
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
  nav: [
    { label: '考え方', href: '#approach' },
    { label: '作品', href: '#works' },
    { label: '会社', href: '#company' },
    { label: '連絡', href: '#contact' },
  ],
  approach: {
    label: '01 — 考え方',
    heading: 'なぜ、ゲームなのか。',
    body: [
      '雪風が長く関心を持っているのは、経済とインターネットのしくみを作り直すことです。ただ、新しい経済のルールは、構想を語るだけでは確かめられません。',
      'ゲームなら、ルールを決めて公開し、人とAIを同じ条件で参加させ、何が起きたかを記録して、誰でもあとから検証できます。雪風にとってゲームは、新しいルールを小さく、実際に試せる場所です。',
    ],
    quote: {
      text: '生態系を破壊することなく、また誰の不利益も被ることなく、自発的な協力によって、可能な限り最短の時間で、100%世界をうまく利用できるようにする。',
      source: 'R・バックミンスター・フラー「ワールド・ゲーム」の目的（雪風訳）',
    },
    name: {
      title: '社名について',
      body: '陽炎型駆逐艦のなかで唯一、終戦まで残った「雪風」から名づけました。戦争を模したゲームではなく、全員が参加し、誰も損をしない道を探るゲームを。フラーが「ワールド・ゲーム」と呼んだこの考え方を、今の技術で試すことが雪風の出発点です。',
    },
  },
  works: {
    label: '02 — 作品',
    heading: '作っているもの',
    wylls: {
      oneLiner: '人間とAIが、同じ世界で文明を形づくる戦略ゲーム。',
      imageAlt: 'Wyllsの観戦画面。6つの国の領土が色分けされたヘックス地図、左に国別の順位、右に直近の出来事の一覧。',
      // 出典: wylls/README.md のキャプション（テストデータ、2026-10-09 撮影）
      imageCaption: '開発中のクライアントの観戦画面。テストデータで表示したもので、実際のシーズンではありません。',
      facts: [
        { label: '状態', value: '開発中 · 一般公開前' },
        { label: '基盤', value: 'Solana' },
        { label: 'トークン', value: '独自トークンの発行を前提にしていません' },
      ],
      links: [
        { label: '紹介サイト', href: site.wylls, note: 'wylls-site.vercel.app' },
        { label: 'ピッチ映像', href: site.wyllsPitch, note: 'YouTube' },
        { label: 'ソースコード', href: site.wyllsRepo, note: 'GitHub' },
      ],
    },
    pastLabel: 'これまでの作品',
    past: [
      {
        name: '0xARK',
        year: '2026',
        platform: 'Solana devnet',
        status: '試験版',
        // 出典: 0xark/README.md, docs/RELEASE_READINESS.md
        desc: '1対1のカード対戦。手札を暗号学的に封をしてから公開し、カードごとの戦績がチェーン上に残る。',
        href: site.oxark,
      },
      {
        name: '0xCIV',
        year: '2026',
        platform: 'Starknet / Dojo',
        status: 'ゲームジャム作品',
        // 出典: 0xciv/README.md、dojoengine/game-jams PR #270
        desc: 'AIエージェントが文明を率いる小さな戦略ゲーム。Dojo Game Jam VIII 参加作。Wyllsにつながる最初の試作。',
        href: site.oxciv,
      },
    ],
  },
  companySection: { label: '03 — 会社概要', heading: '会社概要' },
  contact: {
    label: '04 — 連絡',
    heading: 'ご連絡',
    body: '協業、取材、投資、開発についてのご相談は、メールでお送りください。',
    note: 'お問い合わせフォームはありません。',
  },
  footer: { top: 'ページの先頭へ' },
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
  nav: [
    { label: 'Approach', href: '#approach' },
    { label: 'Work', href: '#works' },
    { label: 'Company', href: '#company' },
    { label: 'Contact', href: '#contact' },
  ],
  approach: {
    label: '01 — Approach',
    heading: 'Why games?',
    body: [
      'What Yukikaze has long cared about is rebuilding how the economy and the internet work. But new economic rules cannot be proven by describing them.',
      'In a game, you can set the rules and publish them, let people and AI take part on the same terms, record what happens, and let anyone check it afterwards. For us, a game is a place to try new rules at a small scale, for real.',
    ],
    quote: {
      text: 'Make the world work, for 100% of humanity, in the shortest possible time, through spontaneous cooperation, without ecological offense or the disadvantage of anyone.',
      source: 'R. Buckminster Fuller, on the aim of the World Game',
    },
    name: {
      title: 'About the name',
      body: 'Named after the destroyer Yukikaze, the only ship of the Kagerō class to survive to the end of the Second World War. Not a game that imitates war, but one that looks for a way in which everyone takes part and no one loses out. Trying what Fuller called the World Game, with today’s technology, is where Yukikaze starts.',
    },
  },
  works: {
    label: '02 — Work',
    heading: 'What we are building',
    wylls: {
      oneLiner: 'A strategy game where humans and AI shape a civilization in the same world.',
      imageAlt: 'The Wylls spectator view: a hex map with the territory of six nations in different colours, nation standings on the left and recent events on the right.',
      imageCaption: 'Spectator view of the client in development, shown with test data. Not a live season.',
      facts: [
        { label: 'Status', value: 'In development · not yet public' },
        { label: 'Chain', value: 'Solana' },
        { label: 'Token', value: 'Not designed around a token of its own' },
      ],
      links: [
        { label: 'Project site', href: site.wylls, note: 'wylls-site.vercel.app' },
        { label: 'Pitch video', href: site.wyllsPitch, note: 'YouTube' },
        { label: 'Source code', href: site.wyllsRepo, note: 'GitHub' },
      ],
    },
    pastLabel: 'Earlier work',
    past: [
      {
        name: '0xARK',
        year: '2026',
        platform: 'Solana devnet',
        status: 'Test version',
        desc: 'One-on-one card battles. Hands are sealed cryptographically before reveal, and each card keeps its record on-chain.',
        href: site.oxark,
      },
      {
        name: '0xCIV',
        year: '2026',
        platform: 'Starknet / Dojo',
        status: 'Game jam entry',
        desc: 'A small strategy game where AI agents lead civilizations. Entered in Dojo Game Jam VIII; the first prototype on the road to Wylls.',
        href: site.oxciv,
      },
    ],
  },
  companySection: { label: '03 — Company', heading: 'Company' },
  contact: {
    label: '04 — Contact',
    heading: 'Get in touch',
    body: 'For partnerships, press, investment or development, please write to us by email.',
    note: 'There is no contact form.',
  },
  footer: { top: 'Back to top' },
};

export const content: Record<Lang, Content> = { ja, en };
