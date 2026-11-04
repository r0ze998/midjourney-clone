// 使い方: CHROMIUM=/path/to/chrome node film/capture.mjs http://localhost:3210/ film/out/seg0.mp4 0 1920
// 書き出し：?capture のページで __ykCapture.render(t) と __ykRain.step(1/60) を 1 コマずつ呼び、ffmpeg に渡す
// node film/capture.mjs URL OUT.mp4 FROM_FRAME TO_FRAME [W H DPR]
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
const [url, out, from, to, W = 1600, H = 900, DPR = 1.2] = process.argv.slice(2);
const FPS = 60;
const b = await chromium.launch({ executablePath: process.env.CHROMIUM, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: +W, height: +H }, deviceScaleFactor: +DPR });
const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.goto(url + '?capture', { waitUntil: 'networkidle' });
await p.waitForFunction(() => window.__ykCapture?.ready() && window.__ykRain, null, { timeout: 180000 });
// 雨を from コマ目まで進める（どの区間から始めても同じ絵になる）
await p.evaluate((n) => { for (let i = 0; i < n; i++) window.__ykRain.step(1 / 60); }, +from);
const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p', out], { stdio: ['pipe', 'inherit', 'inherit'] });
const t0 = Date.now();
for (let f = +from; f < +to; f++) {
  await p.evaluate((t) => { window.__ykRain.step(1 / 60); window.__ykCapture.render(t); }, f / FPS);
  await p.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  const buf = await p.screenshot({ type: 'jpeg', quality: 94, timeout: 120000 });
  if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
  if ((f - from) % 60 === 0) console.log(out, f, ((Date.now() - t0) / 1000).toFixed(0) + 's');
}
ff.stdin.end();
await new Promise((r) => ff.on('close', r));
console.log('done', out, errs.slice(0, 5));
await b.close();
