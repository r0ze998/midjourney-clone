// サイト全体の掲載情報。文言・リンクの更新はこのファイルだけで完結する。
//
// 掲載ルール
// - 根拠を確認できた事実だけを書く（出典はコメント）。構想・考えは「考えている」として書く。
// - 受賞・調達・ユーザー数・提携・公開日は、根拠がない限り載せない。
// - ja と en は同じ構成。片方だけ更新しない。
// - 模型の中（ゲーム内）の文字は英語（model.ui）。サイトの文章は各言語。

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

/** 模型の中の表示（英語で固定） */
export const modelUi = {
  layers: { logistics: 'Logistics', defense: 'Defense', ai: 'AI agents' },
  viewsLabel: 'View',
  views: { overview: 'Overview', trade: 'Trade road', ai: 'AI district', borders: 'Borders', ride: 'Ride a cart' },
  turn: 'Turn',
  readout: {
    title: 'World',
    moving: 'Carts moving',
    decisions: 'AI decisions',
    share: 'AI share of cargo',
    defended: 'Defended tiles',
  },
} as const;

/** Wylls の欄の画面の窓（英語で固定。位置は src/assets/wylls-village.jpg 1440×900 に対する %） */
export const screenUi = {
  shot: {
    title: 'Wylls — dev client',
    meta: 'Sample world · fixed clock',
    tags: [
      { x: 23, y: 3.5, text: 'Resources', dir: 'down' },
      { x: 47, y: 49, text: 'Town · Lamar', dir: 'down', mobile: true },
      { x: 50, y: 92, text: 'Town actions', dir: 'up' },
    ],
  },
  video: { title: 'Model — ride a cart', meta: 'Exported from this site' },
} as const;

/** 球体の模型の中の表示（英語で固定） */
export const globeUi = {
  stored: 'Stored',
  transit: 'In transit',
  total: 'Total',
} as const;

type Link = { label: string; href: string; note: string };
type Row = { label: string; value: string };

export type Content = {
  meta: { title: string; description: string; ogAlt: string };
  name: string;
  nameLatin: string;
  skip: string;
  externalHint: string;
  langSwitch: { label: string; href: string; hrefLang: Lang };
  nav: { label: string; href: string }[];
  hero: {
    kicker: string;
    title: string;
    lead: string;
  };
  model: {
    label: string;
    description: string;
    replay: string;
    captions: Record<'overview' | 'logistics' | 'ride' | 'defense' | 'ai' | 'verify', string>;
  };
  why: {
    label: string;
    heading: string;
    beats: { title: string; body: string }[];
  };
  wylls: {
    label: string;
    heading: string;
    oneLiner: string;
    status: string;
    facts: Row[];
    links: Link[];
    shot: { alt: string; caption: string };
    video: { caption: string; play: string; pause: string };
    pastLabel: string;
    past: { name: string; meta: string; desc: string; href: string }[];
  };
  origin: {
    label: string;
    heading: string;
    body: string;
    quote: { text: string; source: string };
    globe: {
      label: string;
      canvasLabel: string;
      staticNotice: string;
      shipment: string;
      departed: string;
      arrived: string;
      units: string;
      stillAlt: string;
    };
  };
  log: { label: string; heading: string; note: string; empty: string };
  company: { label: string; heading: string; rows: Row[] };
  contact: { label: string; heading: string; body: string; note: string; links: Link[] };
  footer: { top: string };
};

const ja: Content = {
  meta: {
    title: '株式会社雪風 | Yukikaze Inc.',
    description:
      '株式会社雪風は、人間とAIが同じルールで生きる世界を、ゲームで先に試す京都の会社です。現在は戦略ゲーム「Wylls」をSolanaで開発しています。',
    ogAlt: '株式会社雪風 — Make the world work.',
  },
  name: '株式会社雪風',
  nameLatin: 'YUKIKAZE INC.',
  skip: '本文へ移動',
  externalHint: '（外部サイト）',
  langSwitch: { label: 'EN', href: '/en', hrefLang: 'en' },
  nav: [
    { label: 'なぜゲームか', href: '#why' },
    { label: 'Wylls', href: '#wylls' },
    { label: '社名', href: '#origin' },
    { label: '会社', href: '#company' },
  ],
  hero: {
    kicker: 'KYOTO — GAME STUDIO',
    // 見出しは R・バックミンスター・フラーの言葉（「ワールド・ゲーム」の目的の冒頭）。出典は社名の項の引用に。
    // 見出しには出典を付けない（持ち主の指示、2026-11-04）
    title: 'Make the world work.',
    lead: '人間とAIが同じルールで生きる世界を、ゲームで先に試す会社です。',
  },
  model: {
    label: 'Wylls の世界の模型',
    description:
      'ヘックスの地図に、人の村が3つと、紫に光るAIエージェントの村が2つある。荷車が村と倉庫のあいだで物資を運び、在庫が増減する。ターンを進めると、村が育って国境が広がる。',
    replay: '自動の案内に戻す',
    captions: {
      overview: '人の村と、紫に光るAIエージェントの村が、同じ地図で暮らしている。',
      logistics: '荷車が村と倉庫を行き来し、在庫が動く。箱の数が、そのまま在庫の量。',
      ride: 'カメラがAIの荷車に乗る。AIの村の鉱石が倉庫を経て、人の村へ届く。',
      defense: '国境と見張り塔が、それぞれの土地を守る。',
      ai: 'AIの村も、人と同じルールで判断し、同じ道で荷を送る。',
      verify: '着いた荷はすべて記録され、誰でもあとから確かめられる。',
    },
  },
  why: {
    label: '01 — なぜゲームか',
    heading: 'なぜ、ゲームなのか。',
    beats: [
      {
        title: 'AIエージェントが、経済に入ってくる。',
        body: 'AIは、人に代わって取引し、交渉し、物を動かす主体になりつつあります。人とAIが同じ市場に立つとき、ルールがどう働くか。社会で試す前に確かめておきたい問いです。',
      },
      {
        title: 'ゲームは、社会の先行指標になりうる。',
        body: 'ゲームなら、人とAIを同じルールの中に置き、何が起きるかを小さく、速く、何度でも観察できます。ゲームの中で起きることは、これからの社会で起きることを先に映す。私たちはそう考えています。',
      },
      {
        title: 'ルールと状態を、チェーンに置く。',
        body: 'ルールと世界の状態を公開の台帳に置けば、運営を信じなくても、誰が何をしたかを誰でも確かめられます。人もAIも、同じ条件で参加できます。',
      },
    ],
  },
  wylls: {
    label: '02 — 作っているもの',
    heading: 'Wylls',
    oneLiner: '人間とAIが、同じ世界で文明を形づくる戦略ゲーム。',
    status: '開発中 · 一般公開前',
    // 出典: wylls/README.md, research/TECH_LANDSCAPE_2026.md
    facts: [
      { label: '状態', value: '開発中。ローカルのテスト用チェーンで動作を確認しています' },
      { label: '基盤', value: 'Solana' },
      { label: 'トークン', value: '独自トークンの発行を前提にしていません' },
    ],
    links: [
      { label: '紹介サイト', href: site.wylls, note: 'wylls-site.vercel.app' },
      { label: 'ピッチ映像', href: site.wyllsPitch, note: 'YouTube' },
      { label: 'ソースコード', href: site.wyllsRepo, note: 'GitHub' },
    ],
    // 出典: wylls/docs/design/uplift/shots/index.html（見本の世界：固定の時計・同じ乱数）
    shot: {
      alt: 'Wyllsの開発中の画面。ヘックスの地図の中央に町ラマール、まわりに森と湖。上に資源の数、下に町への操作の並び。',
      caption: '開発中のクライアントを、見本の世界（固定の時計・同じ乱数）で撮影した画面です。実際のシーズンではありません。',
    },
    video: {
      caption: '荷車が道を進む映像。サイトの模型から書き出したもので、ゲームの画面ではありません。',
      play: '再生',
      pause: '一時停止',
    },
    pastLabel: 'これまでの作品',
    past: [
      {
        name: '0xARK',
        meta: '2026 · Solana devnet · 試験版',
        desc: '1対1のカード対戦。手札を暗号学的に封をしてから公開し、カードごとの戦績がチェーン上に残る。',
        href: site.oxark,
      },
      {
        name: '0xCIV',
        meta: '2026 · Starknet / Dojo · ゲームジャム作品',
        // 出典: 0xciv/README.md、dojoengine/game-jams PR #270（受賞なし）
        desc: 'AIエージェントが文明を率いる小さな戦略ゲーム。Dojo Game Jam VIII の参加作。',
        href: site.oxciv,
      },
    ],
  },
  origin: {
    label: '03 — 社名',
    heading: '社名と、ワールド・ゲーム。',
    body: '陽炎型駆逐艦のなかで唯一、終戦まで残った「雪風」から名づけました。戦争を模したゲームではなく、全員が参加し、誰も損をしない道を探るゲームを。フラーが「ワールド・ゲーム」と呼んだこの考え方を、今の技術で試すことが雪風の出発点です。',
    quote: {
      // 原文: "Make the world work, for 100% of humanity, in the shortest possible time, through spontaneous cooperation, without ecological offense or the disadvantage of anyone."
      // 旧訳の「100%世界をうまく利用できる」は原文の「人類の 100% のために世界が機能する」とずれていたので訳し直した
      text: '生態系を損なうことなく、誰の不利益にもならず、自発的な協力によって、できるかぎり短い時間で、世界を人類の100%のために機能させる。',
      source: 'R・バックミンスター・フラー「ワールド・ゲーム」の目的（雪風訳）',
    },
    // 球体の模型の文言。模型の中（集落名・数の札）は英語で、site.ts の globeUi
    globe: {
      label: 'ひとつの世界と、6 つの集落',
      canvasLabel: '回せる球体の模型。6 つの集落と、集落をめぐる荷の流れ。ドラッグまたは矢印キーで回せます。',
      staticNotice: '静止画像を表示しています。回転操作は利用できません。',
      shipment: '運搬中',
      departed: '出発',
      arrived: '到着',
      units: '単位',
      stillAlt: '球体の模型。緑の大陸に 6 つの集落があり、集落のあいだを荷が弧を描いて運ばれている。',
    },
  },
  log: {
    label: '04 — 開発ログ',
    heading: '開発ログ',
    note: 'Wylls の公開リポジトリ（GitHub）から自動で取り込んでいます。',
    empty: '',
  },
  company: {
    label: '05 — 会社',
    heading: '会社概要',
    rows: [
      { label: '社名', value: '株式会社雪風（Yukikaze Inc.）' },
      { label: '所在地', value: '京都府京都市' },
      { label: '代表', value: '竹原 大智' },
      // 事業・肩書きは持ち主の回答（2026-11-04）：事業はゲーム開発だけ、肩書きは「代表」
      { label: '事業', value: 'AIとブロックチェーンを活用したゲームの開発' },
    ],
  },
  contact: {
    label: '06 — 連絡',
    heading: 'ご連絡',
    body: '協業、取材、投資、開発についてのご相談は、メールでお送りください。',
    note: 'お問い合わせフォームはありません。',
    links: [
      { label: 'X', href: site.x, note: '@r0ze_____' },
      { label: 'GitHub', href: site.github, note: 'r0ze998' },
    ],
  },
  footer: { top: 'ページの先頭へ' },
};

const en: Content = {
  meta: {
    title: 'Yukikaze Inc. | 株式会社雪風',
    description:
      'Yukikaze Inc. is a Kyoto studio that tries out, in games, a world where humans and AI live by the same rules. We are building Wylls, a strategy game on Solana.',
    ogAlt: 'Yukikaze Inc. — Make the world work.',
  },
  name: 'Yukikaze Inc.',
  nameLatin: '株式会社雪風',
  skip: 'Skip to content',
  externalHint: '(external site)',
  langSwitch: { label: 'JA', href: '/', hrefLang: 'ja' },
  nav: [
    { label: 'Why games', href: '#why' },
    { label: 'Wylls', href: '#wylls' },
    { label: 'Name', href: '#origin' },
    { label: 'Company', href: '#company' },
  ],
  hero: {
    kicker: 'KYOTO — GAME STUDIO',
    title: 'Make the world work.',
    lead: 'A studio that tries out, in games, a world where humans and AI live by the same rules.',
  },
  model: {
    label: 'A model of the Wylls world',
    description:
      'A hex map with three human villages and two AI-agent villages glowing violet. Carts carry goods between villages and depots, and stocks rise and fall. As turns pass, villages grow and borders widen.',
    replay: 'Resume the tour',
    captions: {
      overview: 'Human villages and AI-agent villages, glowing violet, share one map.',
      logistics: 'Carts run between villages and depots, and stocks move. Each crate is stock.',
      ride: 'The camera rides an AI cart: ore from an AI village, through a depot, to a human village.',
      defense: 'Borders and watchtowers hold each territory.',
      ai: 'AI villages decide under the same rules as people, and ship on the same roads.',
      verify: 'Every delivery is recorded, so anyone can check it later.',
    },
  },
  why: {
    label: '01 — Why games',
    heading: 'Why games?',
    beats: [
      {
        title: 'AI agents are entering the economy.',
        body: 'AI is becoming something that trades, negotiates and moves goods on people’s behalf. When humans and AI meet in the same market, how do the rules hold up? It is a question worth answering before society has to.',
      },
      {
        title: 'Games can be a leading indicator.',
        body: 'In a game, people and AI can live under one set of rules, and we can watch what happens: small, fast and as often as we like. We believe what happens in games shows, early, what will happen in society.',
      },
      {
        title: 'Rules and state, on a chain.',
        body: 'Put the rules and the state of the world on a public ledger, and anyone can check who did what without trusting the operator. People and AI take part on the same terms.',
      },
    ],
  },
  wylls: {
    label: '02 — What we build',
    heading: 'Wylls',
    oneLiner: 'A strategy game where humans and AI shape a civilization in the same world.',
    status: 'In development · not yet public',
    facts: [
      { label: 'Status', value: 'In development, running on local test chains' },
      { label: 'Chain', value: 'Solana' },
      { label: 'Token', value: 'Not designed around a token of its own' },
    ],
    links: [
      { label: 'Project site', href: site.wylls, note: 'wylls-site.vercel.app' },
      { label: 'Pitch video', href: site.wyllsPitch, note: 'YouTube' },
      { label: 'Source code', href: site.wyllsRepo, note: 'GitHub' },
    ],
    shot: {
      alt: 'The Wylls client in development: the town of Lamar at the centre of a hex map, with forest and lakes around it, resource counts at the top and town actions at the bottom.',
      caption: 'The client in development, captured in a sample world (fixed clock, fixed seed). Not a live season.',
    },
    video: {
      caption: 'A cart on the road, exported from this site’s model. Not a game screen.',
      play: 'Play',
      pause: 'Pause',
    },
    pastLabel: 'Earlier work',
    past: [
      {
        name: '0xARK',
        meta: '2026 · Solana devnet · test version',
        desc: 'One-on-one card battles. Hands are sealed cryptographically before reveal, and each card keeps its record on-chain.',
        href: site.oxark,
      },
      {
        name: '0xCIV',
        meta: '2026 · Starknet / Dojo · game jam entry',
        desc: 'A small strategy game where AI agents lead civilizations. An entry to Dojo Game Jam VIII.',
        href: site.oxciv,
      },
    ],
  },
  origin: {
    label: '03 — Name',
    heading: 'Our name, and the World Game.',
    body: 'Named after the destroyer Yukikaze, the only ship of the Kagerō class to survive to the end of the Second World War. Not a game that imitates war, but one that looks for a way in which everyone takes part and no one loses out. Trying what Fuller called the World Game, with today’s technology, is where Yukikaze starts.',
    quote: {
      text: 'Make the world work, for 100% of humanity, in the shortest possible time, through spontaneous cooperation, without ecological offense or the disadvantage of anyone.',
      source: 'R. Buckminster Fuller, on the aim of the World Game',
    },
    globe: {
      label: 'One world, six settlements',
      canvasLabel: 'A globe you can turn: six settlements and the goods that travel between them. Drag, or use the arrow keys.',
      staticNotice: 'A still image is shown. Rotation is unavailable.',
      shipment: 'In transit',
      departed: 'Departed',
      arrived: 'Arrived',
      units: 'units',
      stillAlt: 'A globe: six settlements on green continents, with goods carried between them along arcs.',
    },
  },
  log: {
    label: '04 — Dev log',
    heading: 'Dev log',
    note: 'Pulled automatically from the public Wylls repository on GitHub.',
    empty: '',
  },
  company: {
    label: '05 — Company',
    heading: 'Company',
    rows: [
      { label: 'Company', value: 'Yukikaze Inc. (株式会社雪風)' },
      { label: 'Location', value: 'Kyoto City, Kyoto, Japan' },
      { label: 'Representative', value: 'Daichi Takehara' },
      { label: 'Business', value: 'Games built with AI and blockchain' },
    ],
  },
  contact: {
    label: '06 — Contact',
    heading: 'Get in touch',
    body: 'For partnerships, press, investment or development, please write to us by email.',
    note: 'There is no contact form.',
    links: [
      { label: 'X', href: site.x, note: '@r0ze_____' },
      { label: 'GitHub', href: site.github, note: 'r0ze998' },
    ],
  },
  footer: { top: 'Back to top' },
};

export const content: Record<Lang, Content> = { ja, en };
