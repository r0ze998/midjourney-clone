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
│   ├── fonts.ts         # Noto Sans JP / Shippori Mincho / Geist Mono
│   └── globals.css      # 色・書体のトークン
├── assets/              # next/image で最適化する画像（Wylls の画面）
├── components/          # 各セクション（HomePage が lang を受けて組み立てる）
├── content/site.ts      # 掲載情報
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
