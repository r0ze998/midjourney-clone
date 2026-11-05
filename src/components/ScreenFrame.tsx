import type { ReactNode } from 'react';

export type Tag = { x: number; y: number; text: string; dir?: 'up' | 'down'; mobile?: boolean };

// 実際の画面や映像を、模型と同じ見た目の「窓」に収める。
// 細い枠・等幅の帯・四隅の角。縁は内側の影で暗い地に溶かす。札は模型のコールアウトと同じ形。
export default function ScreenFrame({
  title,
  meta,
  tags = [],
  accent = 'signal',
  children,
  className = '',
}: {
  title: string;
  meta?: string;
  tags?: Tag[];
  accent?: 'signal' | 'ai';
  children: ReactNode;
  className?: string;
}) {
  const corner = accent === 'ai' ? 'border-ai' : 'border-signal';
  return (
    <div className={`relative border border-rule bg-paper ${className}`}>
      <div className="flex items-center justify-between gap-4 border-b border-rule px-3 py-2 font-mono text-[0.625rem] uppercase tracking-[0.14em] text-ink-3">
        <span className="flex items-center gap-2">
          <span aria-hidden="true" className={`inline-block h-1.5 w-1.5 rounded-full ${accent === 'ai' ? 'bg-ai' : 'bg-signal'}`} />
          {title}
        </span>
        {meta && <span className="hidden sm:inline">{meta}</span>}
      </div>
      <div className="relative overflow-hidden">
        {children}
        {/* 縁を暗い地に溶かす */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 shadow-[inset_0_0_70px_18px_rgba(5,7,6,0.78)]" />
        {tags.map((t) => (
          <span
            key={t.text}
            aria-hidden="true"
            className={`pointer-events-none absolute ${t.mobile ? 'block' : 'hidden md:block'}`}
            style={{ left: `${t.x}%`, top: `${t.y}%` }}
          >
            <span className="absolute -left-[3px] -top-[3px] block h-[6px] w-[6px] rounded-full bg-signal shadow-[0_0_0_3px_rgba(62,240,140,0.18)]" />
            <span className={`absolute left-0 block w-px bg-signal/70 ${t.dir === 'down' ? 'top-0 h-7' : 'bottom-0 h-7'}`} />
            <span
              className={`absolute left-0 block -translate-x-1/2 whitespace-nowrap border border-signal/70 bg-card/90 px-2 py-1 font-mono text-[0.625rem] tracking-[0.06em] text-ink ${t.dir === 'down' ? 'top-7' : 'bottom-7'}`}
            >
              {t.text}
            </span>
          </span>
        ))}
      </div>
      {/* 四隅の角 */}
      {['-left-px -top-px border-l border-t', '-right-px -top-px border-r border-t', '-bottom-px -left-px border-b border-l', '-bottom-px -right-px border-b border-r'].map((p) => (
        <span key={p} aria-hidden="true" className={`pointer-events-none absolute h-3 w-3 ${corner} ${p}`} />
      ))}
    </div>
  );
}
