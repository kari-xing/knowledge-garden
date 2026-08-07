import type { RelationEvent } from '../../types';
import { formatSimilarity, formatRelative } from '../../utils/format';

interface RelationFeedProps {
  items: RelationEvent[];
}

/** 最新关联事件流 */
export default function RelationFeed({ items }: RelationFeedProps) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-slate-400 dark:text-slate-500">
        知识关联生成后，会在这里出现 🕸️
      </p>
    );
  }
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li
          key={item.id}
          className="rounded-xl border border-emerald-100 bg-white/70 p-3.5 dark:border-slate-700 dark:bg-slate-800/60"
        >
          <div className="text-sm">
            <span className="font-medium text-emerald-800 dark:text-emerald-300">
              {item.source_title || '未命名'}
            </span>
            <span className="mx-1.5 text-slate-400">↔</span>
            <span className="font-medium text-emerald-800 dark:text-emerald-300">
              {item.target_title || '未命名'}
            </span>
          </div>
          {item.relation_reason && (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              💬 {item.relation_reason}
            </p>
          )}
          <div className="mt-1.5 flex justify-between text-[11px] text-slate-400">
            <span>相似度 {formatSimilarity(item.similarity_score)}</span>
            <span>{formatRelative(item.created_at)}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}
