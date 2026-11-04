import HomePage from '../../../components/HomePage';
import { loadFeed } from '../../../lib/feed';

// 開発ログを取り込むため、1 時間ごとに作り直す（ISR）
export const revalidate = 3600;

export default async function Page() {
  const feed = await loadFeed();
  return <HomePage lang="en" feed={feed} />;
}
