// デザイン確認用スクリーンショットスクリプト
// 使い方: node scripts/screenshot.mjs [url] [出力ディレクトリ]
import { chromium } from 'playwright-core';
import { homedir } from 'os';

const url = process.argv[2] ?? 'http://localhost:3210/';
const outDir = process.argv[3] ?? '/tmp/yk-shots';
const executablePath = `${homedir()}/Library/Caches/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-mac-arm64/chrome-headless-shell`;

const browser = await chromium.launch({ executablePath });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(url, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(2500);

// ヒーロー
await page.screenshot({ path: `${outDir}/hero.png` });

// 各セクション
for (const id of ['services', 'vision', 'about', 'contact']) {
  await page.evaluate((id) => {
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: 'instant', block: 'start' });
  }, id);
  await page.waitForTimeout(1200); // reveal アニメーション待ち
  await page.screenshot({ path: `${outDir}/${id}.png` });
}

// フッター
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(1200);
await page.screenshot({ path: `${outDir}/footer.png` });

// モバイル
const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
await mobile.goto(url, { waitUntil: 'networkidle' });
await mobile.waitForTimeout(2500);
await mobile.screenshot({ path: `${outDir}/mobile-hero.png` });

await browser.close();
console.log('saved to', outDir);
