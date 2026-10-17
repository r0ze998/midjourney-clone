import type { ReactNode } from 'react';

// 全セクション共通の枠。左の余白列（12列中3列）に番号とラベル、右の9列に見出しを置く「記録帳」の構成。
// 本文は children 側で同じ12列グリッドを使い、通常は Body で右の9列に揃える。
export default function Section({
  id,
  index,
  label,
  heading,
  aliases = [],
  children,
}: {
  id: string;
  index: string;
  label: string;
  heading: string;
  aliases?: string[];
  children: ReactNode;
}) {
  const headingId = `${id}-heading`;
  return (
    <section id={id} aria-labelledby={headingId} className="border-t border-rule">
      {/* 旧サイトのアンカー（#services など）からのリンクを壊さないための別名 */}
      {aliases.map((alias) => (
        <span key={alias} id={alias} aria-hidden="true" />
      ))}
      <div className="container-site py-16 md:py-24">
        <div className="lg:grid lg:grid-cols-12 lg:gap-x-10">
          <p className="label mb-5 lg:col-span-3 lg:mb-0 lg:pt-4">
            <span className="text-ink">{index}</span>
            <span aria-hidden="true" className="mx-2">
              —
            </span>
            {label}
          </p>
          <h2
            id={headingId}
            className="display lg:col-span-9 text-[clamp(1.75rem,4.2vw,3rem)] leading-[1.3]"
          >
            {heading}
          </h2>
        </div>
        <div className="mt-10 md:mt-14">{children}</div>
      </div>
    </section>
  );
}

export function Body({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`lg:grid lg:grid-cols-12 lg:gap-x-10 ${className}`}>
      <div className="lg:col-start-4 lg:col-span-9">{children}</div>
    </div>
  );
}
