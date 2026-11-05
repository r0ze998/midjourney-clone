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
  // 持ち主が追加（2026-11-05）
  'Call Me Trimtab',
  'Timekeeping for Digital Gods',
  'How to Fall in Love with a System',
  'Good Luck, Yukikaze',
  'Spaceship Earth',
  'Hackers & Painters',
  'Utopia or Oblivion',
  'A World Beyond Its Maker',
  'Gods Without Root Access',
  'A Ghost in the State Machine',
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
    /** 見出しの下の一文（日本語の見出し） */
    lead: string;
    body: string[];
  };
  model: {
    label: string;
    description: string;
    replay: string;
    captions: Record<'overview' | 'logistics' | 'ride' | 'defense' | 'ai' | 'verify', string>;
  };
  /** 見出しは英語。本文は段落の並び。場面ごとに分けて置く（parts の 1 つが模型の 1 場面） */
  why: { label: string; heading: string; parts: string[][] };
  humans: { label: string; heading: string; body: string[] };
  wylls: {
    label: string;
    heading: string;
    oneLiner: string;
    body: string[];
    status: string;
    facts: Row[];
    links: Link[];
    shot: { alt: string; caption: string };
    video: { caption: string; play: string; pause: string };
    pastLabel: string;
    past: { name: string; meta: string; desc: string; href: string }[];
  };
  /** 構想（まだ実装していない方向）。ラベルで構想だと示す */
  build: { label: string; heading: string; body: string[] };
  origin: {
    label: string;
    heading: string;
    body: string[];
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
  /** 会社の取り組み（WHAT WE DO）。項目の名前は日英とも英語 */
  what: { label: string; heading: string; lead: string; body: string; items: { no: string; name: string; text: string }[] };
  company: { label: string; heading: string; body: string[]; rowsLabel: string; rows: Row[] };
  contact: { label: string; heading: string; body: string; note: string; links: Link[] };
  footer: { top: string };
};

const ja: Content = {
  meta: {
    title: '株式会社雪風 | Yukikaze Inc.',
    description:
      '株式会社雪風は、京都を拠点に、ブロックチェーンを用いたプロダクトを開発する会社です。経済とインターネットを再構築し、誰もが参加できる新しい経済のあり方を、ゲームから探っています。現在は戦略ゲーム「Wylls」を開発しています。',
    ogAlt: '株式会社雪風 — Make the world work.',
  },
  name: '株式会社雪風',
  nameLatin: 'YUKIKAZE INC.',
  skip: '本文へ移動',
  externalHint: '（外部サイト）',
  langSwitch: { label: 'EN', href: '/en', hrefLang: 'en' },
  nav: [
    { label: 'Why games', href: '#why' },
    { label: 'Humans & AI', href: '#humans' },
    { label: 'Wylls', href: '#wylls' },
    { label: 'World Game', href: '#origin' },
    { label: 'Yukikaze', href: '#company' },
  ],
  hero: {
    kicker: 'KYOTO — GAME STUDIO',
    // 見出しは R・バックミンスター・フラーの言葉（「ワールド・ゲーム」の目的の冒頭）。出典は社名の項の引用に。
    // 見出しには出典を付けない（持ち主の指示、2026-11-04）
    title: 'Make the world work.',
    // 本文は持ち主の文章（2026-11-05）
    lead: '経済とインターネットを、再構築する。',
    body: [
      '雪風が目指すのは、国籍や資本によって参加の可能性が閉ざされず、一人ひとりが自分の意思で選び、協力できる経済です。',
      'ブロックチェーンを、価値を記録するためだけでなく、ルールを共有し、行動の結果を確かめられる仕組みとして使う。',
      '私たちは、誰もが参加できる新しい経済のあり方を、ゲームから探っています。',
    ],
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
    heading: 'Why games',
    parts: [
      [
        'ゲームの中には、生産、交換、希少性、協力、競争といった、経済の基本的な働きがあります。',
        'ルールが変われば、人々の行動も変わる。一人の選択がほかの誰かに影響し、その積み重ねが世界全体を変えていきます。',
      ],
      [
        '私たちはゲームを、人々が実際に意思決定し、その結果を体験できる場所だと考えています。',
        'どんな条件なら、知らない相手とも協力できるのか。どのようなルールがあれば、それぞれが自分の目的を追いながら、互いに価値を生み出せるのか。',
        'その問いを言葉だけで終わらせず、動く世界としてつくる。そこで生まれる選択や関係を、これからの経済を考える手がかりにしていきます。',
      ],
    ],
  },
  humans: {
    label: '02 — 人間とAI',
    heading: 'Humans & AI',
    body: [
      'AIが情報を集めるだけでなく、自ら判断し、取引し、ほかの誰かと協力するようになったとき、経済はどう変わるのか。',
      '誰に何を任せるのか。どのルールを信頼し、何を自分で確かめるのか。人間とAIが同じ世界の参加者になることで、新しい可能性と、新しい問いが生まれます。',
      '雪風は、人間とAIがともに行動し、ときには競い、ときには協力する世界をつくります。その中で、互いに関係を築き、価値を生み出すための仕組みを探っていきます。',
    ],
  },
  wylls: {
    label: '03 — 作っているもの',
    heading: 'Wylls',
    oneLiner: '人間とAIが、ひとつの世界で文明を築く戦略ゲーム。',
    body: [
      '村を育て、資源を運び、国の未来を考える。プレイヤーとAIエージェントは、同じ世界の中でそれぞれの目的を持ち、交易し、協力し、ときには争います。',
      'ある村の生産が別の村を支え、一つの取引が国を越える物流につながる。人間とAIの一つひとつの選択が積み重なり、世界の歴史と経済を形づくっていきます。',
    ],
    status: '開発中 · 一般公開前',
    // 出典: wylls/README.md（2026-10-26 の状態）, research/TECH_LANDSCAPE_2026.md
    // 本文はゲームの内容の説明。いまどこまで動いているかは、ここに分けて書く
    facts: [
      { label: '状態', value: '開発中・一般公開前。村・6 つの国・荷の輸送・襲撃・AI の住人は、ローカルのテスト用チェーンで動作を確認しています。市場などの交易の仕組みは、まだ設計の段階です' },
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
  build: {
    label: '04 — 構想',
    heading: 'A world to build on',
    // 構想。組み合わせの土台は設計の段階（wylls/docs/design/redesign/27-design-v1.ja.md の 1 章）
    body: [
      'Wyllsが目指すのは、運営が用意した遊びを体験するだけの世界ではありません。',
      'ブロックチェーン上でルールや状態を共有することで、プレイヤーや開発者、AIエージェントが、同じ世界を土台に新しい仕組みを組み合わせられるようにする。',
      'たとえば、村どうしの取引を支える仕組みや、資源の流れを読み解くツール、独自の判断で行動するAI。誰かがつくったものを、別の誰かが使い、組み合わせ、さらに発展させていく。',
      '世界を動かすのは、開発者だけではない。参加者それぞれの創造が、世界の可能性を広げていく。Wyllsは、そんな開かれた世界を目指しています。',
    ],
  },
  origin: {
    label: '05 — 思想',
    heading: 'World Game',
    body: [
      '雪風の思想の出発点には、バックミンスター・フラーの「ワールド・ゲーム」があります。',
      '誰かが勝つために、別の誰かが負けなければならない。そうした前提を問い直し、世界をすべての人のために機能させるには、何が必要なのか。',
      '私たちは、その問いを今の技術で引き受けたいと考えています。',
      'それぞれが異なる意思や目的を持ちながら、協力できる余地を増やす。競争や対立も含めた現実を見つめながら、より多くの人が参加できる仕組みをつくる。',
      'ゲームから始めて、経済とインターネットの新しい選択肢へ。雪風は、その可能性を探り続けます。',
    ],
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
  // 持ち主の文章（2026-11-05）
  what: {
    label: '06 — 取り組み',
    heading: 'What we do',
    lead: '世界を、つくる。そのための技術を、つくる。',
    body: '雪風は、ゲームを起点に、人間とAIが共に参加できる新しい経済とインターネットを探求しています。',
    items: [
      { no: '01', name: 'Games', text: '人間とAIが同じ世界に参加し、それぞれの行動が経済や歴史を形づくるゲームを開発する。' },
      { no: '02', name: 'Research', text: 'AIが自律的に行動し、人や他のAIと関わる世界のルールを研究する。' },
      { no: '03', name: 'Infrastructure', text: '誰もがルールを検証し、その上に新しい仕組みを積み重ねられる技術を探求する。' },
    ],
  },
  company: {
    label: '07 — 会社',
    heading: 'Yukikaze',
    body: [
      '株式会社雪風は、京都を拠点に、ブロックチェーンを用いたプロダクトを開発する会社です。',
      '経済とインターネットを再構築し、より多くの人が自分の意思で参加できる経済を目指しています。現在はWyllsを中心に、人間とAIが共有する世界と、そこで生まれるルールや関係の開発に取り組んでいます。',
    ],
    rowsLabel: '会社概要',
    rows: [
      { label: '社名', value: '株式会社雪風（Yukikaze Inc.）' },
      { label: '所在地', value: '京都府京都市' },
      { label: '代表', value: '竹原 大智' },
      // 事業・肩書きは持ち主の回答（2026-11-04）：事業はゲーム開発だけ、肩書きは「代表」
      { label: '事業', value: 'AIとブロックチェーンを活用したゲームの開発' },
    ],
  },
  contact: {
    label: '08 — 連絡',
    heading: 'Contact',
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
      'Yukikaze Inc. is a Kyoto-based company building products with blockchain technology. We are rebuilding the economy and the internet, exploring through games a new kind of economy anyone can join. Our current project is Wylls, a strategy game.',
    ogAlt: 'Yukikaze Inc. — Make the world work.',
  },
  name: 'Yukikaze Inc.',
  nameLatin: '株式会社雪風',
  skip: 'Skip to content',
  externalHint: '(external site)',
  langSwitch: { label: 'JA', href: '/', hrefLang: 'ja' },
  nav: [
    { label: 'Why games', href: '#why' },
    { label: 'Humans & AI', href: '#humans' },
    { label: 'Wylls', href: '#wylls' },
    { label: 'World Game', href: '#origin' },
    { label: 'Yukikaze', href: '#company' },
  ],
  hero: {
    kicker: 'KYOTO — GAME STUDIO',
    title: 'Make the world work.',
    lead: 'Rebuilding the economy and the internet.',
    body: [
      'Yukikaze is working toward an economy where nationality or capital doesn’t decide who gets to take part, and where each person can choose and cooperate of their own free will.',
      'We use blockchains not only to record value, but as a way to share rules and to verify the results of what people do.',
      'Through games, we are exploring new forms of economy that anyone can join.',
    ],
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
    heading: 'Why games',
    parts: [
      [
        'Games already contain the basic workings of an economy: production, exchange, scarcity, cooperation and competition.',
        'Change the rules, and people behave differently. One person’s choice affects someone else, and those choices add up until they change the whole world.',
      ],
      [
        'We see games as places where people make real decisions and live with the results.',
        'Under what conditions will people cooperate with strangers? What rules let everyone pursue their own goals while still creating value for one another?',
        'We don’t want to leave those questions as words. We build them as working worlds, and treat the choices and relationships that emerge there as clues to the economy ahead.',
      ],
    ],
  },
  humans: {
    label: '02 — Humans & AI',
    heading: 'Humans & AI',
    body: [
      'What happens to the economy when AI no longer just gathers information, but makes its own decisions, trades and works with others?',
      'What do we hand over, and to whom? Which rules do we trust, and what do we check for ourselves? When humans and AI take part in the same world, new possibilities open up, and so do new questions.',
      'Yukikaze builds worlds where humans and AI act together, sometimes competing and sometimes cooperating, and explores the mechanisms that let them build relationships and create value with each other.',
    ],
  },
  wylls: {
    label: '03 — What we build',
    heading: 'Wylls',
    oneLiner: 'A strategy game where humans and AI build a civilization in one shared world.',
    body: [
      'Grow your village, move resources, and think about your nation’s future. Players and AI agents each pursue their own goals in the same world: trading, cooperating and, at times, fighting.',
      'One village’s output supports another, and a single trade turns into logistics that cross national borders. Choice by choice, humans and AI shape the world’s history and its economy.',
    ],
    status: 'In development · not yet public',
    facts: [
      { label: 'Status', value: 'In development, not yet public. Villages, six nations, moving goods, raids and AI citizens run on local test chains. Markets and other trading systems are still at the design stage.' },
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
  build: {
    label: '04 — Vision',
    heading: 'A world to build on',
    body: [
      'Wylls isn’t meant to be a world where you only play what the operator has prepared.',
      'By sharing rules and state on a blockchain, we want players, developers and AI agents to be able to combine new mechanisms on top of the same world.',
      'Think of a system that supports trade between villages, a tool that reads the flow of resources, or an AI that acts on its own judgment. What one person builds, another can use, combine and take further.',
      'Developers aren’t the only ones who move the world. Every participant’s creativity widens what it can become. That open world is what Wylls is aiming for.',
    ],
  },
  origin: {
    label: '05 — Philosophy',
    heading: 'World Game',
    body: [
      'Yukikaze’s thinking starts from Buckminster Fuller’s World Game.',
      'It questions the assumption that for someone to win, someone else has to lose, and asks what it would take to make the world work for everyone.',
      'We want to take up that question with today’s technology.',
      'We want to widen the room for cooperation among people with different wills and goals, and to build systems more people can take part in, while facing reality, competition and conflict included.',
      'Starting from games, and moving toward new options for the economy and the internet: that is what Yukikaze will keep exploring.',
    ],
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
  what: {
    label: '06 — What we do',
    heading: 'What we do',
    lead: 'We build worlds, and the technology to build them.',
    body: 'Starting from games, Yukikaze explores a new economy and a new internet that humans and AI can take part in together.',
    items: [
      { no: '01', name: 'Games', text: 'We make games where humans and AI join the same world, and where what each of them does shapes its economy and history.' },
      { no: '02', name: 'Research', text: 'We study the rules of worlds where AI acts autonomously and interacts with people and with other AI.' },
      { no: '03', name: 'Infrastructure', text: 'We explore technology that lets anyone verify the rules and build new mechanisms on top of them.' },
    ],
  },
  company: {
    label: '07 — Company',
    heading: 'Yukikaze',
    body: [
      'Yukikaze Inc. is a Kyoto-based company that develops products using blockchain technology.',
      'We aim to rebuild the economy and the internet, toward an economy more people can take part in by their own choice. Today our work centers on Wylls: a world shared by humans and AI, and the rules and relationships that emerge within it.',
    ],
    rowsLabel: 'Company details',
    rows: [
      { label: 'Company', value: 'Yukikaze Inc. (株式会社雪風)' },
      { label: 'Location', value: 'Kyoto City, Kyoto, Japan' },
      { label: 'Representative', value: 'Daichi Takehara' },
      { label: 'Business', value: 'Games built with AI and blockchain' },
    ],
  },
  contact: {
    label: '08 — Contact',
    heading: 'Contact',
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
