import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { deleteNote, reviewNote } from '../api/notes';
import { useNoteProcessing } from '../hooks/useNoteProcessing';
import { useUiStore } from '../stores/uiStore';
import { formatDateTime, formatSimilarity } from '../utils/format';
import StatusBadge from '../components/common/StatusBadge';
import TagChip from '../components/common/TagChip';
import Skeleton from '../components/common/Skeleton';
import Modal from '../components/common/Modal';

/** 笔记详情：正文 / 复习 / 关联推荐 */
export default function NoteDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const toast = useUiStore((s) => s.toast);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { data, isLoading, isError } = useNoteProcessing(id, () => {
    void qc.invalidateQueries({ queryKey: ['notes'] });
    void qc.invalidateQueries({ queryKey: ['garden'] });
  });

  const review = useMutation({
    mutationFn: (result: 'remember' | 'fuzzy') => reviewNote(id, result),
    onSuccess: (res) => {
      toast(`复习成功，进入阶段 ${res.stage_after} 🎉`, 'success');
      void qc.invalidateQueries({ queryKey: ['note', id] });
      void qc.invalidateQueries({ queryKey: ['garden'] });
      void qc.invalidateQueries({ queryKey: ['notes'] });
    },
    onError: (e) => toast((e as Error).message, 'error'),
  });

  const del = useMutation({
    mutationFn: () => deleteNote(id),
    onSuccess: () => {
      toast('笔记已删除 🗑️', 'success');
      navigate('/notes', { replace: true });
    },
    onError: (e) => toast((e as Error).message, 'error'),
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Skeleton lines={6} />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="mx-auto max-w-3xl rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
        笔记加载失败或不存在。
      </div>
    );
  }

  const { note, related, review: reviewInfo } = data;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={() => navigate(-1)}
          className="rounded-xl border border-emerald-100 px-3 py-1.5 text-xs text-slate-500 transition-colors hover:bg-emerald-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-700"
        >
          ← 返回
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => setConfirmDelete(true)}
            className="rounded-xl border border-red-100 px-3 py-1.5 text-xs text-red-500 transition-colors hover:bg-red-50 dark:border-red-500/30 dark:hover:bg-red-500/10"
          >
            删除
          </button>
          <Link
            to={`/notes/${id}/edit`}
            className="rounded-xl bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-700"
          >
            ✏️ 编辑
          </Link>
        </div>
      </div>

      <article className="rounded-2xl border border-emerald-100 bg-white p-7 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <StatusBadge status={note.status} processingStatus={note.processing_status} />
          <span className="text-xs text-slate-400">
            创建于 {formatDateTime(note.created_at)}
          </span>
        </div>

        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
          {note.title || '未命名笔记'}
        </h1>

        {note.summary && (
          <p className="mt-2 rounded-xl bg-emerald-50/70 px-4 py-2.5 text-sm text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-200">
            ✨ {note.summary}
          </p>
        )}

        {note.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {note.tags.map((t) => (
              <TagChip key={t.id} tag={t} />
            ))}
          </div>
        )}

        <div className="markdown-body mt-6 border-t border-emerald-50 pt-6 dark:border-slate-700">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{note.content}</ReactMarkdown>
        </div>
      </article>

      <section className="rounded-2xl border border-sky-200 bg-sky-50/60 p-5 dark:border-sky-500/30 dark:bg-sky-500/10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-sky-900 dark:text-sky-200">🧠 间隔重复复习</h2>
            {reviewInfo ? (
              <p className="mt-1 text-sm text-sky-800/70 dark:text-sky-300/70">
                当前阶段 {reviewInfo.stage} · 下次复习{' '}
                {reviewInfo.next_review_date ?? '-'}（1→3→7→15→30 天）
              </p>
            ) : (
              <p className="mt-1 text-sm text-sky-800/70 dark:text-sky-300/70">
                复习计划将由系统自动创建
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => review.mutate('fuzzy')}
              disabled={review.isPending}
              className="rounded-xl border border-sky-300 px-4 py-2 text-sm font-medium text-sky-700 transition-colors hover:bg-sky-100 disabled:opacity-50 dark:border-sky-500/40 dark:text-sky-300 dark:hover:bg-sky-500/10"
            >
              😵 模糊
            </button>
            <button
              onClick={() => review.mutate('remember')}
              disabled={review.isPending}
              className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-sky-700 disabled:opacity-50"
            >
              ✅ 记住了
            </button>
          </div>
        </div>
      </section>
      {related.length > 0 && (
        <section className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <h2 className="mb-3 font-semibold text-slate-700 dark:text-slate-200">
            🔗 关联知识（{related.length}）
          </h2>
          <ul className="space-y-3">
            {related.map((r) => (
              <li key={r.id}>
                <Link
                  to={`/notes/${r.id}`}
                  className="block rounded-xl border border-emerald-50 p-3.5 transition-colors hover:bg-emerald-50/60 dark:border-slate-700 dark:hover:bg-slate-700/40"
                >
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="font-medium text-emerald-800 dark:text-emerald-300">
                      {r.title || '未命名'}
                    </span>
                    <span className="shrink-0 text-xs text-slate-400">
                      相似 {formatSimilarity(r.similarity)}
                    </span>
                  </div>
                  {r.reason && (
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      💬 {r.reason}
                    </p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} title="删除笔记">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          将级联删除向量、图谱关联与复习计划，且不可恢复。确定删除吗？
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={() => setConfirmDelete(false)}
            className="rounded-xl px-4 py-2 text-sm text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            取消
          </button>
          <button
            onClick={() => del.mutate()}
            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            确认删除
          </button>
        </div>
      </Modal>
    </div>
  );
}
