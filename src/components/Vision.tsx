import Reveal from './Reveal';
import SectionHeading from './SectionHeading';
import { vision } from '../content/site';

// body内のhighlights語句をアクセント色で強調する
function Highlighted({
  text,
  highlights,
}: {
  text: string;
  highlights: readonly string[];
}) {
  if (!highlights.length) return <>{text}</>;
  const pattern = new RegExp(
    `(${highlights.map((h) => h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`,
    'g'
  );
  return (
    <>
      {text.split(pattern).map((part, i) =>
        highlights.includes(part) ? (
          <span key={i} className="text-accent">
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

export default function Vision() {
  return (
    <section
      id="vision"
      className="relative py-32 scroll-mt-16 border-y border-white/5 overflow-hidden"
    >
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(62,240,140,0.04),transparent_50%)]" />
      <div className="relative container mx-auto px-6 max-w-6xl">
        <SectionHeading index="02" title="Vision" subtitle="ビジョン" />

        <div className="space-y-24">
          {vision.map(({ title, body, highlights }) => (
            <Reveal key={title}>
              <p className="font-mono text-sm tracking-[0.35em] text-white/40 mb-6">
                {title.toUpperCase()}
              </p>
              <p className="text-2xl md:text-4xl font-bold leading-snug md:leading-snug max-w-5xl">
                <Highlighted text={body} highlights={highlights} />
              </p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
