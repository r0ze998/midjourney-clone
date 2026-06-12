import Reveal from './Reveal';

export default function SectionHeading({
  index,
  title,
  subtitle,
}: {
  index: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="relative mb-20">
      {/* 巨大なゴースト番号 */}
      <span
        aria-hidden="true"
        className="absolute -top-16 -left-4 font-mono text-[10rem] md:text-[14rem] leading-none font-bold text-white/[0.04] select-none pointer-events-none"
      >
        {index}
      </span>
      <Reveal className="relative">
        <p className="flex items-center gap-4 font-mono text-sm tracking-[0.35em] text-accent mb-4">
          <span className="inline-block w-10 h-px bg-accent" />
          {title.toUpperCase()}
        </p>
        <h2 className="text-4xl md:text-6xl font-bold tracking-tight">
          {subtitle ?? title}
        </h2>
      </Reveal>
    </div>
  );
}
