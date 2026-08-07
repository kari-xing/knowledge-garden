import { useEffect } from 'react';
import clsx from 'clsx';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  width?: string;
}

/** 通用居中模态框 */
export default function Modal({
  open,
  onClose,
  title,
  children,
  width = 'max-w-lg',
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
      onMouseDown={onClose}
    >
      <div
        className={clsx(
          'w-full animate-slide-up rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-800',
          width,
        )}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {title && (
          <h3 className="mb-4 text-lg font-semibold text-slate-800 dark:text-slate-100">
            {title}
          </h3>
        )}
        {children}
      </div>
    </div>
  );
}
