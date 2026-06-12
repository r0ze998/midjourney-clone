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
    <Reveal className="mb-14">
      <p className="font-mono text-sm tracking-[0.3em] text-accent mb-3">
        {index} / {title.toUpperCase()}
      </p>
      <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
        {subtitle ?? title}
      </h2>
    </Reveal>
  );
}
