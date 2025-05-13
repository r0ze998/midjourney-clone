'use client';
import { FC } from 'react';

const blocks = [
  {
    title: 'Vision',
    body: `現実的な経済の計算システムを構築し、
国籍や資本に縛られず、誰もがリアルタイムに参加できる自律分散デジタル経済圏を実現する。`,
  },
  {
    title: 'Mission',
    body: `経済とインターネットを再構築する。
“経済の計算システム”と“オープンインターネット”を再構築し、選択肢のない経済をアップグレードする。`,
  },
];

const Vision: FC = () => (
  <section className="py-24 bg-black text-white">
    <div className="container mx-auto px-6 max-w-3xl">
      {blocks.map(({ title, body }) => (
        <div key={title} className="mb-12">
          <h2 className="text-3xl font-bold mb-4">{title}</h2>
          <p className="prose leading-relaxed whitespace-pre-wrap text-white">
            {body}
          </p>
        </div>
      ))}
    </div>
  </section>
);

export default Vision;
