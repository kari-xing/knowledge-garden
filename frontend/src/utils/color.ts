import type { NoteStatus, ProcessingStatus } from '../types';

interface Meta {
  label: string;
  /** 图谱节点 hex 颜色 */
  color: string;
  /** tailwind badge 类 */
  badge: string;
  glow?: boolean;
}

/** 生命周期状态 → 展示元数据 */
export const STATUS_META: Record<NoteStatus, Meta> = {
  seed: {
    label: '种子',
    color: '#f59e0b',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
    glow: true,
  },
  growing: {
    label: '生长中',
    color: '#10b981',
    badge:
      'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
  },
  mature: {
    label: '成熟',
    color: '#0284c7',
    badge: 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300',
  },
  wilted: {
    label: '枯萎',
    color: '#94a3b8',
    badge: 'bg-slate-200 text-slate-600 dark:bg-slate-600 dark:text-slate-300',
  },
  archived: {
    label: '已归档',
    color: '#64748b',
    badge: 'bg-slate-200 text-slate-600 dark:bg-slate-600 dark:text-slate-300',
  },
};

export function statusLabel(status: string): string {
  return STATUS_META[status as NoteStatus]?.label ?? status;
}

export function statusColor(status: string): string {
  return STATUS_META[status as NoteStatus]?.color ?? '#94a3b8';
}

export function statusBadgeClass(status: string): string {
  return STATUS_META[status as NoteStatus]?.badge ?? STATUS_META.wilted.badge;
}

export function statusGlow(status: string): boolean {
  return STATUS_META[status as NoteStatus]?.glow ?? false;
}

/** AI 处理状态 → 展示元数据 */
export const PROCESSING_META: Record<
  ProcessingStatus,
  { label: string; badge: string; pulse?: boolean }
> = {
  pending: {
    label: 'AI 排队中',
    badge:
      'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300',
    pulse: true,
  },
  processing: {
    label: 'AI 处理中',
    badge:
      'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300',
    pulse: true,
  },
  done: {
    label: 'AI 已完成',
    badge: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300',
  },
  failed: {
    label: 'AI 处理失败',
    badge: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300',
  },
};

export function processingLabel(status: string): string {
  return PROCESSING_META[status as ProcessingStatus]?.label ?? status;
}

/** 标签色 → 文本颜色（暗色模式可读性） */
export function tagTextColor(hex: string): string {
  return hex;
}
