import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getDashboard } from '../api/garden';
import { reviewNote } from '../api/notes';
import { useAuthStore } from '../stores/authStore';
import { useUiStore } from '../stores/uiStore';
import { greeting } from '../utils/format';
import StatCard from '../components/garden/StatCard';
import SeedList from '../components/garden/SeedList';
import WiltingList from '../components/garden/WiltingList';
import ReviewToday from '../components/garden/ReviewToday';
import RelationFeed from '../components/garden/RelationFeed';
import TrendChart from '../components/garden/TrendChart';
import Skeleton from '../components/common/Skeleton';
import type { ReviewTodayItem } from '../types';

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-emerald-100 bg-white/80 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800/60">
      <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-700 dark:text-slate-200">
        <span>{icon}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

/** 花园首页看板 */
export default function GardenPage() {
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const toast = useUiStore((s) => s.toast);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['garden', 'dashboard'],
    queryFn: getDashboard,
    refetchInterval: 5000,
  });

  const review = useMutation({
    mutationFn: ({ id, result }: { id: string; result: 'remember' | 'fuzzy' }) =>
      reviewNote(id, result),
    onSuccess: () => {
      toast('复习成功 ✅ 知识更牢固了', 'success');
      void qc.invalidateQueries({ queryKey: ['garden'] });
      void qc.invalidateQueries({ queryKey: ['notes'] });
    },
    onError: (e) => toast((e as Error).message, 'error'),
  });

  const handleReview = (item: ReviewTodayItem, result: 'remember' | 'fuzzy') =>
    review.mutate({ id: item.id, result });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            {greeting()}，{user?.display_name || user?.email?.split('@')[0] || '园丁'} 🌱
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            今天，你的知识花园也在一寸一寸地生长。
          </p>
        </div>
        <button
          onClick={() => void refetch()}
          className="rounded-xl border border-emerald-100 px-3 py-1.5 text-xs text-slate-500 transition-colors hover:bg-emerald-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-700"
        >
          🔄 刷新看板
        </button>
      </header>

      {isLoading && <Skeleton lines={6} className="mt-4" />}

      {isError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          看板加载失败，请确认后端服务已启动。
        </div>
      )}

      {data && (
        <>
          {/* 统计 */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard icon="📝" label="笔记总数" value={data.stats.total_notes} accent="#10b981" />
            <StatCard icon="🏷️" label="标签数" value={data.stats.total_tags} accent="#8b5cf6" />
            <StatCard icon="🔗" label="知识关联" value={data.stats.total_relations} accent="#0ea5e9" />
            <StatCard icon="🔥" label="连续天数" value={data.stats.streak_days} accent="#f59e0b" />
          </div>

          {/* 今日复习 */}
          <Section title="今日复习" icon="🧠">
            <ReviewToday
              items={data.review_today}
              onReview={handleReview}
              reviewing={review.isPending}
            />
          </Section>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* 今日种子 */}
            <Section title="今日种子" icon="🌱">
              <SeedList items={data.seeds} />
            </Section>

            {/* 即将枯萎 */}
            <Section title="即将枯萎" icon="🥀">
              <WiltingList items={data.wilting} />
            </Section>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* 最新关联 */}
            <Section title="最新关联" icon="🕸️">
              <RelationFeed items={data.latest_relations} />
            </Section>

            {/* 笔记趋势 */}
            <Section title="最近趋势" icon="📈">
              {data.trend.length > 0 ? (
                <TrendChart items={data.trend} />
              ) : (
                <p className="text-sm text-slate-400 dark:text-slate-500">
                  暂无趋势数据
                </p>
              )}
            </Section>
          </div>
        </>
      )}
    </div>
  );
}
