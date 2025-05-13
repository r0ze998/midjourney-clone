'use client';
import { FC } from 'react';

const features = [
  {
    title: 'ZeroGarden',
    desc: 'zkTLS を用いたAPIレスなwebアプリケーションの構築',
  },
  {
    title: 'parameter protocol',
    desc: 'Autonomous Worldsの構築を目的としたコンポーザビリティを提供するFull On-chain gameの開発',
  },
  {
    title: '新規事業開発コンサルティング',
    desc: 'トークンやNFTを活用した新規事業開発を支援',
  },
  {
    title: 'Research',
    desc: '企業向けにブロックチェーン事業の導入のためのリサーチを提供',
  },
];

const Features: FC = () => (
  <section className="py-24 container mx-auto px-6">
    <h2 className="text-3xl font-bold text-center mb-12">Features</h2>
    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
      {features.map(({ title, desc }) => (
        <div
          key={title}
          className="rounded-xl border border-white/10 bg-white/5 p-6 hover:border-brand transition-colors"
        >
          <h3 className="text-xl font-semibold mb-2">{title}</h3>
          <p className="text-sm leading-relaxed text-white/80">{desc}</p>
        </div>
      ))}
    </div>
  </section>
);

export default Features;
