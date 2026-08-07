import { client, unwrap } from './client';
import type { SearchEngine, SearchResult } from '../types';

export interface SearchQuery {
  q: string;
  tag?: string;
  engine?: SearchEngine;
  from?: string;
  to?: string;
  page?: number;
  page_size?: number;
}

export async function searchNotes(params: SearchQuery): Promise<SearchResult> {
  return unwrap<SearchResult>(client.get('/search', { params }));
}
