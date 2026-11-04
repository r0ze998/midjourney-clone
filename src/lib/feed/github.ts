import type { FeedItem } from './types';

// Wylls の公開リポジトリで、マージされたプルリクエストを新しい順に取る。
// 認証なしの API（1 時間あたり 60 回まで）。ページは 1 時間ごとに作り直すので足りる。
const REPO = 'r0ze998/wylls';

type Pull = { title: string; html_url: string; merged_at: string | null };

export async function githubFeed(limit = 5): Promise<FeedItem[]> {
  const res = await fetch(`https://api.github.com/repos/${REPO}/pulls?state=closed&sort=updated&direction=desc&per_page=30`, {
    headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'yukikaze-site' },
    next: { revalidate: 3600 },
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) throw new Error(`GitHub ${res.status}`);
  const pulls = (await res.json()) as Pull[];
  return pulls
    .filter((p): p is Pull & { merged_at: string } => Boolean(p.merged_at))
    .sort((a, b) => b.merged_at.localeCompare(a.merged_at))
    .slice(0, limit)
    .map((p) => ({ date: p.merged_at, title: p.title, url: p.html_url, source: 'github' as const }));
}
