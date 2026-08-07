import clsx from 'clsx';

interface SkeletonProps {
  className?: string;
  lines?: number;
}

/** 加载骨架屏 */
export default function Skeleton({ className, lines = 3 }: SkeletonProps) {
  return (
    <div className={clsx('animate-pulse space-y-3', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={clsx(
            'h-4 rounded bg-emerald-100/70 dark:bg-slate-700/60',
            i === 0 ? 'w-3/4' : i === 1 ? 'w-full' : 'w-1/2',
          )}
        />
      ))}
    </div>
  );
}
