import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteNote, getNotes } from '../api/notes';
import { getTags } from '../api/tags';
import { useUiStore } from '../stores/uiStore';
import { formatRelative } from '../utils/format';
import { statusBadgeClass, statusLabel } from '../utils/color';
import StatusBadge from '../components/common/StatusBadge';
import EmptyState from '../components/common/EmptyState';
import Skeleton from '../components/common/Skeleton';
import Modal from '../components/common/Modal';
import ImportModal from '../components/common/ImportModal';
import TagChip from '../components/common/TagChip';
import clsx from 'clsx';

const STATUS_TABS = [
  { key: '', label: '全部' },
  { key: 'seed', label: '🌱 种子' },
  { key: 'growing', label: '🌿 生长' },
  { key: 'mature', label: '💙 成熟' },
  { key: 'wilted', label: '🥀 枯萎' },
];

const PAGE_SIZE = 12;

/** 笔记列表：筛选 / 分页 / 删除 / 导入 */
export default function NotesPage() {
  const qc = useQueryClient();
  const toast = useUiStore((s) => s.toast);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [tag, setTag] = useState('');
  const [q, setQ] = useState('');
  const [importOpen, setImportOpen] = useState(false);
  const [toDelete, setToDelete] = useState<string | null>(null);

  const tagsQuery = useQuery({ queryKey: ['tags'], queryFn: getTags });

  const { data, isLoading, isError } = useQuery({
    queryKey: ['notes', { page, status, tag, q }],
    queryFn: () =>
      getNotes({
        page,
        page_size: PAGE_SIZE,
        status: status || undefined,
        tag: tag || undefined,
        q: q || undefined,
      }),
  });

  const del = useMutation({
    mutationFn: (id: string) => deleteNote(id),
    onSuccess: () => {
      toast('笔记已删除 🗑️', 'success');
      setToDelete(null);
      void qc.invalidateQueries({ queryKey: ['notes'] });
      void qc.invalidateQueries({ queryKey: ['garden'] });
      void qc.invalidateQueries({ queryKey: ['graph'] });
    },
    onError: (e) => toast((e as Error).message, 'error'),
  });

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((data?.total ?? 0) / PAGE_SIZE)),
    [data?.total],
  );

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">📝 笔记</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            共 {data?.total ?? 0} 篇 · AI 自动打标签、摘要与关联
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setImportOpen(true)}
            className="rounded-xl border border-emerald-100 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-emerald-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            📥 导入
          </button>
          <Link
            to="/notes/new"
            className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
          >
            ＋ 新建笔记
          </Link>
        </div>
      </header>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1 rounded-xl bg-white p-1 shadow-sm dark:bg-slate-800">
          {STATUS_TABS.map((s) => (
            <button
              key={s.key}
              onClick={() => {
                setStatus(s.key);
                setPage(1);
              }}
              className={clsx(
                'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                status === s.key
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200'
                  : 'text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-700',
              )}
            >
              {s.label}
            </button>
          ))}
        </div>

        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          placeholder="筛选标题 / 正文…"
          className="w-44 rounded-xl border border-emerald-100 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-emerald-400 dark:border-slate-600 dark:bg-slate-800"
        />

        <select
          value={tag}
          onChange={(e) => {
            setTag(e.target.value);
            setPage(1);
          }}
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
      {isLoading && <Skeleton lines={5} />}
      {isError && (
        <p className="text-sm text-red-500">加载失败，请检查后端服务。</p>
      )}
      {data && data.items.length === 0 && (
        <EmptyState
          icon="🌱"
          title="花园还空着"
          description="点击「新建笔记」或按 Ctrl+Shift+K 快速捕获第一个想法。"
          action={
            <Link
              to="/notes/new"
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              ＋ 新建笔记
            </Link>
          }
        />
      )}

      {data && data.items.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.items.map((note) => (
            <Link
              key={note.id}
              to={`/notes/${note.id}`}
              className="group flex flex-col rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:hover:border-emerald-600"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="line-clamp-2 font-semibold text-slate-800 group-hover:text-emerald-700 dark:text-slate-100 dark:group-hover:text-emerald-300">
                  {note.title || '未命名笔记'}
                </h3>
                <span
                  className={clsx(
                    'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium',
                    statusBadgeClass(note.status),
                  )}
                >
                  {statusLabel(note.status)}
                </span>
              </div>

              {note.summary && (
                <p className="mt-1.5 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">
                  {note.summary}
                </p>
              )}

              {note.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {note.tags.slice(0, 4).map((t) => (
                    <TagChip key={t.id} tag={t} />
                  ))}
                  {note.tags.length > 4 && (
                    <span className="text-xs text-slate-400">
                      +{note.tags.length - 4}
                    </span>
                  )}
                </div>
              )}

              <div className="mt-auto flex items-center justify-between pt-3">
                <StatusBadge
                  status={note.status}
                  processingStatus={note.processing_status}
                />
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400">
                    {formatRelative(note.updated_at)}
                  </span>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setToDelete(note.id);
                    }}
                    className="text-xs text-slate-400 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
                  >
                    删除
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
      {data && data.total > PAGE_SIZE && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-xl border border-emerald-100 px-4 py-1.5 text-sm disabled:opacity-40 dark:border-slate-600"
          >
            ← 上一页
          </button>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {page} / {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-xl border border-emerald-100 px-4 py-1.5 text-sm disabled:opacity-40 dark:border-slate-600"
          >
            下一页 →
          </button>
        </div>
      )}
      <Modal open={!!toDelete} onClose={() => setToDelete(null)} title="删除笔记">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          删除后将同步清理知识图谱节点、关联与复习计划，且不可恢复。确定删除吗？
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={() => setToDelete(null)}
            className="rounded-xl px-4 py-2 text-sm text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            取消
          </button>
          <button
            onClick={() => toDelete && del.mutate(toDelete)}
            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            确认删除
          </button>
        </div>
      </Modal>

      <ImportModal open={importOpen} onClose={() => setImportOpen(false)} />
    </div>
  );
}
