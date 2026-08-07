import { Link } from 'react-router-dom';
import type { ReviewTodayItem } from '../../types';
import { formatDate } from '../../utils/format';

interface ReviewTodayProps {
  items: ReviewTodayItem[];
  onReview: (item: ReviewTodayItem, result: 'remember' | 'fuzzy') => void;
  reviewing?: boolean;
}

/** 今日应复习 + 复习动作 */
export default function ReviewToday({
  items,
  onReview,
  reviewing,
}: ReviewTodayProps) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-slate-400 dark:text-slate-500">
        今日复习任务已完成 🎉
      </p>
    );
  }
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="rounded-2xl border border-sky-200/70 bg-sky-50/50 p-4 dark:border-sky-500/30 dark:bg-sky-500/10"
        >
          <div className="flex items-start justify-between gap-2">
            <Link
              to={`/notes/${item.id}`}
              className="font-medium text-sky-900 hover:text-sky-700 dark:text-sky-200"
            >
              {item.title || '未命名'}
            </Link>
            <span className="shrink-0 rounded-full bg-sky-200/70 px-2 py-0.5 text-[10px] font-medium text-sky-800 dark:bg-sky-500/20 dark:text-sky-300">
              阶段 {item.stage}
            </span>
          </div>
          {item.summary && (
            <p className="mt-1 line-clamp-2 text-sm text-sky-900/60 dark:text-sky-200/60">
              {item.summary}
            </p>
          )}
          <div className="mt-2.5 flex items-center justify-between">
            <span className="text-xs text-sky-700/50 dark:text-sky-300/50">
              下次复习：{formatDate(item.next_review_date)}
            </span>
            <div className="flex gap-1.5">
              <button
                onClick={() => onReview(item, 'fuzzy')}
                disabled={reviewing}
                className="rounded-lg border border-sky-300 px-2.5 py-1 text-xs font-medium text-sky-700 transition-colors hover:bg-sky-100 disabled:opacity-50 dark:border-sky-500/40 dark:text-sky-300 dark:hover:bg-sky-500/10"
              >
                😵 模糊
              </button>
              <button
                onClick={() => onReview(item, 'remember')}
                disabled={reviewing}
                className="rounded-lg bg-sky-600 px-2.5 py-1 text-xs font-semibold text-white transition-colors hover:bg-sky-700 disabled:opacity-50"
              >
                ✅ 记住了
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
