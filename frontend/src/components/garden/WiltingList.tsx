import { Link } from 'react-router-dom';
import type { WiltingItem } from '../../types';
import { formatRelative } from '../../utils/format';

interface WiltingListProps {
  items: WiltingItem[];
}

/** 即将枯萎（超过 25 天未复习） */
export default function WiltingList({ items }: WiltingListProps) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-slate-400 dark:text-slate-500">
        没有枯萎风险，继续保持浇水 💧
      </p>
    );
  }
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.id}>
          <Link
            to={`/notes/${item.id}`}
            className="flex items-center justify-between gap-2 rounded-xl border border-slate-200/70 bg-white/70 px-3.5 py-2.5 transition-colors hover:bg-white dark:border-slate-600/60 dark:bg-slate-800/60 dark:hover:bg-slate-700"
          >
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-slate-600 dark:text-slate-300">
                🥀 {item.title || '未命名'}
              </div>
              {item.summary && (
                <div className="truncate text-xs text-slate-400">{item.summary}</div>
              )}
            </div>
            <span className="shrink-0 text-[11px] text-slate-400">
              上次复习 {formatRelative(item.last_reviewed_at)}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
