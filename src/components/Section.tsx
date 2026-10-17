import type { ReactNode } from 'react';

// スクロール先の各セクション。左の列に番号つきラベル、右に見出しと本文。
export default function Section({
  id,
  label,
  heading,
  children,
}: {
  id: string;
  label: string;
  heading: string;
  children: ReactNode;
}) {
  const headingId = `${id}-heading`;
  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className="scroll-mt-20 border-t border-rule py-16 md:py-24 lg:grid lg:grid-cols-12 lg:gap-x-8"
    >
      <p className="label mb-6 lg:col-span-3 lg:mb-0 lg:pt-3">{label}</p>
      <div className="lg:col-span-8 lg:col-start-4 xl:col-span-7">
        <h2 id={headingId} className="serif text-[1.75rem] leading-[1.35] text-bone md:text-[2.25rem]">
          {heading}
        </h2>
        <div className="mt-8 md:mt-10">{children}</div>
      </div>
    </section>
  );
}
