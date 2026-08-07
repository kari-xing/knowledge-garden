interface StatCardProps {
  icon: string;
  label: string;
  value: number | string;
  accent?: string;
}

/** 花园统计卡片 */
export default function StatCard({ icon, label, value, accent }: StatCardProps) {
  return (
    <div className="flex items-center gap-3.5 rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div
        className="flex h-11 w-11 items-center justify-center rounded-xl text-xl"
        style={{ backgroundColor: `${accent ?? '#10b981'}1f` }}
      >
        {icon}
      </div>
      <div>
        <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">
          {value}
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400">{label}</div>
      </div>
    </div>
  );
}
