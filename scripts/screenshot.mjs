// デザイン確認用スクリーンショットスクリプト
// 使い方: CHROME_PATH=/path/to/chrome node scripts/screenshot.mjs [url] [出力ディレクトリ]
import { chromium } from 'playwright-core';
import { mkdirSync } from 'fs';

const url = process.argv[2] ?? 'http://localhost:3210/';
const outDir = process.argv[3] ?? '/tmp/yk-shots';
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH });

for (const [name, width, height] of [
  ['mobile', 390, 844],
  ['tablet', 768, 1024],
  ['desktop', 1440, 900],
]) {
  const page = await browser.newPage({ viewport: { width, height } });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  // 遅延読み込みの画像を読み込ませる
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 500) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${outDir}/${name}-top.png` });
  await page.screenshot({ path: `${outDir}/${name}-full.png`, fullPage: true });
  await page.close();
}

await browser.close();
console.log('saved to', outDir);
