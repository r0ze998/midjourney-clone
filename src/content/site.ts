// サイト全体の掲載情報を一元管理する。文言・リンク・状態の更新はこのファイルだけで完結する。
//
// 掲載ルール
// - 根拠を確認できた事実だけを書く。根拠はコメントで残す（主に各リポジトリの README / docs）。
// - 構想・長期ビジョンは「目指していること」として書き、実現済みのように書かない。
// - 受賞・調達・ユーザー数・提携・公開日は、根拠がない限り載せない。
// - ja と en は同じ構成・同じ情報量に保つ。片方だけ更新しない。

export type Lang = 'ja' | 'en';

export const site = {
  url: 'https://www.yukikaze.games',
  email: 'takehara998@gmail.com',
  social: {
    x: 'https://x.com/r0ze_____',
    articles: 'https://x.com/r0ze_____/articles',
    github: 'https://github.com/r0ze998',
  },
} as const;

// 外部リンク。いずれも 2026-10-17 に公開・到達を確認済み。
export const links = {
  wyllsSite: 'https://wylls-site.vercel.app/',
  wyllsRepo: 'https://github.com/r0ze998/wylls',
  // YouTube @r0ze213。デモ映像の構成は wylls/docs/pitch/DEMO_SCRIPT.md を参照。
  wyllsDemoId: 'M3KXncQcIJg',
  wyllsPitch: 'https://youtu.be/WMAESO0xbek',
  oxarkPlay: 'https://r0ze998.github.io/0xark/',
  oxarkRepo: 'https://github.com/r0ze998/0xark',
  oxcivPlay: 'https://r0ze998.github.io/0xciv/',
  oxcivRepo: 'https://github.com/r0ze998/0xciv',
} as const;

type Link = { label: string; href: string; note?: string };
type Row = { label: string; value: string };

export type Content = {
  meta: { title: string; description: string; ogAlt: string };
  skip: string;
  nav: { label: string; href: string }[];
  langSwitch: { label: string; href: string; hrefLang: Lang };
  menu: { open: string; close: string };
  intro: {
    kicker: string;
    title: string;
    lead: string;
    current: { label: string; text: string; href: string };
  };
  works: {
    label: string;
    heading: string;
    wylls: {
      name: string;
      status: string;
      oneLiner: string;
      body: string;
      imageAlt: string;
      imageCaption: string;
      video: {
        play: string;
        duration: string;
        caption: string;
        external: string;
        iframeTitle: string;
      };
      mechanicsLabel: string;
      mechanics: { title: string; body: string }[];
      facts: Row[];
      notYet: { label: string; items: string[] };
      links: Link[];
    };
    others: {
      label: string;
      items: {
        name: string;
        year: string;
        platform: string;
        status: string;
        body: string;
        links: Link[];
      }[];
    };
  };
  approach: {
    label: string;
    heading: string;
    body: string[];
    principlesLabel: string;
    principles: { title: string; body: string; inWylls: string }[];
    inWyllsLabel: string;
    quote: { text: string; source: string };
    name: { title: string; body: string };
  };
  company: {
    label: string;
    heading: string;
    rows: Row[];
  };
  contact: {
    label: string;
    heading: string;
    body: string;
    note: string;
    person: { name: string; role: string };
    links: Link[];
  };
  footer: { rights: string; top: string };
  externalHint: string;
};

const ja: Content = {
  meta: {
    title: '株式会社雪風 | Yukikaze Inc.',
    description:
      '株式会社雪風は、AIとブロックチェーンを使ってゲームを開発する京都の会社です。現在は、人間とAIが同じ世界で文明を形づくる戦略ゲーム「Wylls」をSolanaで開発しています。',
    ogAlt: '株式会社雪風 — ゲームで、新しいルールを試す。',
  },
  skip: '本文へ移動',
  nav: [
    { label: '作品', href: '#works' },
    { label: '考え方', href: '#approach' },
    { label: '会社概要', href: '#company' },
    { label: '連絡先', href: '#contact' },
  ],
  langSwitch: { label: 'English', href: '/en', hrefLang: 'en' },
  menu: { open: 'メニューを開く', close: 'メニューを閉じる' },
  intro: {
    kicker: '京都のゲーム開発会社',
    title: 'ゲームで、\n新しいルールを試す。',
    lead: '株式会社雪風は、AIとブロックチェーンを使ってゲームを開発する京都の会社です。経済とインターネットのしくみを作り直すことを長い目標に置き、そのための新しいルールを、人とAIが実際に遊べるゲームとして形にしています。',
    current: {
      label: '開発中',
      text: 'Wylls — 人間とAIが同じ世界で文明を形づくる戦略ゲーム',
      href: '#wylls',
    },
  },
  works: {
    label: '作品',
    heading: '作っているもの',
    wylls: {
      name: 'Wylls',
      status: '開発中・一般公開前',
      oneLiner: '人間とAIが、同じ世界で文明を形づくる戦略ゲーム。',
      // 出典: wylls/README.md, PITCH.md
      body: '6つの国がひとつのヘックス地図を分け合います。プレイヤーは国を選び、村を育て、兵を鍛え、行き先を伏せた軍を送ります。AIの「市民」も同じ世界に、人と同じルールで参加します。Solana上で開発しています。',
      imageAlt:
        'Wyllsの観戦画面。6つの国の領土が色分けされたヘックス地図、左に国別の順位、右に直近の出来事の一覧。',
      // 出典: wylls/README.md のキャプション（2026-10-09 撮影のテストデータ）
      imageCaption:
        '開発中のクライアントの観戦画面。テストデータで表示したもので、実際のシーズンではありません（2026年10月9日撮影）。',
      video: {
        play: 'デモ映像を再生',
        duration: '2:48',
        // 出典: wylls/docs/pitch/DEMO_SCRIPT.md
        caption:
          'デモ映像はローカルのテスト環境で録画しました。大部分は人が操作したシーズン（own1・season 100）で、この回にAIは参加していません。AI市民の場面（1:05〜1:53）は、別に記録した実行です。資金はすべてテスト用のUSDCです。',
        external: '再生するとYouTube（外部サイト）から映像を読み込みます。',
        iframeTitle: 'Wylls デモ映像（YouTube）',
      },
      mechanicsLabel: 'しくみ',
      // 出典: wylls/README.md 13-37行
      mechanics: [
        {
          title: '伏せた進軍',
          body: '軍の行き先は時間で解ける封印（drand）で隠され、戦いは10分ごとのターンでまとめて決着します。',
        },
        {
          title: '同じ条件のAI',
          body: 'AI市民は人と同じ鍵、同じ回数制限、同じ視界で動きます。コードが示した選択肢から手を選び、その手もコードが検証します。',
        },
        {
          title: '確かめられる結果',
          body: '戦闘の結果はオンチェーンのプログラムが決め、その計算はブラウザで再現して確かめられます。',
        },
      ],
      facts: [
        { label: '状態', value: '開発中。ローカルのテスト用チェーンで動作確認をしています。' },
        { label: '遊べる場所', value: 'まだ一般公開していません。' },
        { label: '基盤', value: 'Solana' },
        { label: 'トークン', value: '独自トークンの発行を前提にしていません。' },
        {
          // 出典: wylls/SUBMISSION.md（提出のみ。結果は未発表・受賞の記載なし）
          label: '記録',
          value: '2026年10月、Colosseum Crypto World’s Fair（Gaming部門）に応募。',
        },
      ],
      // 出典: wylls/README.md 51-52, 90行 / docs/GAME-DESIGN.ja.md
      notYet: {
        label: 'まだ設計・検証の段階にあるもの',
        items: [
          '本番環境での公開と、実際の資金を使うシーズン',
          'エージェントへの予算や行動範囲の委任',
          '外部のAIエージェントが接続するためのしくみ（MCP対応など）',
          '外交・市場・技術の発展など、文明全体に関わるルール',
        ],
      },
      links: [
        { label: '紹介サイト', href: links.wyllsSite, note: 'wylls-site.vercel.app' },
        { label: 'ピッチ映像', href: links.wyllsPitch, note: 'YouTube' },
        { label: 'ソースコード', href: links.wyllsRepo, note: 'GitHub' },
      ],
    },
    others: {
      label: 'そのほかのプロジェクト',
      items: [
        {
          name: '0xARK',
          year: '2026',
          platform: 'Solana devnet',
          status: '試験版',
          // 出典: 0xark/README.md, docs/RELEASE_READINESS.md
          body: '1対1のカード対戦ゲーム。手札は先に暗号学的に封をしてから公開し、カードごとの戦績がチェーン上に残ります。テスト用ネットワーク（devnet）で動く試験版で、正式リリースはしていません。',
          links: [
            { label: '試験版', href: links.oxarkPlay, note: 'devnet' },
            { label: 'ソースコード', href: links.oxarkRepo, note: 'GitHub' },
          ],
        },
        {
          name: '0xCIV',
          year: '2026',
          platform: 'Starknet / Dojo',
          status: 'ゲームジャム作品',
          // 出典: 0xciv/README.md、dojoengine/game-jams PR #270
          body: 'AIエージェントが文明を率いる小さな戦略ゲーム。プレイヤーは自然言語で方針を書き、その方針で文明が動きます。Dojo Game Jam VIII（2026年3月）への参加作品で、Wyllsにつながる初期の試作です。',
          links: [
            { label: '公開ページ', href: links.oxcivPlay, note: 'GitHub Pages' },
            { label: 'ソースコード', href: links.oxcivRepo, note: 'GitHub' },
          ],
        },
      ],
    },
  },
  approach: {
    label: '考え方',
    heading: 'なぜ、ゲームなのか。',
    body: [
      '雪風が長く関心を持っているのは、経済とインターネットのしくみを作り直すことです。ただ、新しい経済のルールは、構想を語るだけでは確かめられません。',
      'ゲームなら、ルールを決めて公開し、人とAIを同じ条件で参加させ、何が起きたかを記録して、誰でもあとから検証できます。雪風にとってゲームは、新しいルールを小さく、実際に試せる場所です。',
    ],
    principlesLabel: '大切にしていること',
    inWyllsLabel: 'Wyllsでは',
    principles: [
      {
        title: 'ルールと結果を、確かめられるようにする',
        body: '勝ち負けを運営の発表に頼らず、誰でも同じ計算をやり直せる形にします。',
        inWylls: '戦闘結果をブラウザで再計算して、チェーン上の記録と照合できます。',
      },
      {
        title: '人とAIを、同じ条件に置く',
        body: 'AIを特別扱いも、隠すこともせず、同じルールの参加者として扱います。',
        inWylls: 'AI市民は人と同じ鍵・制限・視界で動き、AIの手はすべて記録されます。',
      },
      {
        title: 'お金の設計は、慎重に',
        body: '遊びの面白さより先に、お金のしくみを広げることはしません。',
        inWylls: '独自トークンを前提にせず、現在の検証はテスト用の資金だけで行っています。',
      },
    ],
    quote: {
      text: '生態系を破壊することなく、また誰の不利益も被ることなく、自発的な協力によって、可能な限り最短の時間で、100%世界をうまく利用できるようにする。',
      source: 'R・バックミンスター・フラーが構想した「ワールド・ゲーム」の目的（雪風訳）',
    },
    name: {
      title: '社名について',
      body: '社名は、陽炎型駆逐艦のなかで唯一終戦まで残った「雪風」に由来します。戦争を模したゲームではなく、全員が参加し、誰も損をしない道を探るゲームを。フラーが「ワールド・ゲーム」と呼んだこの考え方を、今の技術で試すことが雪風の出発点です。',
    },
  },
  company: {
    label: '会社概要',
    heading: '会社概要',
    rows: [
      { label: '社名', value: '株式会社雪風（Yukikaze Inc.）' },
      { label: '所在地', value: '京都府京都市' },
      { label: '代表', value: '竹原 大智（Daichi Takehara）' },
      { label: '事業内容', value: 'AIとブロックチェーンを活用したゲームの企画・開発' },
      { label: '主な作品', value: 'Wylls（開発中）' },
    ],
  },
  contact: {
    label: '連絡先',
    heading: 'ご連絡',
    body: '協業、取材、投資、開発についてのご相談は、メールでお送りください。',
    note: 'お問い合わせフォームはありません。メールに直接お送りください。',
    person: { name: '竹原 大智 / r0ze', role: '創業者・開発者' },
    links: [
      { label: 'X', href: site.social.x, note: '@r0ze_____' },
      { label: '記事', href: site.social.articles, note: 'X Articles' },
      { label: 'GitHub', href: site.social.github, note: 'r0ze998' },
    ],
  },
  footer: { rights: '株式会社雪風', top: 'ページの先頭へ' },
  externalHint: '（外部サイト）',
};

const en: Content = {
  meta: {
    title: 'Yukikaze Inc. | 株式会社雪風',
    description:
      'Yukikaze Inc. is a Kyoto-based studio that builds games with AI and blockchain. We are currently developing Wylls, a strategy game on Solana where humans and AI shape a civilization in the same world.',
    ogAlt: 'Yukikaze Inc. — Testing new rules through games.',
  },
  skip: 'Skip to content',
  nav: [
    { label: 'Work', href: '#works' },
    { label: 'Approach', href: '#approach' },
    { label: 'Company', href: '#company' },
    { label: 'Contact', href: '#contact' },
  ],
  langSwitch: { label: '日本語', href: '/', hrefLang: 'ja' },
  menu: { open: 'Open menu', close: 'Close menu' },
  intro: {
    kicker: 'A game studio in Kyoto',
    title: 'Testing new rules\nthrough games.',
    lead: 'Yukikaze Inc. is a Kyoto-based company that builds games with AI and blockchain. Our long-term interest is rebuilding how the economy and the internet work. We give the new rules that this requires a concrete form: games that people and AI can actually play.',
    current: {
      label: 'In development',
      text: 'Wylls — a strategy game where humans and AI shape a civilization in the same world',
      href: '#wylls',
    },
  },
  works: {
    label: 'Work',
    heading: 'What we are building',
    wylls: {
      name: 'Wylls',
      status: 'In development · not yet public',
      oneLiner: 'A strategy game where humans and AI shape a civilization in the same world.',
      body: 'Six nations share one hex map. Players pick a nation, grow villages, train troops and send armies whose destinations stay hidden. AI “citizens” take part in the same world, under the same rules as people. Built on Solana.',
      imageAlt:
        'The Wylls spectator view: a hex map with the territory of six nations in different colours, nation standings on the left and recent events on the right.',
      imageCaption:
        'Spectator view of the client in development, shown with test data. Not a live season. Captured 9 October 2026.',
      video: {
        play: 'Play the demo',
        duration: '2:48',
        caption:
          'The demo was recorded on a local test chain. Most of it is a human-operated season (own1, season 100) in which no AI took part. The AI-citizen scene (1:05–1:53) is a separate recorded run. All money shown is test USDC.',
        external: 'Playing loads the video from YouTube (external site).',
        iframeTitle: 'Wylls demo video (YouTube)',
      },
      mechanicsLabel: 'How it works',
      mechanics: [
        {
          title: 'Sealed marches',
          body: 'An army’s destination is hidden behind a time-lock (drand). Battles resolve together in 10-minute turns.',
        },
        {
          title: 'AI on equal terms',
          body: 'AI citizens act with the same keys, rate limits and field of view as people. They choose from options the code offers, and the code checks every choice.',
        },
        {
          title: 'Results you can check',
          body: 'An on-chain program decides each battle, and the browser can recompute the result to confirm it.',
        },
      ],
      facts: [
        { label: 'Status', value: 'In development, running on local test chains.' },
        { label: 'Where to play', value: 'Not yet open to the public.' },
        { label: 'Chain', value: 'Solana' },
        { label: 'Token', value: 'Not designed around a token of its own.' },
        {
          label: 'Record',
          value: 'Submitted to Colosseum Crypto World’s Fair (Gaming), October 2026.',
        },
      ],
      notYet: {
        label: 'Still in design or testing',
        items: [
          'A public release and seasons played with real money',
          'Delegating budgets and permissions to agents',
          'A way for outside AI agents to connect (such as MCP support)',
          'Civilization-wide rules: diplomacy, markets and technology',
        ],
      },
      links: [
        { label: 'Project site', href: links.wyllsSite, note: 'wylls-site.vercel.app' },
        { label: 'Pitch video', href: links.wyllsPitch, note: 'YouTube' },
        { label: 'Source code', href: links.wyllsRepo, note: 'GitHub' },
      ],
    },
    others: {
      label: 'Other projects',
      items: [
        {
          name: '0xARK',
          year: '2026',
          platform: 'Solana devnet',
          status: 'Test version',
          body: 'A one-on-one card battle game. Hands are sealed cryptographically before they are revealed, and each card keeps its battle record on-chain. It runs as a test version on devnet and has not been formally released.',
          links: [
            { label: 'Test version', href: links.oxarkPlay, note: 'devnet' },
            { label: 'Source code', href: links.oxarkRepo, note: 'GitHub' },
          ],
        },
        {
          name: '0xCIV',
          year: '2026',
          platform: 'Starknet / Dojo',
          status: 'Game jam entry',
          body: 'A small strategy game in which AI agents lead civilizations. Players write a strategy in plain language and their civilization follows it. Entered in Dojo Game Jam VIII (March 2026), it is an early prototype on the road to Wylls.',
          links: [
            { label: 'Public page', href: links.oxcivPlay, note: 'GitHub Pages' },
            { label: 'Source code', href: links.oxcivRepo, note: 'GitHub' },
          ],
        },
      ],
    },
  },
  approach: {
    label: 'Approach',
    heading: 'Why games?',
    body: [
      'What Yukikaze has long cared about is rebuilding how the economy and the internet work. But new economic rules cannot be proven by describing them.',
      'In a game, you can set the rules and publish them, let people and AI take part on the same terms, record what happens, and let anyone check it afterwards. For us, a game is a place to try new rules at a small scale, for real.',
    ],
    principlesLabel: 'What we hold to',
    inWyllsLabel: 'In Wylls',
    principles: [
      {
        title: 'Make rules and results checkable',
        body: 'Outcomes should not depend on an operator’s word. Anyone should be able to redo the same calculation.',
        inWylls: 'The browser can recompute a battle and compare it with the on-chain record.',
      },
      {
        title: 'Put people and AI on the same terms',
        body: 'AI is neither given special treatment nor hidden. It is a participant under the same rules.',
        inWylls: 'AI citizens act with the same keys, limits and view as people, and every AI move is recorded.',
      },
      {
        title: 'Be careful with money',
        body: 'We do not grow the money side of a game ahead of what makes it worth playing.',
        inWylls: 'No token of its own is assumed, and testing so far uses test funds only.',
      },
    ],
    quote: {
      text: 'Make the world work, for 100% of humanity, in the shortest possible time, through spontaneous cooperation, without ecological offense or the disadvantage of anyone.',
      source: 'R. Buckminster Fuller, on the aim of the World Game',
    },
    name: {
      title: 'About our name',
      body: 'Yukikaze is named after the destroyer Yukikaze, the only ship of the Kagerō class to survive to the end of the Second World War. Not a game that imitates war, but one that looks for a way in which everyone takes part and no one loses out: trying out what Fuller called the World Game, with today’s technology, is where Yukikaze starts.',
    },
  },
  company: {
    label: 'Company',
    heading: 'Company',
    rows: [
      { label: 'Name', value: 'Yukikaze Inc. (株式会社雪風)' },
      { label: 'Location', value: 'Kyoto, Japan' },
      { label: 'Representative', value: 'Daichi Takehara' },
      { label: 'Business', value: 'Planning and development of games using AI and blockchain' },
      { label: 'Main work', value: 'Wylls (in development)' },
    ],
  },
  contact: {
    label: 'Contact',
    heading: 'Get in touch',
    body: 'For partnerships, press, investment or development, please write to us by email.',
    note: 'There is no contact form. Please email us directly.',
    person: { name: 'Daichi Takehara / r0ze', role: 'Founder and developer' },
    links: [
      { label: 'X', href: site.social.x, note: '@r0ze_____' },
      { label: 'Articles', href: site.social.articles, note: 'X Articles' },
      { label: 'GitHub', href: site.social.github, note: 'r0ze998' },
    ],
  },
  footer: { rights: 'Yukikaze Inc.', top: 'Back to top' },
  externalHint: '(external site)',
};

export const content: Record<Lang, Content> = { ja, en };
