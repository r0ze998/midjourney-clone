# サイト作り直し（2026年11月）— 「Wylls の世界の模型」

公開されない作業記録。前回（2026-10）の事実確認は `docs/redesign-2026-10.md`。計画の本文は承認済みの計画（A「昼の卓」）に沿う。

## 何を作ったか

- 1ページ。トップに **操作できる模型**（ターンのスライダー1本、層のボタン3つ、読み値、自動ツアー）。
- 模型は画面に固定した背景として全セクションに通り、スクロールで場面（ターン・層・カメラ・沈め具合）が移る。
- セクション：ヒーロー／なぜゲームか（3場面）／Wylls／社名とワールド・ゲーム／開発ログ（GitHub から自動）／会社概要・連絡。日英同じ構成。

## 模型の作り（teardown の作法）

| ファイル | 役割 |
|---|---|
| `src/model/hex.ts` | ヘックスの寸法。Wylls クライアントの `map/table.mjs`・`sprites.mjs` と同じ数（半径 44、潰れ 0.76、上面の持ち上げ） |
| `src/model/world.ts` | 見本の世界。seed 1117 で一度だけ作る。人の村 3・AIの村 2・倉庫 2・見張り塔 2・荷車の道 8 本 |
| `src/model/state.ts` | `state(turn)`：荷車の位置、在庫、着いた荷、AIの判断の跡、読み値。純粋関数（乱数・時計なし） |
| `src/model/render.ts` | Canvas 2D。地形と村は一枚に描き固め、毎フレームは道・境・荷車・ゲージ・光・文字だけ |
| `src/model/timeline.ts` | ツアーの台本（46 秒）と各セクションの場面 |
| `src/model/tiers.ts` | 段 2（全部）／1（30fps、光と判断の跡なし）／0（止めた絵、操作で描き直す） |
| `src/model/store.ts` | 描画ループと操作部品が共有する状態 |
| `src/components/WorldStage.tsx` | 固定の canvas、スクロール→場面、ツアーの時計、段の自動調整、`?capture` の書き出し口 |
| `src/components/ModelControls.tsx` | スライダー・層のボタン・字幕・案内カーソル・読み値・地図を横に引く操作 |

- 入力は `turn` 一つ。画面の数字（在庫・荷車数・AIの判断数・AIの荷の割合・守られたマス）は、すべて同じ `state(turn)` から出るので、絵と数字が食い違わない。
- 自動ツアー：触ると操作を渡し、25 秒触らなければ戻る。
- 模型の中の文字は英語（ご指示）。字幕はサイトの言語。
- 注記「コンセプトを伝えるための模型で、実際のゲームデータではありません。」を常に表示。

## 素材

| 素材 | 出所 | 扱い |
|---|---|---|
| `public/model/@1x`, `@2x` | Wylls の `permutation-server/web/frontier/art/terrain` と `holdings`（人＝ember、AI＝iron） | 持ち主の許可（2026-11-04 の回答）に基づき使用。リポジトリに出所の記録はない。指導者・兵の画像は使わない（生成元 Hunyuan3D-2 のライセンスが未確認のため） |
| `src/assets/wylls-village.jpg` | `wylls/docs/design/uplift/shots/after/s02-village-desk.jpg` | 「見本の世界（固定の時計・同じ乱数）で撮影した開発中の画面」と明記 |
| `public/media/cart.mp4` / `cart-poster.webp` | このサイトの模型から書き出し（`?capture` → Playwright で 240 コマ → ffmpeg H.264）。元の荷車動画は持ち主の Mac にあるかもしれないが、このセッションからは接続できなかった | 「サイトの模型から書き出したもので、ゲームの画面ではありません」と明記。画面に入ったときだけ再生、動きを減らす設定では自動再生しない |
| `public/media/model-still.webp` | 模型の止めた絵 | JS が動かないときの代わり |
| `public/og/{ja,en}.jpg` | 模型の絵＋サイトの書体 | 1200×630 |
| フォント | Zen Old Mincho（見出し）、Geist Mono（ラベル・模型） | SIL OFL。本文は端末の日本語書体（初回の転送量を約 0.9MB 減らすため） |

## 開発ログ

- `src/lib/feed/`。今は GitHub（wylls のマージ済みプルリクエスト、新しい順に 5 件）。ISR で 1 時間ごとに取り直す。
- 取り込めないときはセクションごと出さない。
- X を足すときは `FeedItem` を返す関数を `src/lib/feed/index.ts` の `SOURCES` に加える。X の API は有料。
- 手元での確認は `FEED_FIXTURE=<json のパス>` で。

## 計測（このセッションのヘッドレス Chromium、GPU なし）

- 初回の転送量（動画は含まない）：デスクトップ 1,126KB、スマホ 1,055KB。
  - 内訳：フォント 394KB、JS 386KB（展開後）、CSS 118KB、画像 95〜166KB、HTML 56KB。
  - 前の版は 2.0MB で、本文の Web フォントをやめて減った。
- First Load JS：120 kB（next build の表示）。
- 描画の速さ（requestAnimationFrame の回数）：デスクトップ 24fps、iPhone 相当で CPU を 4 倍遅くしたとき 26fps。
  - GPU のない環境での値で、実機より遅い。
  - 段 1（30fps）への自動の切り替えが働いている。
- iPhone 相当で、ツールバーの出入りを含むスクロール中に 50ms を超える処理はなかった。
  - 前回のスマホの不具合の再発確認。途中で一度 51ms が出たので、canvas の付け直しを減らして直した。
- 6 幅 × 日英で横スクロールなし。コンソールのエラーなし（意図した 404 を除く）。

## 未確認

- 実機（iPhone Safari・Android Chrome）での見え方と滑らかさ。
- Safari での `word-break: auto-phrase` と canvas の文字。
- 本番の GitHub API からの取り込み。このセッションからは API に届かないため、git の履歴から作った同じ形のデータで表示だけ確かめた。
- 読み上げソフトでの実際の読み上げ。

## 戻し方

このコミットを `git revert` するか、Vercel で直前のデプロイを Promote する。
