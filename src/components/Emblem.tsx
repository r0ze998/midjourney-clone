'use client';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

// ロゴ（円錐と輪）を three.js で立体として描く。
// WebGL が使えない・動きを減らす設定・JS 無効のときは、既存のロゴ画像にそのまま置き換わる。
//
// 負荷の約束
// - 表示されていない（display:none などで大きさ 0 の）間は WebGL を作らない。
// - 画面外にある間とタブが隠れている間は描画を止める。
// - canvas は枠いっぱいに絶対配置し、canvas の大きさが枠の大きさに影響しないようにする
//   （影響すると ResizeObserver との間で大きくなり続け、スマホで画面が固まる）。
export default function Emblem({ className = '' }: { className?: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [fallback, setFallback] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let dispose: (() => void) | undefined;
    let cancelled = false;
    let started = false;

    const init = async () => {
      try {
        const THREE = await import('three');
        const { RoomEnvironment } = await import('three/examples/jsm/environments/RoomEnvironment.js');
        if (cancelled) return;

        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.0;
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        const canvas = renderer.domElement;
        canvas.setAttribute('aria-hidden', 'true');
        canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;';
        host.appendChild(canvas);

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 50);
        camera.position.set(0, 0.05, 9.8);

        // 反射用の環境。部屋の光を暗く落とし、黒い物体の稜線だけが拾う程度にする
        const pmrem = new THREE.PMREMGenerator(renderer);
        const envMap = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
        scene.environment = envMap;
        scene.environmentIntensity = 0.5;

        const material = new THREE.MeshPhysicalMaterial({
          color: 0x0b0d0c,
          metalness: 0.55,
          roughness: 0.32,
          clearcoat: 1,
          clearcoatRoughness: 0.18,
          envMapIntensity: 1,
        });

        const group = new THREE.Group();
        // 比率はロゴ画像（1080px）から: 円錐 高さ≒750, 底の直径≒220; 輪 外径≒250, 太さ≒30; 隙間≒40
        const cone = new THREE.Mesh(new THREE.ConeGeometry(0.42, 2.9, 160, 1), material);
        cone.position.y = 0.62;
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.44, 0.065, 48, 160), material);
        // 円錐の底（y = 0.62 - 1.45）から、ロゴと同じ比率の隙間を空けて正面向きに置く
        ring.position.y = -1.49;
        ring.rotation.x = 0.12;
        group.add(cone, ring);
        scene.add(group);

        // 光: 背後左の緑のリム、前上の白いキー、下からの弱い緑
        const rim = new THREE.SpotLight(0x3ef08c, 60, 30, Math.PI / 5, 0.6, 1.2);
        rim.position.set(-5, 3, -4);
        const key = new THREE.DirectionalLight(0xdfe7e0, 3.2);
        key.position.set(3, 5, 4);
        const under = new THREE.PointLight(0x3ef08c, 8, 12, 1.4);
        under.position.set(1.5, -3.5, 1.5);
        scene.add(rim, key, under);

        const draw = () => renderer.render(scene, camera);

        let size = { w: 0, h: 0 };
        const resize = () => {
          const w = host.clientWidth;
          const h = host.clientHeight;
          if (!w || !h || (w === size.w && h === size.h)) return;
          size = { w, h };
          renderer.setSize(w, h, false);
          camera.aspect = w / h;
          // 縦長のときは少し引いて全体を収める
          camera.position.z = camera.aspect < 0.9 ? 11.8 : 9.8;
          camera.updateProjectionMatrix();
          if (reduced) draw();
        };
        resize();
        const ro = new ResizeObserver(resize);
        ro.observe(host);

        // ポインターに合わせてわずかに向きを変える
        const target = { x: 0, y: 0 };
        const onPointer = (e: PointerEvent) => {
          target.x = (e.clientX / window.innerWidth - 0.5) * 2;
          target.y = (e.clientY / window.innerHeight - 0.5) * 2;
        };

        let raf = 0;
        let last = performance.now();
        let t = 0;
        let onScreen = true;
        const frame = (now: number) => {
          raf = requestAnimationFrame(frame);
          const dt = Math.min((now - last) / 1000, 0.1);
          last = now;
          t += dt;
          group.rotation.y += dt * 0.22;
          group.rotation.z += (target.x * 0.12 - group.rotation.z) * 0.04;
          group.rotation.x += (target.y * 0.08 - group.rotation.x) * 0.04;
          group.position.y = Math.sin(t * 0.7) * 0.06;
          draw();
        };
        const start = () => {
          cancelAnimationFrame(raf);
          if (reduced || !onScreen || document.visibilityState !== 'visible') return;
          last = performance.now();
          raf = requestAnimationFrame(frame);
        };
        const stop = () => cancelAnimationFrame(raf);

        // 画面外では止める
        const io = new IntersectionObserver(([entry]) => {
          onScreen = entry.isIntersecting;
          if (onScreen) start();
          else stop();
        });
        io.observe(host);
        const onVisibility = () => (document.visibilityState === 'visible' ? start() : stop());
        document.addEventListener('visibilitychange', onVisibility);

        if (reduced) {
          group.rotation.y = 0.6;
          draw();
        } else {
          window.addEventListener('pointermove', onPointer, { passive: true });
          start();
        }
        setReady(true);

        dispose = () => {
          stop();
          ro.disconnect();
          io.disconnect();
          window.removeEventListener('pointermove', onPointer);
          document.removeEventListener('visibilitychange', onVisibility);
          cone.geometry.dispose();
          ring.geometry.dispose();
          material.dispose();
          envMap.dispose();
          pmrem.dispose();
          renderer.dispose();
          canvas.remove();
        };
      } catch {
        if (!cancelled) setFallback(true);
      }
    };

    // 大きさが 0 でなくなったときに初めて WebGL を用意する
    const gate = new ResizeObserver(() => {
      if (started || !host.clientWidth || !host.clientHeight) return;
      started = true;
      gate.disconnect();
      init();
    });
    gate.observe(host);

    return () => {
      cancelled = true;
      gate.disconnect();
      dispose?.();
    };
  }, []);

  return (
    <div ref={hostRef} className={`relative overflow-hidden ${className}`}>
      {/* 3D が立ち上がるまで、または使えないときはロゴ画像を見せる */}
      <Image
        src="/images/logo.png"
        alt=""
        width={1080}
        height={1080}
        priority
        sizes="(min-width: 1024px) 40vw, 70vw"
        className={`absolute inset-0 m-auto h-[82%] w-auto object-contain mix-blend-screen invert transition-opacity duration-700 ${
          ready && !fallback ? 'opacity-0' : 'opacity-90'
        }`}
      />
    </div>
  );
}
