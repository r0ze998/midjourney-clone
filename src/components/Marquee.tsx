import { matrixTexts } from '../content/site';

// 社訓テキストが横に流れ続けるマーキー。内容を2回並べて translateX(-50%) でループする
export default function Marquee({ className = '' }: { className?: string }) {
  const items = [...matrixTexts, ...matrixTexts];
  return (
    <div
      className={`overflow-hidden whitespace-nowrap select-none ${className}`}
      aria-hidden="true"
    >
      <div className="inline-flex animate-marquee">
        {items.map((text, i) => (
          <span
            key={i}
            className="font-mono text-sm tracking-[0.25em] text-accent/60 mx-8 flex items-center gap-16"
          >
            {text}
            <span className="text-white/20">◇</span>
          </span>
        ))}
      </div>
    </div>
  );
}
