import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { getGraphLinks, getGraphNodes, getGraphPath } from '../api/graph';
import GraphCanvas from '../components/graph/GraphCanvas';
import { linkKey } from '../components/graph/useForceGraph';
import { statusColor } from '../utils/color';
import EmptyState from '../components/common/EmptyState';
import Skeleton from '../components/common/Skeleton';

const STATUS_FILTERS = ['seed', 'growing', 'mature', 'wilted'];

/** 知识图谱：力导向图 + 状态/标签过滤 + 最短路径探索 */
export default function GraphPage() {
  const navigate = useNavigate();
  const [pathMode, setPathMode] = useState(false);
  const [select, setSelect] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<Set<string>>(new Set());
  const [tagFilter, setTagFilter] = useState('');

  const nodesQuery = useQuery({
    queryKey: ['graph', 'nodes'],
    queryFn: () => getGraphNodes(),
  });
  const linksQuery = useQuery({
    queryKey: ['graph', 'links'],
    queryFn: getGraphLinks,
  });

  const pathQuery = useQuery({
    queryKey: ['graph', 'path', ...select],
    queryFn: () => getGraphPath(select[0], select[1]),
    enabled: select.length === 2,
  });

  const filteredNodes = useMemo(() => {
    const nodes = nodesQuery.data ?? [];
    return nodes.filter((n) => {
      if (statusFilter.size > 0 && !statusFilter.has(n.status)) return false;
      if (tagFilter && !n.tags.includes(tagFilter)) return false;
      return true;
    });
  }, [nodesQuery.data, statusFilter, tagFilter]);

  const visibleIds = useMemo(
    () => new Set(filteredNodes.map((n) => n.id)),
    [filteredNodes],
  );

  const filteredLinks = useMemo(
    () =>
      (linksQuery.data ?? []).filter(
        (l) => visibleIds.has(l.source) && visibleIds.has(l.target),
      ),
    [linksQuery.data, visibleIds],
  );

  const pathKeys = useMemo(() => {
    if (!pathQuery.data) return undefined;
    return new Set(pathQuery.data.links.map((l) => linkKey(l.source, l.target)));
  }, [pathQuery.data]);

  const selectedIds = useMemo(() => new Set(select), [select]);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    (nodesQuery.data ?? []).forEach((n) => n.tags.forEach((t) => set.add(t)));
    return Array.from(set);
  }, [nodesQuery.data]);

  const handleNodeClick = (id: string) => {
    if (!pathMode) {
      if (id) navigate(`/notes/${id}`);
      return;
    }
    if (!id) {
      setSelect([]);
      return;
    }
    setSelect((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  };

  const toggleStatus = (s: string) => {
    setStatusFilter((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  };

  return (
    <div className="flex h-[calc(100vh-56px)] flex-col space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            🕸️ 知识图谱
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {filteredNodes.length} 个知识节点 · {filteredLinks.length} 条关联
            {pathQuery.data &&
              ` · 路径距离 ${pathQuery.data.distance.toFixed(2)}`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap gap-1.5">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s}
                onClick={() => toggleStatus(s)}
                className={clsx(
                  'flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                  statusFilter.has(s)
                    ? 'border-transparent text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300',
                )}
                style={
                  statusFilter.has(s)
                    ? { backgroundColor: statusColor(s) }
                    : undefined
                }
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: statusColor(s) }}
                />
                {s}
              </button>
            ))}
          </div>

          <select
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            className="rounded-xl border border-emerald-100 bg-white px-3 py-1.5 text-xs outline-none dark:border-slate-600 dark:bg-slate-800"
          >
            <option value="">全部标签</option>
            {allTags.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <button
            onClick={() => {
              setPathMode((p) => !p);
              setSelect([]);
            }}
            className={clsx(
              'rounded-xl px-3.5 py-1.5 text-xs font-medium transition-colors',
              pathMode
                ? 'bg-amber-500 text-white'
                : 'border border-emerald-100 bg-white text-slate-600 hover:bg-emerald-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300',
            )}
          >
            {pathMode ? '🛑 退出路径模式' : '🔀 路径探索'}
          </button>
        </div>
      </header>
      {pathMode && (
        <div className="flex items-center gap-3 rounded-xl bg-amber-50 px-4 py-2 text-xs text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
          <span>
            依次点击两个节点，高亮其最短关联路径
            {select[0] && ` · 已选 1（${select[0].slice(0, 8)}…）`}
            {select[1] && ` · 已选 2（${select[1].slice(0, 8)}…）`}
          </span>
          {select.length > 0 && (
            <button
              onClick={() => setSelect([])}
              className="rounded-lg bg-amber-200/60 px-2 py-0.5 font-medium hover:bg-amber-300/60 dark:bg-amber-500/20 dark:hover:bg-amber-500/30"
            >
              清空选择
            </button>
          )}
        </div>
      )}
      <div className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        {nodesQuery.isLoading && (
          <div className="p-8">
            <Skeleton lines={8} />
          </div>
        )}
        {nodesQuery.isError && (
          <div className="p-8">
            <EmptyState
              icon="🕸️"
              title="图谱加载失败"
              description="请确认后端服务已启动，且已创建笔记与关联。"
            />
          </div>
        )}
        {nodesQuery.data && nodesQuery.data.length === 0 && (
          <div className="p-8">
            <EmptyState
              icon="🌱"
              title="还没有知识节点"
              description="先创建几篇笔记，AI 会自动建立关联，图谱就会生长起来。"
            />
          </div>
        )}
        {nodesQuery.data && nodesQuery.data.length > 0 && (
          <GraphCanvas
            nodes={filteredNodes}
            links={filteredLinks}
            pathKeys={pathKeys}
            selectedIds={selectedIds}
            onNodeClick={handleNodeClick}
            className="h-full w-full"
          />
        )}
      </div>
      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: statusColor('seed') }} />
          种子（新知识）
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: statusColor('growing') }} />
          生长中
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: statusColor('mature') }} />
          成熟
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: statusColor('wilted') }} />
          枯萎
        </span>
        <span className="flex items-center gap-1">
          <span className="h-0.5 w-6 rounded bg-slate-400" />
          相似度越高线越粗
        </span>
        <span className="flex items-center gap-1">
          <span className="h-0.5 w-6 rounded bg-amber-500" />
          最短路径高亮
        </span>
      </div>
    </div>
  );
}
