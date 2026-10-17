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
│   ├── (ja)/            # 日本語のルートレイアウトとトップページ（/）
│   ├── (en)/en/         # 英語のルートレイアウトとトップページ（/en）
│   ├── global-not-found.tsx
│   ├── robots.ts / sitemap.ts
│   ├── fonts.ts         # Noto Sans JP / Zen Old Mincho / Geist Mono
│   └── globals.css      # 色・書体のトークン
├── components/
│   ├── HomePage.tsx     # トップ1画面 + 背景（lang を受けて組み立てる）
│   ├── Below.tsx        # 考え方 / 作品 / 会社概要 / 連絡
│   ├── Section.tsx
│   ├── ScrollVar.tsx    # スクロール量を CSS 変数にする（背景が引いていく）
│   ├── Emblem.tsx       # ロゴの立体（three.js）。非対応時はロゴ画像
│   ├── Rain.tsx         # 背景の文字の雨（canvas）
│   └── ExternalLink.tsx
├── assets/              # Wylls の画面（next/image で最適化）
├── content/site.ts      # 掲載情報・背景の文字列
└── lib/metadata.ts      # メタデータ・構造化データ
public/
├── images/              # ロゴ・プロフィール画像
└── og/                  # OG画像（ja / en）
```

## スクリーンショット

```bash
npm run build && npm run start -- -p 3210
CHROME_PATH=/path/to/chrome node scripts/screenshot.mjs http://localhost:3210/ /tmp/yk-shots
```

ヘッドレスで WebGL を動かすには Chrome に `--use-gl=angle --use-angle=swiftshader` を渡します（スクリプト内で設定済み）。
