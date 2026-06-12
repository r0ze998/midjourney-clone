// サイト全体のコピー・データを一元管理する。文言の修正はこのファイルだけで完結する。

export const site = {
  name: '株式会社雪風',
  nameEn: 'Yukikaze Inc.',
  tagline:
    '生態系を破壊することなく、また誰の不利益も被ることなく、自発的な協力によって、可能な限り最短の時間で、100%世界をうまく利用できるようにする。',
  description:
    '株式会社雪風は、ブロックチェーン技術を軸に、誰もが公平に参加できる新しい経済システムの構築を目指す京都のテクノロジーカンパニーです。',
  url: 'https://www.yukikaze.games',
} as const;

export const nav = [
  { label: 'Services', href: '#services' },
  { label: 'Vision', href: '#vision' },
  { label: 'About', href: '#about' },
  { label: 'Contact', href: '#contact' },
] as const;

// Heroの背景に流れるテキスト
export const matrixTexts = [
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

export const services = [
  {
    title: 'ZeroGarden',
    label: 'Product',
    desc: 'zkTLS を用いた API レスな Web アプリケーションの構築。既存の Web とブロックチェーンを信頼最小化された形で接続します。',
  },
  {
    title: 'parameter protocol',
    label: 'Product',
    desc: 'Autonomous Worlds の構築を目的とした、コンポーザビリティを提供する Full On-chain Game の開発。',
  },
  {
    title: '新規事業開発コンサルティング',
    label: 'Consulting',
    desc: 'トークンや NFT を活用した新規事業の立ち上げを、設計から実装まで一気通貫で支援します。',
  },
  {
    title: 'Research',
    label: 'Research',
    desc: '企業向けに、ブロックチェーン事業導入のためのリサーチ・技術検証を提供します。',
  },
] as const;

export const vision = [
  {
    title: 'Vision',
    body: '現実的な経済の計算システムを構築し、国籍や資本に縛られず、誰もがリアルタイムに参加できる自律分散デジタル経済圏を実現する。',
  },
  {
    title: 'Mission',
    body: '経済とインターネットを再構築する。“経済の計算システム”と“オープンインターネット”を再構築し、選択肢のない経済をアップグレードする。',
  },
] as const;

export const about = {
  heading: 'About Yukikaze',
  lead: '妖精を見るには妖精の目がいる。',
  body: '第二次世界大戦時に建造された駆逐艦の中で唯一生還した奇跡の船「雪風」から命名。世界大戦を模した「ワールド・ウォー・ゲーム」へのアンチテーゼとして、ブロックチェーン上で全人類が参加できる「ワールド・ゲーム」を創り出すことで経済の選択肢を広げ、誰もが公平に参加できる新しい経済システムを目指します。',
  overview: [
    { label: '社名', value: '株式会社雪風 / Yukikaze Inc.' },
    { label: '所在地', value: '京都府京都市' },
    { label: '代表', value: 'Daichi Takehara' },
    {
      label: '事業内容',
      value:
        'ブロックチェーンプロダクトの開発、新規事業開発コンサルティング、リサーチ',
    },
  ],
} as const;

export const contact = {
  name: 'r0ze / Daichi Takehara',
  email: 'takehara998@gmail.com',
  location: 'Kyoto, Japan',
  socials: [
    { label: 'X (Twitter)', href: 'https://twitter.com/r0ze_____' },
    { label: 'Blog', href: 'https://x.com/r0ze_____/articles' },
  ],
} as const;
