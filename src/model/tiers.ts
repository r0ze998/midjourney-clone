// 端末の性能ごとの段。
// 2: 全部（60fps、光と判断の跡、@2x）
// 1: 30fps、光と判断の跡を省く、@1x
// 0: 動きを減らす設定・弱い端末。止まった絵（操作したときだけ描き直す）

export type Tier = 0 | 1 | 2;

type Nav = Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };

export function initialTier(): Tier {
  if (typeof window === 'undefined') return 0;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 0;
  const nav = navigator as Nav;
  if (nav.connection?.saveData) return 0;
  const cores = nav.hardwareConcurrency ?? 4;
  const mem = nav.deviceMemory ?? 4;
  if (cores <= 2 || mem <= 2) return 1;
  return 2;
}

/**
 * 最初のフレームの平均間隔（ms、requestAnimationFrame の実際の間隔）から段を下げる。
 * 描画の呼び出しだけを測ると GPU の仕事が入らないので、フレームの間隔で測る。
 * 重すぎる端末は一度に止めた絵まで下げる。
 */
export function downgrade(tier: Tier, avgIntervalMs: number): Tier {
  if (avgIntervalMs > 50) return 0;
  if (tier === 2 && avgIntervalMs > 24) return 1;
  return tier;
}

export const dprFor = (tier: Tier, width: number) => {
  const dpr = typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1;
  if (tier === 2) return Math.min(dpr, width >= 1024 ? 2 : 1.75);
  if (tier === 1) return Math.min(dpr, 1.5);
  return Math.min(dpr, 1.5);
};
