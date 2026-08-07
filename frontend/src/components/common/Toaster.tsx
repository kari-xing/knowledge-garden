import clsx from 'clsx';
import { useUiStore } from '../../stores/uiStore';

const ICONS: Record<string, string> = {
  success: '✅',
  error: '⛔',
  info: '💡',
};

/** 全局 Toast 容器 */
export default function Toaster() {
  const toasts = useUiStore((s) => s.toasts);
  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[100] flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={clsx(
            'pointer-events-auto flex animate-slide-up items-center gap-2.5 rounded-xl px-4 py-3 text-sm shadow-lg',
            t.type === 'success' && 'bg-emerald-600 text-white',
            t.type === 'error' && 'bg-red-600 text-white',
            t.type === 'info' && 'bg-slate-800 text-white dark:bg-slate-700',
          )}
        >
          <span>{ICONS[t.type]}</span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}
