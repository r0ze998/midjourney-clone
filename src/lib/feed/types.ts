// 開発ログの共通の形。取り込み元（GitHub、将来の X など）は、すべてこの形に揃えて返す。
// 本文・題名は外部の文章なので、表示ではただの文字として扱う（HTML として埋め込まない）。

export type FeedSource = 'github' | 'x' | 'note';

export type FeedItem = {
  /** ISO 8601 */
  date: string;
  title: string;
  url: string;
  source: FeedSource;
};

export type FeedAdapter = () => Promise<FeedItem[]>;
