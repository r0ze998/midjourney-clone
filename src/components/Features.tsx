'use client';
import { FC } from 'react';

const features = [
  {
    title: 'zkTLS Security',
    desc: 'Zero-knowledge TLS keeps your on-chain data verifiable while preserving privacy.',
  },
  {
    title: 'Seamless Wallet UX',
    desc: 'One-click social login and gas-abstracted transactions remove friction for gamers.',
  },
  {
    title: 'Asset Economy',
    desc: 'Native NFT marketplace & royalty engine enable true ownership and sustainable revenue.',
  },
  {
    title: 'Scalable L2 Infrastructure',
    desc: 'Optimistic rollup backend processes thousands of TPS with sub-cent fees.',
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
