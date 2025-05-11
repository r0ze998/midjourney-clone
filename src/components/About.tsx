'use client';
import { FC } from 'react';

const blocks = [
  {
    title: 'About',
    body: `ここにAboutの内容を記入してください。`,
  },
  {
    title: 'Contact',
    body: `ここにContactの内容を記入してください。`,
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
