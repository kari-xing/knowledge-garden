import { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import clsx from 'clsx';

export type EditorMode = 'edit' | 'preview' | 'split';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  mode: EditorMode;
  onModeChange: (mode: EditorMode) => void;
  placeholder?: string;
  className?: string;
}

/** 轻量 Markdown 编辑器：编辑 / 预览 / 分屏 三模式 */
export default function MarkdownEditor({
  value,
  onChange,
  mode,
  onModeChange,
  placeholder = '用 Markdown 写点什么…',
  className,
}: MarkdownEditorProps) {
  const preview = useMemo(
    () => (
      <div className="markdown-body h-full w-full overflow-auto px-4 py-3">
        {value.trim() ? (
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
        ) : (
          <p className="text-sm text-slate-400 dark:text-slate-500">
            预览区：右侧开始输入 Markdown…
          </p>
        )}
      </div>
    ),
    [value],
  );

  const textarea = (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      spellCheck={false}
      className="h-full w-full resize-none bg-transparent p-4 font-mono text-sm leading-6 text-slate-800 outline-none placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500"
    />
  );

  const modes: { key: EditorMode; label: string }[] = [
    { key: 'edit', label: '✏️ 编辑' },
    { key: 'split', label: '📄 分屏' },
    { key: 'preview', label: '👁 预览' },
  ];

  return (
    <div
      className={clsx(
        'flex flex-col overflow-hidden rounded-2xl border border-emerald-100 bg-white dark:border-slate-700 dark:bg-slate-800',
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-emerald-50 px-3 py-2 dark:border-slate-700">
        <div className="flex gap-1">
          {modes.map((m) => (
            <button
              key={m.key}
              onClick={() => onModeChange(m.key)}
              className={clsx(
                'rounded-lg px-3 py-1 text-xs font-medium transition-colors',
                mode === m.key
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200'
                  : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700',
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
        <span className="text-[11px] text-slate-400 dark:text-slate-500">
          GFM 表格 / 任务列表 / 代码高亮
        </span>
      </div>

      <div className="flex-1">
        {mode === 'edit' && textarea}
        {mode === 'preview' && preview}
        {mode === 'split' && (
          <div className="grid h-full grid-cols-2 divide-x divide-emerald-50 dark:divide-slate-700">
            {textarea}
            {preview}
          </div>
        )}
      </div>
    </div>
  );
}
