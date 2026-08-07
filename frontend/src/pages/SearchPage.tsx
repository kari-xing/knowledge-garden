import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { searchNotes } from '../api/search';
import { getTags } from '../api/tags';
import { useDebounce } from '../hooks/useDebounce';
import type { SearchEngine } from '../types';
import { formatSimilarity, formatRelative } from '../utils/format';
import { statusBadgeClass, statusLabel } from '../utils/color';
import TagChip from '../components/common/TagChip';
import EmptyState from '../components/common/EmptyState';
import Skeleton from '../components/common/Skeleton';

const ENGINES: { key: SearchEngine; label: string }[] = [
  { key: 'mixed', label: '🌐 混合' },
  { key: 'lexical', label: '📖 全文' },
  { key: 'semantic', label: '🧠 语义' },
];

/** 搜索页：混合检索（全文 + 向量 RRF 融合） */
export default function SearchPage() {
  const [q, setQ] = useState('');
  const debouncedQ = useDebounce(q, 400);
  const [engine, setEngine] = useState<SearchEngine>('mixed');
  const [tag, setTag] = useState('');

  const tagsQuery = useQuery({ queryKey: ['tags'], queryFn: getTags });

  const { data, isLoading, isError } = useQuery({
    queryKey: ['search', debouncedQ, engine, tag],
    queryFn: () =>
      searchNotes({
        q: debouncedQ,
        engine,
        tag: tag || undefined,
        page_size: 50,
      }),
    enabled: debouncedQ.trim().length > 0,
  });

  const matchedBadges = useMemo(
    () => ({ content: '正文', title: '标题', semantic: '语义' }),
    [],
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
          🔍 混合检索
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          PostgreSQL 全文检索 + ChromaDB 向量检索的 RRF 融合
        </p>
      </header>

      <div className="space-y-3">
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="输入关键词或自然语言提问，例如：如何优化力导向图性能？"
          className="w-full rounded-2xl border border-emerald-100 bg-white px-5 py-4 text-base shadow-sm outline-none transition-colors focus:border-emerald-400 dark:border-slate-700 dark:bg-slate-800"
        />

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-1 rounded-xl bg-white p-1 shadow-sm dark:bg-slate-800">
            {ENGINES.map((e) => (
              <button
                key={e.key}
                onClick={() => setEngine(e.key)}
                className={clsx(
                  'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                  engine === e.key
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200'
                    : 'text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-700',
                )}
              >
                {e.label}
              </button>
            ))}
          </div>

          <select
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            className="rounded-xl border border-emerald-100 bg-white px-3 py-2 text-sm outline-none dark:border-slate-600 dark:bg-slate-800"
          >
            <option value="">全部标签</option>
            {(tagsQuery.data ?? []).map((t) => (
              <option key={t.id} value={t.name}>
                {t.name}（{t.note_count}）
              </option>
            ))}
          </select>
        </div>
      </div>
      {!debouncedQ.trim() && (
        <EmptyState
          icon="🔍"
          title="输入关键词开始检索"
          description="支持标题、正文与语义检索，结果按 RRF 融合分数排序。"
        />
      )}

      {debouncedQ.trim() && isLoading && <Skeleton lines={6} />}

      {debouncedQ.trim() && isError && (
        <p className="text-sm text-red-500">检索失败，请检查后端服务。</p>
      )}

      {debouncedQ.trim() && data && data.items.length === 0 && (
        <EmptyState
          icon="🌱"
          title="没有找到相关笔记"
          description="换个关键词，或尝试切换到「语义」引擎。"
        />
      )}
      {data && data.items.length > 0 && (
        <div className="space-y-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            找到 {data.total} 条结果
          </p>
          {data.items.map((hit) => (
            <Link
              key={hit.note.id}
              to={`/notes/${hit.note.id}`}
              className="block rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:hover:border-emerald-600"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-semibold text-slate-800 dark:text-slate-100">
                  {hit.note.title || '未命名笔记'}
                </h3>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                    匹配 {formatSimilarity(hit.score)}
                  </span>
                  <span
                    className={clsx(
                      'rounded-full px-2 py-0.5 text-[10px] font-medium',
                      statusBadgeClass(hit.note.status),
                    )}
                  >
                    {statusLabel(hit.note.status)}
                  </span>
                </div>
              </div>

              {hit.snippet && (
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {hit.snippet}
                </p>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {hit.matched_fields.map((f) => (
                  <span
                    key={f}
                    className="rounded bg-sky-50 px-1.5 py-0.5 text-[10px] font-medium text-sky-700 dark:bg-sky-500/10 dark:text-sky-300"
                  >
                    {matchedBadges[f as keyof typeof matchedBadges] ?? f}
                  </span>
                ))}
                {hit.note.tags.slice(0, 4).map((t) => (
                  <TagChip key={t.id} tag={t} />
                ))}
                <span className="ml-auto text-[11px] text-slate-400">
                  {formatRelative(hit.note.updated_at)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
