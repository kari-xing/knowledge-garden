import * as d3 from 'd3';
import type { GraphLink, GraphNode } from '../../types';
import { statusColor } from '../../utils/color';

/** 图谱画布节点（d3 模拟节点） */
export interface CanvasNode extends d3.SimulationNodeDatum {
  id: string;
  title: string | null;
  status: string;
  color: string;
  radius: number;
  degree: number;
  summary: string | null;
}

/** 图谱画布边 */
export interface CanvasLink extends d3.SimulationLinkDatum<CanvasNode> {
  similarity_score: number;
  reason?: string | null;
  isPath?: boolean;
}

/**
 * 将后端图谱数据转换为 d3 力导向图数据结构（纯函数）。
 * pathKeySet：最短路径边的 "minId|maxId" 集合，用于高亮。
 */
export function buildSimData(
  nodes: GraphNode[],
  links: GraphLink[],
  pathKeySet?: Set<string>,
): { simNodes: CanvasNode[]; simLinks: CanvasLink[] } {
  const simNodes: CanvasNode[] = nodes.map((n) => ({
    id: n.id,
    title: n.title,
    status: n.status,
    summary: n.summary,
    degree: n.degree,
    color: n.color || statusColor(n.status),
    radius: 6 + Math.min(Math.sqrt(n.degree + 1) * 3.2, 16),
  }));
  const ids = new Set(simNodes.map((n) => n.id));
  const simLinks: CanvasLink[] = links
    .filter((l) => ids.has(l.source) && ids.has(l.target))
    .map((l) => ({
      source: l.source,
      target: l.target,
      similarity_score: l.similarity_score,
      reason: l.reason,
      isPath:
        pathKeySet?.has([l.source, l.target].sort().join('|')) ?? false,
    }));
  return { simNodes, simLinks };
}

/** 创建力导向模拟（纯函数） */
export function createSimulation(
  simNodes: CanvasNode[],
  simLinks: CanvasLink[],
  width: number,
  height: number,
): d3.Simulation<CanvasNode, undefined> {
  return (
    d3
      .forceSimulation<CanvasNode>(simNodes)
      .force(
        'link',
        d3
          .forceLink<CanvasNode, CanvasLink>(simLinks)
          .id((d) => d.id)
          .distance((l) => 60 + (1 - l.similarity_score) * 140),
      )
      .force('charge', d3.forceManyBody().strength(-360))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force(
        'collide',
        d3
          .forceCollide<CanvasNode>()
          .radius((d) => d.radius + 16)
          .iterations(2),
      )
  );
}

/** 无向边 key（排序拼接，用于路径高亮匹配） */
export function linkKey(a: string, b: string): string {
  return [a, b].sort().join('|');
}
