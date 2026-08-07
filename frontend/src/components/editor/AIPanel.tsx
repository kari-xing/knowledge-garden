import { useState } from 'react';
import type { Note, RelatedNote, Tag } from '../../types';
import { PROCESSING_META, processingLabel } from '../../utils/color';
import { formatSimilarity } from '../../utils/format';
import TagChip from '../common/TagChip';

interface AIPanelProps {
  note: Note;
  summary: string;
  onSummaryChange: (v: string) => void;
  tags: Tag[];
  onAddTag: (name: string) => void;
  onRemoveTag: (id: string) => void;
  onReprocess: () => void;
  reprocessing: boolean;
  related: RelatedNote[];
}

/** 右侧 AI 元数据面板：处理状态 / 摘要 / 标签 / 重新处理 / 关联推荐 */
export default function AIPanel({
  note,
  summary,
  onSummaryChange,
  tags,
  onAddTag,
  onRemoveTag,
  onReprocess,
  reprocessing,
  related,
}: AIPanelProps) {
  const [tagInput, setTagInput] = useState('');
  const pm = PROCESSING_META[note.processing_status as keyof typeof PROCESSING_META];

  const addTag = () => {
    const name = tagInput.trim();
    if (!name) return;
    if (!tags.some((t) => t.name === name)) onAddTag(name);
    setTagInput('');
  };

  return (
    <div className="space-y-5">
      {/* AI 处理状态 */}
      <section className="rounded-2xl border border-emerald-100 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          🤖 AI 处理状态
        </h3>
        <div
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${pm?.badge}`}
        >
          {pm?.pulse && (
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
            </span>
          )}
          {processingLabel(note.processing_status)}
        </div>
        {(note.processing_status === 'failed' || note.processing_status === 'done') && (
          <button
            onClick={onReprocess}
            disabled={reprocessing}
            className="mt-3 w-full rounded-xl border border-emerald-200 px-3 py-1.5 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-50 disabled:opacity-50 dark:border-emerald-500/40 dark:text-emerald-300 dark:hover:bg-emerald-500/10"
          >
            {reprocessing ? '处理中…' : '🔄 重新处理'}
          </button>
        )}
      </section>

      {/* 摘要 */}
      <section className="rounded-2xl border border-emerald-100 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          ✨ 一句话摘要
        </h3>
        <textarea
          value={summary}
          onChange={(e) => onSummaryChange(e.target.value)}
          placeholder="AI 将自动生成，也可手动编辑…"
          rows={3}
          className="w-full resize-none rounded-xl border border-emerald-50 bg-emerald-50/40 p-2.5 text-sm outline-none transition-colors focus:border-emerald-400 focus:bg-white dark:border-slate-600 dark:bg-slate-700/40 dark:focus:bg-slate-700"
        />
      </section>

      {/* 标签 */}
      <section className="rounded-2xl border border-emerald-100 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          🏷️ 标签
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <TagChip key={t.id} tag={t} onRemove={() => onRemoveTag(t.id)} />
          ))}
          {tags.length === 0 && (
            <span className="text-xs text-slate-400">AI 会自动打标签，或手动添加</span>
          )}
        </div>
        <div className="mt-2 flex gap-1.5">
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addTag();
              }
            }}
            placeholder="新标签名…"
            className="min-w-0 flex-1 rounded-xl border border-emerald-50 bg-emerald-50/40 px-2.5 py-1.5 text-sm outline-none transition-colors focus:border-emerald-400 focus:bg-white dark:border-slate-600 dark:bg-slate-700/40 dark:focus:bg-slate-700"
          />
          <button
            onClick={addTag}
            className="rounded-xl bg-emerald-600 px-3 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
          >
            ＋
          </button>
        </div>
      </section>

      {/* 关联推荐 */}
      {related.length > 0 && (
        <section className="rounded-2xl border border-emerald-100 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            🔗 关联推荐
          </h3>
          <ul className="space-y-2.5">
            {related.map((r) => (
              <li key={r.id} className="text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-slate-700 dark:text-slate-200">
                    {r.title || '未命名'}
                  </span>
                  <span className="shrink-0 text-xs text-slate-400">
                    相似 {formatSimilarity(r.similarity)}
                  </span>
                </div>
                {r.reason && (
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    💬 {r.reason}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
