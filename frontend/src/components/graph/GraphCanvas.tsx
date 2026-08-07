import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import type { GraphLink, GraphNode } from '../../types';
import {
  buildSimData,
  createSimulation,
  type CanvasNode,
} from './useForceGraph';

interface GraphCanvasProps {
  nodes: GraphNode[];
  links: GraphLink[];
  /** 最短路径边 key 集合 */
  pathKeys?: Set<string>;
  /** 选中的节点 id 集合（路径探索等） */
  selectedIds?: Set<string>;
  /** 点击节点回调；传空字符串表示点击空白处 */
  onNodeClick?: (id: string) => void;
  className?: string;
}

/** D3 力导向图画布：力模拟 / 缩放 / 拖拽 / 悬浮提示 */
export default function GraphCanvas({
  nodes,
  links,
  pathKeys,
  selectedIds,
  onNodeClick,
  className,
}: GraphCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipPos = useRef({ x: 0, y: 0 });
  const [hovered, setHovered] = useState<CanvasNode | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const width = Math.max(rect.width, 480);
    const height = Math.max(rect.height, 420);

    container.innerHTML = '';
    const { simNodes, simLinks } = buildSimData(nodes, links, pathKeys);

    const svg = d3
      .select(container)
      .append('svg')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('viewBox', `0 0 ${width} ${height}`);
    const g = svg.append('g');

    // 边
    const linkSel = g
      .append('g')
      .selectAll('line')
      .data(simLinks)
      .join('line')
      .attr('stroke', (d) => (d.isPath ? '#f59e0b' : '#94a3b8'))
      .attr('stroke-width', (d) => Math.max(1, d.similarity_score * 4))
      .attr('stroke-opacity', (d) => (d.isPath ? 1 : 0.4))
      .attr('stroke-linecap', 'round');

    let sim: d3.Simulation<CanvasNode, undefined> | null = null;

    // 节点（先建，供 drag 闭包引用 sim）
    const nodeSel = g
      .append('g')
      .selectAll<SVGGElement, CanvasNode>('g')
      .data(simNodes)
      .join('g')
      .call(
        d3
          .drag<SVGGElement, CanvasNode>()
          .on('start', (event, d) => {
            if (!event.active) sim?.alphaTarget(0.25).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on('drag', (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on('end', (event, d) => {
            if (!event.active) sim?.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          }),
      );

    nodeSel
      .append('circle')
      .attr('r', (d) => d.radius)
      .attr('fill', (d) => d.color)
      .attr('fill-opacity', (d) => (d.status === 'wilted' ? 0.45 : 0.9))
      .attr('stroke', (d) => (selectedIds?.has(d.id) ? '#0f172a' : '#ffffff'))
      .attr('stroke-width', (d) => (selectedIds?.has(d.id) ? 3 : 1.5))
      .attr('cursor', 'pointer');

    // 种子节点：虚线光环
    nodeSel
      .filter((d) => d.status === 'seed')
      .append('circle')
      .attr('r', (d) => d.radius + 6)
      .attr('fill', 'none')
      .attr('stroke', '#f59e0b')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '3 3')
      .style('opacity', 0.7);

    nodeSel
      .append('text')
      .attr('dy', (d) => d.radius + 13)
      .attr('text-anchor', 'middle')
      .attr('class',
        'pointer-events-none select-none fill-slate-600 text-[10px] dark:fill-slate-300')
      .text((d) => {
        const t = d.title || '';
        return t.length > 8 ? `${t.slice(0, 8)}…` : t;
      });

    nodeSel
      .on('click', (event, d) => {
        event.stopPropagation();
        onNodeClick?.(d.id);
      })
      .on('mouseover', (event, d) => {
        const [x, y] = d3.pointer(event, container);
        tooltipPos.current = { x, y };
        setHovered(d);
      })
      .on('mousemove', (event) => {
        const [x, y] = d3.pointer(event, container);
        tooltipPos.current = { x, y };
      })
      .on('mouseout', () => setHovered(null));

    // 点击空白清空选择
    svg.on('click', () => onNodeClick?.(''));

    // 力导向模拟
    sim = createSimulation(simNodes, simLinks, width, height).on('tick', () => {
      linkSel
        .attr('x1', (d) => (d.source as CanvasNode).x ?? 0)
        .attr('y1', (d) => (d.source as CanvasNode).y ?? 0)
        .attr('x2', (d) => (d.target as CanvasNode).x ?? 0)
        .attr('y2', (d) => (d.target as CanvasNode).y ?? 0);
      nodeSel.attr('transform', (d) => `translate(${d.x ?? 0},${d.y ?? 0})`);
    });

    // 缩放
    svg.call(
      d3
        .zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.2, 5])
        .on('zoom', (event) => g.attr('transform', event.transform)),
    );

    return () => {
      sim?.stop();
    };
  }, [nodes, links, pathKeys, selectedIds, onNodeClick]);

  return (
    <div className={`relative overflow-hidden ${className ?? ''}`}>
      <div ref={containerRef} className="h-full w-full" />
      {hovered && (
        <div
          className="pointer-events-none absolute z-10 max-w-xs rounded-xl border border-emerald-100 bg-white/95 p-3 shadow-lg backdrop-blur dark:border-slate-600 dark:bg-slate-800/95"
          style={{ left: tooltipPos.current.x + 12, top: tooltipPos.current.y + 12 }}
        >
          <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            {hovered.title || '未命名'}
          </div>
          {hovered.summary && (
            <div className="mt-0.5 line-clamp-3 text-xs text-slate-500 dark:text-slate-400">
              {hovered.summary}
            </div>
          )}
          <div className="mt-1 text-[11px] text-slate-400">
            关联度 {hovered.degree} · 状态 {hovered.status}
          </div>
        </div>
      )}
    </div>
  );
}
