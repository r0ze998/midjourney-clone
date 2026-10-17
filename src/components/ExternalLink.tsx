import type { ReactNode } from 'react';

// 外部サイトへのリンク。新しいタブで開くことを読み上げでも伝える。
export default function ExternalLink({
  href,
  hint,
  className = '',
  children,
}: {
  href: string;
  hint: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
      <span className="sr-only">{hint}</span>
      <span aria-hidden="true" className="ml-1 inline-block text-[0.8em] translate-y-[-0.05em]">
        ↗
      </span>
    </a>
  );
}
