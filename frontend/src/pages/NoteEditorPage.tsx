import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { createNote, reprocessNote, updateNote } from '../api/notes';
import { useNoteProcessing } from '../hooks/useNoteProcessing';
import { useUiStore } from '../stores/uiStore';
import MarkdownEditor, {
  type EditorMode,
} from '../components/editor/MarkdownEditor';
import AIPanel from '../components/editor/AIPanel';
import Skeleton from '../components/common/Skeleton';
import type { Tag } from '../types';
import clsx from 'clsx';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

/** 临时标签（尚未从后端同步 id/color 前使用） */
function tempTag(name: string): Tag {
  return { id: `tmp-${Date.now()}`, name, color: '#8B5CF6', created_at: '' };
}

/** 笔记编辑器：新建 / 编辑，2s 防抖自动保存 */
export default function NoteEditorPage() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const qc = useQueryClient();
  const toast = useUiStore((s) => s.toast);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [summary, setSummary] = useState('');
  const [tags, setTags] = useState<Tag[]>([]);
  const [mode, setMode] = useState<EditorMode>('split');
  const [saveState, setSaveState] = useState<SaveState>(isNew ? 'idle' : 'saving');
  const [creating, setCreating] = useState(false);
  const [reprocessing, setReprocessing] = useState(false);

  const loaded = useRef(!isNew ? false : true);
  const dirty = useRef(false);

  const { data, isLoading } = useNoteProcessing(
    id ?? '',
    () => {
      void qc.invalidateQueries({ queryKey: ['note', id] });
      void qc.invalidateQueries({ queryKey: ['notes'] });
    },
    { enabled: !isNew },
  );

  const tagNames = useMemo(() => tags.map((t) => t.name), [tags]);

  const markDirty = () => {
    dirty.current = true;
    setSaveState('saving');
  };

  const save = async () => {
    if (isNew || !id) return;
    setSaveState('saving');
    try {
      const note = await updateNote(id, {
        title: title || null,
        content,
        summary: summary || null,
        tags: tagNames,
        reprocess: false,
      });
      dirty.current = false;
      setTags(note.tags);
      setSaveState('saved');
      void qc.invalidateQueries({ queryKey: ['note', id] });
    } catch (e) {
      setSaveState('error');
      toast((e as Error).message || '保存失败', 'error');
    }
  };

  // 首次加载：将后端数据写入本地状态
  useEffect(() => {
    if (isNew || !data || loaded.current) return;
    loaded.current = true;
    dirty.current = false;
    setTitle(data.note.title ?? '');
    setContent(data.note.content);
    setSummary(data.note.summary ?? '');
    setTags(data.note.tags);
    setSaveState('saved');
  }, [isNew, data]);

  // 2s 防抖自动保存
  useEffect(() => {
    if (isNew || !loaded.current || !dirty.current) return;
    const timer = window.setTimeout(() => {
      void save();
    }, 2000);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, content, summary, tagNames, isNew, id]);

  const create = async () => {
    if (creating) return;
    setCreating(true);
    try {
      const res = await createNote({
        title: title || null,
        content,
        summary: summary || null,
        tags: tagNames,
      });
      toast(res.message || '笔记已创建 🌱', 'success');
      void qc.invalidateQueries({ queryKey: ['notes'] });
      void qc.invalidateQueries({ queryKey: ['garden'] });
      navigate(`/notes/${res.id}/edit`, { replace: true });
    } catch (e) {
      toast((e as Error).message || '创建失败', 'error');
    } finally {
      setCreating(false);
    }
  };

  const reprocess = async () => {
    if (!id || reprocessing) return;
    setReprocessing(true);
    try {
      await reprocessNote(id);
      toast('已重新加入 AI 处理队列 🔄', 'info');
      void qc.invalidateQueries({ queryKey: ['note', id] });
    } catch (e) {
      toast((e as Error).message, 'error');
    } finally {
      setReprocessing(false);
    }
  };

  const addTag = (name: string) => {
    markDirty();
    setTags((prev) => [...prev.filter((t) => t.name !== name), tempTag(name)]);
  };

  const removeTag = (tagId: string) => {
    markDirty();
    setTags((prev) => prev.filter((t) => t.id !== tagId));
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <Skeleton lines={6} />
      </div>
    );
  }

  const note = data?.note;

  return (
    <div className="space-y-4">
      {/* 顶部工具栏 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => (isNew ? navigate('/notes') : navigate(-1))}
            className="rounded-xl border border-emerald-100 px-3 py-1.5 text-xs text-slate-500 transition-colors hover:bg-emerald-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-700"
          >
            ← 返回
          </button>
          <span
            className={clsx(
              'text-xs font-medium',
              saveState === 'saved' && 'text-emerald-600 dark:text-emerald-400',
              saveState === 'saving' && 'text-amber-500',
              saveState === 'error' && 'text-red-500',
              saveState === 'idle' && 'text-slate-400',
            )}
          >
            {saveState === 'saved' && '✓ 已保存'}
            {saveState === 'saving' && '⏳ 保存中…'}
            {saveState === 'error' && '✗ 保存失败'}
            {saveState === 'idle' && '未保存'}
          </span>
        </div>
        <div className="flex gap-2">
          {!isNew && (
            <button
              onClick={() => navigate(`/notes/${id}`)}
              className="rounded-xl border border-emerald-100 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-emerald-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              👁 查看
            </button>
          )}
          {isNew ? (
            <button
              onClick={() => void create()}
              disabled={!content.trim() || creating}
              className="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {creating ? '创建中…' : '🌱 创建笔记'}
            </button>
          ) : (
            <button
              onClick={() => void save()}
              disabled={saveState === 'saving'}
              className="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-50"
            >
              💾 保存
            </button>
          )}
        </div>
      </div>

      {/* 标题 */}
      <input
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          markDirty();
        }}
        placeholder="输入标题（留空则交给 AI 生成）…"
        className="w-full rounded-2xl border border-emerald-100 bg-white px-5 py-3.5 text-xl font-semibold text-slate-800 outline-none transition-colors focus:border-emerald-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
      />

      {/* 编辑区 + AI 面板 */}
      <div className="flex flex-col gap-4 xl:flex-row">
        <MarkdownEditor
          value={content}
          onChange={(v) => {
            setContent(v);
            markDirty();
          }}
          mode={mode}
          onModeChange={setMode}
          placeholder="用 Markdown 写点什么… 保存后 AI 会自动生成标签、摘要并发现关联。"
          className="min-h-[480px] flex-1"
        />

        <div className="w-full shrink-0 xl:w-80">
          {note ? (
            <AIPanel
              note={note}
              summary={summary}
              onSummaryChange={(v) => {
                setSummary(v);
                markDirty();
              }}
              tags={tags}
              onAddTag={addTag}
              onRemoveTag={removeTag}
              onReprocess={() => void reprocess()}
              reprocessing={reprocessing}
              related={data?.related ?? []}
            />
          ) : (
            <div className="rounded-2xl border border-emerald-100 bg-white p-4 text-sm text-slate-400 dark:border-slate-700 dark:bg-slate-800">
              创建后这里将展示 AI 处理状态、摘要、标签与关联推荐。
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
