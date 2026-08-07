import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from './Modal';
import { createNote } from '../../api/notes';
import { useUiStore } from '../../stores/uiStore';

interface QuickCaptureProps {
  open: boolean;
  onClose: () => void;
}

/** 快速捕获：Ctrl+Shift+K 唤起，创建草稿笔记后进入 AI 流水线 */
export default function QuickCapture({ open, onClose }: QuickCaptureProps) {
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const toast = useUiStore((s) => s.toast);
  const navigate = useNavigate();

  const submit = async () => {
    const text = content.trim();
    if (!text || saving) return;
    setSaving(true);
    try {
      const result = await createNote({ content: text });
      toast(`🌱 已种下新种子，AI 正在处理中`, 'success');
      onClose();
      setContent('');
      navigate(`/notes/${result.id}`);
    } catch (e) {
      toast((e as Error).message || '创建失败', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="⚡ 快速捕获想法">
      <textarea
        autoFocus
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            e.preventDefault();
            void submit();
          }
          if (e.key === 'Escape') onClose();
        }}
        placeholder="写点什么… 支持 Markdown（Ctrl/⌘ + Enter 提交）"
        className="h-40 w-full resize-none rounded-xl border border-emerald-100 bg-emerald-50/40 p-3 text-sm outline-none transition-colors focus:border-emerald-400 focus:bg-white dark:border-slate-600 dark:bg-slate-700/40 dark:focus:bg-slate-700"
      />
      <div className="mt-4 flex justify-end gap-2">
        <button
          onClick={onClose}
          className="rounded-xl px-4 py-2 text-sm text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          取消
        </button>
        <button
          onClick={() => void submit()}
          disabled={!content.trim() || saving}
          className="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? '种下…' : '种下种子'}
        </button>
      </div>
    </Modal>
  );
}
