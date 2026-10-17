'use client';
import { useEffect } from 'react';

// スクロール量を 0〜1 の CSS 変数 --scroll にして html に置く。
// 最初の1画面分で 1 になる。背景の雨と立体はこれを使って引いていく。
export default function ScrollVar() {
  useEffect(() => {
    const root = document.documentElement;
    let raf = 0;
    const update = () => {
      raf = 0;
      const t = Math.min(window.scrollY / (window.innerHeight * 0.9), 1);
      root.style.setProperty('--scroll', t.toFixed(3));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      root.style.removeProperty('--scroll');
    };
  }, []);
  return null;
}
