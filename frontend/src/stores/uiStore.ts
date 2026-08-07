import { create } from 'zustand';

export interface ToastItem {
  id: number;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface UiState {
  toasts: ToastItem[];
  toast: (message: string, type?: ToastItem['type']) => void;
  dismissToast: (id: number) => void;
  dark: boolean;
  setDark: (dark: boolean) => void;
}

let toastSeq = 0;

export const useUiStore = create<UiState>((set, get) => ({
  toasts: [],
  toast: (message, type = 'info') => {
    const id = ++toastSeq;
    set((s) => ({ toasts: [...s.toasts, { id, type, message }] }));
    window.setTimeout(() => get().dismissToast(id), 3200);
  },
  dismissToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  dark: localStorage.getItem('kg-dark') === '1',
  setDark: (dark) => {
    localStorage.setItem('kg-dark', dark ? '1' : '0');
    document.documentElement.classList.toggle('dark', dark);
    set({ dark });
  },
}));

// 初始化时应用深色模式
if (useUiStore.getState().dark) {
  document.documentElement.classList.add('dark');
}
