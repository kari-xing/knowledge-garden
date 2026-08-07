import { useEffect, useRef } from 'react';

/** 全局快捷键：Ctrl+Shift+K 快速捕获 */
export function useQuickCaptureShortcut(handler: () => void) {
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        ref.current();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
}
