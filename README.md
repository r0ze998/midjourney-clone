# 株式会社雪風 コーポレートサイト

https://www.yukikaze.games — [Next.js](https://nextjs.org) (App Router) + [Tailwind CSS v4](https://tailwindcss.com)。日本語（`/`）と英語（`/en`）。

## 開発

```bash
npm install
npm run dev      # http://localhost:3000
npm run lint
npm run build
```

## 掲載情報の更新

文言・リンク・プロジェクトの状態は、すべて `src/content/site.ts` にあります。

- `ja` と `en` は同じ構成です。片方だけを更新しないでください。
- 根拠を確認できた事実だけを載せ、出典はコメントに残します。受賞・調達・ユーザー数・公開日は、根拠がない限り載せません。
- 事実の分類と、刷新時の判断は `docs/redesign-2026-10.md` にまとめています。

## 構成

```
src/
├── app/
│   ├── (ja)/ , (en)/en/   # 言語ごとのルートレイアウトとページ（1 時間ごとに作り直す）
│   ├── global-not-found.tsx, robots.ts, sitemap.ts
│   ├── fonts.ts           # Zen Old Mincho / Geist Mono（本文は端末の書体）
│   └── globals.css        # 色・書体のトークン
├── model/                 # Wylls の世界の模型（描画以外は純粋な関数）
│   ├── hex.ts  world.ts  state.ts  timeline.ts  tiers.ts  store.ts
├── model3d/               # three.js の組み立て・視点・計器（後から読み込む）
│   ├── world3d.ts  camera.ts  console.ts
├── components/
│   ├── HomePage.tsx       # ページの構成（各セクションに data-scene）
│   ├── WorldStage.tsx     # 画面に固定した模型。スクロールで場面が移る
│   ├── ModelControls.tsx  # スライダー・層のボタン・読み値・自動ツアーのカーソル
│   ├── Rain.tsx           # 背景の文字の雨
│   ├── CartVideo.tsx, ExternalLink.tsx
├── lib/feed/              # 開発ログの取り込み（GitHub。X は後から足せる）
├── content/site.ts        # 掲載情報（ja / en）と模型の中の英語表示
film/                      # X 投稿用の映像の台本と音（teardown の sfx）
public/
├── media/                 # 模型から書き出した映像、模型の止めた絵
└── og/                    # OG画像
```

模型の考え方と計測は `docs/redesign-2026-11.md`。

## 映像の書き出し（X 投稿用）

`?capture` を付けて開くと、ページは自分では動かず、`window.__ykCapture.render(t)`（ツアーの t 秒の 1 コマ）と `window.__ykRain.step(dt)` を外から呼べるようになります。Playwright で 1 コマずつ撮って ffmpeg に渡します。

```bash
npx jiti film/timeline.mts > film/timeline.json         # 台本と、荷の到着・AIの判断の時刻
python ~/.claude/skills/teardown/run_sfx.py film/score.py # 音 → film/out/score.wav（-14 LUFS）
```

## スクリーンショット

```bash
npm run build && npm run start -- -p 3210
CHROME_PATH=/path/to/chrome node scripts/screenshot.mjs http://localhost:3210/ /tmp/yk-shots
```

ヘッドレスで WebGL を動かすには Chrome に `--use-gl=angle --use-angle=swiftshader` を渡します（スクリプト内で設定済み）。
