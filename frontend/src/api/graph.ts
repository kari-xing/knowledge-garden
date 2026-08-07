import { client, unwrap } from './client';
import type { GraphLink, GraphNode, GraphPath } from '../types';

export interface GraphNodeQuery {
  tag?: string;
  status?: string;
}

export async function getGraphNodes(
  params: GraphNodeQuery = {},
): Promise<GraphNode[]> {
  return unwrap<GraphNode[]>(client.get('/graph/nodes', { params }));
}

export async function getGraphLinks(): Promise<GraphLink[]> {
  return unwrap<GraphLink[]>(client.get('/graph/links'));
}

export async function getGraphPath(
  source: string,
  target: string,
): Promise<GraphPath> {
  return unwrap<GraphPath>(
    client.get('/graph/path', { params: { source, target } }),
  );
}
