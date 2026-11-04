import { readFile } from 'node:fs/promises';
import { githubFeed } from './github';
import type { FeedAdapter, FeedItem } from './types';

// 取り込み元の一覧。X などを足すときは、FeedItem を返す関数をここに加える。
const SOURCES: FeedAdapter[] = [githubFeed];

/**
 * 開発ログ。どれかの取り込み元が失敗しても、ほかの分だけで返す。全部失敗したら空（セクションを出さない）。
 * FEED_FIXTURE に JSON のパスを渡すと、それを読む（手元の確認用）。
 */
export async function loadFeed(limit = 5): Promise<FeedItem[]> {
  if (process.env.FEED_FIXTURE) {
    try {
      return (JSON.parse(await readFile(process.env.FEED_FIXTURE, 'utf8')) as FeedItem[]).slice(0, limit);
    } catch {
      return [];
    }
  }
  const results = await Promise.allSettled(SOURCES.map((s) => s()));
  return results
    .flatMap((r) => (r.status === 'fulfilled' ? r.value : []))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit);
}

export type { FeedItem } from './types';
