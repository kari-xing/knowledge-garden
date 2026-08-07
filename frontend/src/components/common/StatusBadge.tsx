import clsx from 'clsx';
import {
  PROCESSING_META,
  processingLabel,
  statusBadgeClass,
  statusLabel,
} from '../../utils/color';

interface StatusBadgeProps {
  status: string;
  processingStatus?: string;
  className?: string;
}

/** 生命周期状态徽章 + 可选 AI 处理状态 */
export default function StatusBadge({
  status,
  processingStatus,
  className,
}: StatusBadgeProps) {
  const meta = PROCESSING_META[processingStatus as keyof typeof PROCESSING_META];
  return (
    <span className={clsx('inline-flex items-center gap-1.5 flex-wrap', className)}>
      <span
        className={clsx(
          'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
          statusBadgeClass(status),
        )}
      >
        {statusLabel(status)}
      </span>
      {processingStatus && processingStatus !== 'done' && (
        <span
          className={clsx(
            'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
            meta?.badge,
          )}
        >
          {meta?.pulse && (
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
            </span>
          )}
          {processingLabel(processingStatus)}
        </span>
      )}
    </span>
  );
}
