import Reveal from './Reveal';
import SectionHeading from './SectionHeading';
import { vision } from '../content/site';

export default function Vision() {
  return (
    <section
      id="vision"
      className="py-28 scroll-mt-16 border-y border-white/5 bg-[linear-gradient(180deg,rgba(62,240,140,0.03),transparent_40%)]"
    >
      <div className="container mx-auto px-6 max-w-6xl">
        <SectionHeading index="02" title="Vision" subtitle="ビジョン" />
        <div className="grid gap-12 md:grid-cols-2">
          {vision.map(({ title, body }, i) => (
            <Reveal key={title} delay={i * 120}>
              <h3 className="font-mono text-2xl font-bold text-accent mb-5">
                {title}
              </h3>
              <p className="leading-loose text-white/80">{body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
