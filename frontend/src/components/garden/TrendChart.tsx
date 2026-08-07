import type { TrendItem } from '../../types';

interface TrendChartProps {
  items: TrendItem[];
}

/** 最近 N 天笔记趋势（轻量柱状图） */
export default function TrendChart({ items }: TrendChartProps) {
  const max = Math.max(...items.map((i) => i.count), 1);
  return (
    <div className="flex h-28 items-end gap-1.5">
      {items.map((item) => (
        <div
          key={item.date}
          className="group flex flex-1 flex-col items-center gap-1"
          title={`${item.date}：${item.count} 篇`}
        >
          <span className="text-[10px] text-slate-400 opacity-0 transition-opacity group-hover:opacity-100">
            {item.count}
          </span>
          <div
            className="w-full rounded-t-md bg-gradient-to-t from-emerald-500 to-emerald-400 transition-all hover:to-emerald-300"
            style={{ height: `${Math.max((item.count / max) * 80, 4)}px` }}
          />
          <span className="text-[9px] text-slate-400">
            {item.date.slice(5)}
          </span>
        </div>
      ))}
    </div>
  );
}
