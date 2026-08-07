import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteTag, getTags, mergeTags, updateTag } from '../api/tags';
import { useUiStore } from '../stores/uiStore';
import type { TagWithCount } from '../types';
import Skeleton from '../components/common/Skeleton';
import EmptyState from '../components/common/EmptyState';
import clsx from 'clsx';

/** 标签管理：重命名 / 着色 / 合并 / 删除 */
export default function TagsPage() {
  const qc = useQueryClient();
  const toast = useUiStore((s) => s.toast);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [mergeSource, setMergeSource] = useState('');
  const [mergeTarget, setMergeTarget] = useState('');

  const { data, isLoading } = useQuery({ queryKey: ['tags'], queryFn: getTags });
  const tags = data ?? [];

  const invalidate = () => void qc.invalidateQueries({ queryKey: ['tags'] });

  const rename = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      updateTag(id, { name }),
    onSuccess: () => {
      toast('标签已重命名 ✏️', 'success');
      setEditingId(null);
      invalidate();
    },
    onError: (e) => toast((e as Error).message, 'error'),
  });

  const recolor = useMutation({
    mutationFn: ({ id, color }: { id: string; color: string }) =>
      updateTag(id, { color }),
    onSuccess: () => {
      toast('标签颜色已更新 🎨', 'success');
      invalidate();
    },
    onError: (e) => toast((e as Error).message, 'error'),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteTag(id),
    onSuccess: () => {
      toast('标签已删除（笔记保留）', 'success');
      invalidate();
    },
    onError: (e) => toast((e as Error).message, 'error'),
  });

  const merge = useMutation({
    mutationFn: () => mergeTags({ source_id: mergeSource, target_id: mergeTarget }),
    onSuccess: () => {
      toast('标签已合并 🧬', 'success');
      setMergeSource('');
      setMergeTarget('');
      invalidate();
    },
    onError: (e) => toast((e as Error).message, 'error'),
  });

  const startEdit = (tag: TagWithCount) => {
    setEditingId(tag.id);
    setRenameValue(tag.name);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
          🏷️ 标签管理
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          共 {tags.length} 个标签 · 图谱节点颜色取自主标签
        </p>
      </header>

      {tags.length >= 2 && (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-emerald-100 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
            🧬 合并标签：
          </span>
          <select
            value={mergeSource}
            onChange={(e) => setMergeSource(e.target.value)}
            className="rounded-xl border border-emerald-100 px-3 py-2 text-sm outline-none dark:border-slate-600 dark:bg-slate-800"
          >
            <option value="">选择来源</option>
            {tags.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <span className="text-slate-400">→</span>
          <select
            value={mergeTarget}
            onChange={(e) => setMergeTarget(e.target.value)}
            className="rounded-xl border border-emerald-100 px-3 py-2 text-sm outline-none dark:border-slate-600 dark:bg-slate-800"
          >
            <option value="">选择目标</option>
            {tags
              .filter((t) => t.id !== mergeSource)
              .map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
          </select>
          <button
            onClick={() => merge.mutate()}
            disabled={!mergeSource || !mergeTarget || merge.isPending}
            className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            合并
          </button>
        </div>
      )}
      {isLoading && <Skeleton lines={6} />}

      {tags.length === 0 && !isLoading && (
        <EmptyState
          icon="🏷️"
          title="还没有标签"
          description="创建笔记后，AI 会自动为它生成领域标签。"
        />
      )}

      <ul className="space-y-2.5">
        {tags.map((tag) => (
          <li
            key={tag.id}
            className="flex flex-wrap items-center gap-3 rounded-2xl border border-emerald-100 bg-white px-4 py-3 transition-colors hover:border-emerald-200 dark:border-slate-700 dark:bg-slate-800"
          >
            <span
              className="h-4 w-4 shrink-0 rounded-full"
              style={{ backgroundColor: tag.color }}
            />
            {editingId === tag.id ? (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && renameValue.trim()) {
                      rename.mutate({ id: tag.id, name: renameValue.trim() });
                    }
                    if (e.key === 'Escape') setEditingId(null);
                  }}
                  className="rounded-lg border border-emerald-300 px-2 py-1 text-sm outline-none dark:border-slate-500 dark:bg-slate-700"
                />
                <button
                  onClick={() =>
                    renameValue.trim() &&
                    rename.mutate({ id: tag.id, name: renameValue.trim() })
                  }
                  className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white"
                >
                  保存
                </button>
              </div>
            ) : (
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {tag.name}
              </span>
            )}

            <span
              className={clsx(
                'rounded-full px-2 py-0.5 text-[11px]',
                tag.note_count > 0
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
                  : 'bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-400',
              )}
            >
              {tag.note_count} 篇
            </span>

            <div className="ml-auto flex items-center gap-1.5">
              <input
                type="color"
                value={tag.color}
                onChange={(e) =>
                  recolor.mutate({ id: tag.id, color: e.target.value })
                }
                className="h-7 w-9 cursor-pointer rounded border-0 bg-transparent"
                title="修改颜色"
              />
              <button
                onClick={() => startEdit(tag)}
                className="rounded-lg px-2 py-1 text-xs text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700"
              >
                ✏️ 重命名
              </button>
              <button
                onClick={() => remove.mutate(tag.id)}
                className="rounded-lg px-2 py-1 text-xs text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
              >
                🗑️ 删除
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
