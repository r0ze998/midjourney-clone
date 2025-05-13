'use client';
import { FC } from 'react';

const blocks = [
  {
    title: 'About Yukikaze',
    body: `妖精を見るには妖精の目がいる。

第二次世界大戦時に建造された14隻の駆逐艦の中で唯一生還した奇跡の船「雪風」から命名。
世界大戦を模した「ワールド・ウォー・ゲーム」へのアンチテーゼとして、ブロックチェーン上で全人類が参加できる「ワールド・ゲーム」を創り出すことで経済の選択肢を広げ、誰もが公平に参加できる新しい経済システムを目指します。`,
  },
];

const About: FC = () => (
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

export default About;
