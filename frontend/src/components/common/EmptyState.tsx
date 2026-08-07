interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

/** 空态占位 */
export default function EmptyState({
  icon = '🌱',
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-emerald-200 bg-white/50 py-14 px-6 text-center dark:border-slate-700 dark:bg-slate-800/30">
      <div className="text-5xl">{icon}</div>
      <h3 className="mt-4 text-base font-semibold text-slate-700 dark:text-slate-200">
        {title}
      </h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm text-slate-500 dark:text-slate-400">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
