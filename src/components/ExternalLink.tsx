import type { ReactNode } from 'react';

// 外部サイトへのリンク。新しいタブで開くことを読み上げでも伝える。
export default function ExternalLink({
  href,
  hint,
  className = '',
  arrow = true,
  children,
}: {
  href: string;
  hint: string;
  className?: string;
  arrow?: boolean;
  children: ReactNode;
}) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
      <span className="sr-only">{hint}</span>
      {arrow && (
        <span aria-hidden="true" className="row-link-arrow ml-auto font-mono text-sm text-bone-3">
          ↗
        </span>
      )}
    </a>
  );
}
