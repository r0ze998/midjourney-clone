// サイト用の短い映像：模型だけ（文字・計器なし）を、ツアーの t0..t1 秒で書き出す
// node clip.mjs URL OUT_BASE T0 T1 [W H FPS AX AY]
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
const [url, out, t0, t1, W = 1280, H = 720, FPS = 30, AX = 0.5, AY = 0.5] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: process.env.CHROMIUM, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: +W, height: +H }, deviceScaleFactor: 1 });
await p.goto(url + '?capture', { waitUntil: 'networkidle' });
await p.waitForFunction(() => window.__ykCapture?.ready(), null, { timeout: 180000 });
await p.addStyleTag({ content: 'body *{visibility:hidden!important} canvas.pointer-events-none{visibility:visible!important} body{background:#050706!important}' });
const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-', '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', out + '-master.mp4'], { stdio: ['pipe', 'inherit', 'inherit'] });
const n = Math.round((t1 - t0) * FPS);
for (let f = 0; f < n; f++) {
  await p.evaluate(([t, ax, ay]) => window.__ykCapture.render(t, { ax, ay, layers: { logistics: 0.8, defense: 0, ai: 0.4 } }), [+t0 + f / FPS, +AX, +AY]);
  await p.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  const buf = await p.screenshot({ type: 'png' });
  if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
  if (f === 0) await p.screenshot({ path: out + '-poster.png' });
}
ff.stdin.end();
await new Promise((r) => ff.on('close', r));
console.log('done', n);
await b.close();
