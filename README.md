# 株式会社雪風 コーポレートサイト

[Next.js](https://nextjs.org) (App Router) + [Tailwind CSS v4](https://tailwindcss.com) で構築した株式会社雪風のコーポレートサイト。

## 開発

```bash
npm install
npm run dev      # http://localhost:3000
```

```bash
npm run build    # 本番ビルド
npm run lint     # ESLint
```

## 構成

```
src/
├── app/
│   ├── layout.tsx        # メタデータ・フォント (Noto Sans JP / Yuji Syuku / Geist Mono)
│   ├── page.tsx          # トップページ（セクションの組み立てのみ）
│   └── globals.css       # Tailwind v4 テーマトークン・共通スタイル
├── content/
│   └── site.ts           # サイト全体のコピー・データ（文言修正はここだけ）
└── components/
    ├── Header.tsx        # 固定ナビゲーション（モバイルメニュー付き）
    ├── Hero.tsx          # ヒーロー
    ├── MatrixRain.tsx    # canvas ベースのマトリックス演出
    ├── Services.tsx      # 事業内容
    ├── Vision.tsx        # Vision / Mission
    ├── About.tsx         # 会社紹介・会社概要
    ├── Contact.tsx       # お問い合わせ
    ├── Footer.tsx
    ├── Reveal.tsx        # スクロールリビール（IntersectionObserver）
    └── SectionHeading.tsx
```

## 文言・コンテンツの更新

ナビゲーション、事業内容、Vision/Mission、会社概要、連絡先などのテキストはすべて
`src/content/site.ts` に集約されています。コンポーネントを触らずに更新できます。
