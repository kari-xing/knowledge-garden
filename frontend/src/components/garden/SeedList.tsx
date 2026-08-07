import { Link } from 'react-router-dom';
import type { SeedItem } from '../../types';
import { formatRelative } from '../../utils/format';
import { statusGlow, statusLabel } from '../../utils/color';

interface SeedListProps {
  items: SeedItem[];
}

/** 今日种子（最近 7 天创建的 seed/growing 笔记） */
export default function SeedList({ items }: SeedListProps) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-slate-400 dark:text-slate-500">
        还没有新种子，用「快速捕获」种下第一颗吧 🌱
      </p>
    );
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <Link
          key={item.id}
          to={`/notes/${item.id}`}
          className={`group rounded-2xl border border-amber-200/70 bg-amber-50/50 p-4 transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-amber-500/30 dark:bg-amber-500/10 ${
            statusGlow(item.status) ? 'animate-seed-breathe' : ''
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-medium text-amber-900 group-hover:text-amber-700 dark:text-amber-200">
              {item.title || '未命名种子'}
            </h4>
            <span className="shrink-0 rounded-full bg-amber-200/70 px-2 py-0.5 text-[10px] font-medium text-amber-800 dark:bg-amber-500/20 dark:text-amber-300">
              🌱 {statusLabel(item.status)}
            </span>
          </div>
          {item.summary && (
            <p className="mt-1 line-clamp-2 text-sm text-amber-900/60 dark:text-amber-200/60">
              {item.summary}
            </p>
          )}
          <div className="mt-2 text-xs text-amber-700/50 dark:text-amber-300/50">
            {formatRelative(item.created_at)}
          </div>
        </Link>
      ))}
    </div>
  );
}
