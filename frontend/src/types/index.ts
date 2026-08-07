/** 与后端 app/schemas/*.py 对齐的 TypeScript 类型定义 */

export type NoteStatus = 'seed' | 'growing' | 'mature' | 'wilted' | 'archived';
export type ProcessingStatus = 'pending' | 'processing' | 'done' | 'failed';
export type SearchEngine = 'mixed' | 'lexical' | 'semantic';

// ---------- 通用 ----------
export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T | null;
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

// ---------- 认证 ----------
export interface User {
  id: string;
  email: string;
  display_name: string | null;
}

export interface AuthResult {
  token: string;
  user: User;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  display_name?: string | null;
}

// ---------- 标签 ----------
export interface Tag {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface TagWithCount extends Tag {
  note_count: number;
}

export interface TagUpdatePayload {
  name?: string | null;
  color?: string | null;
}

export interface TagMergePayload {
  source_id: string;
  target_id: string;
}

// ---------- 笔记 ----------
export interface Note {
  id: string;
  user_id: string;
  title: string | null;
  content: string;
  summary: string | null;
  status: NoteStatus;
  processing_status: ProcessingStatus;
  tags: Tag[];
  last_reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface NoteCreatePayload {
  title?: string | null;
  content: string;
  summary?: string | null;
  tags?: string[];
}

export interface NoteUpdatePayload {
  title?: string | null;
  content?: string | null;
  summary?: string | null;
  tags?: string[] | null;
  reprocess?: boolean;
}

export interface NoteCreateResult {
  id: string;
  status: string;
  processing_status: string;
  job_id: string;
  message: string;
}

export interface RelatedNote {
  id: string;
  title: string | null;
  similarity: number;
  reason: string | null;
}

export interface ReviewInfo {
  stage: number;
  next_review_date: string | null;
}

export interface NoteDetail {
  note: Note;
  related: RelatedNote[];
  review: ReviewInfo | null;
}

export interface ReviewResponse {
  stage_after: number;
  next_review_date: string;
  status_after: string;
}

export interface ReprocessResult {
  id: string;
  status: string;
  processing_status: string;
  job_id: string;
  message: string;
}

// ---------- 搜索 ----------
export interface SearchHit {
  note: Note;
  score: number;
  matched_fields: string[];
  snippet: string | null;
}

export interface SearchResult {
  items: SearchHit[];
  total: number;
}

// ---------- 图谱 ----------
export interface GraphNode {
  id: string;
  title: string | null;
  status: string;
  tags: string[];
  color: string | null;
  summary: string | null;
  degree: number;
}

export interface GraphLink {
  source: string;
  target: string;
  similarity_score: number;
  reason: string | null;
}

export interface GraphPath {
  nodes: GraphNode[];
  links: GraphLink[];
  distance: number;
}

// ---------- 花园看板 ----------
export interface SeedItem {
  id: string;
  title: string | null;
  summary: string | null;
  status: string;
  created_at: string;
}

export interface WiltingItem {
  id: string;
  title: string | null;
  summary: string | null;
  last_reviewed_at: string | null;
}

export interface ReviewTodayItem {
  id: string;
  title: string | null;
  summary: string | null;
  stage: number;
  next_review_date: string;
}

export interface GardenStats {
  total_notes: number;
  total_tags: number;
  total_relations: number;
  streak_days: number;
}

export interface RelationEvent {
  id: string;
  source_title: string | null;
  target_title: string | null;
  relation_reason: string | null;
  similarity_score: number;
  created_at: string;
}

export interface TrendItem {
  date: string;
  count: number;
}

export interface Dashboard {
  seeds: SeedItem[];
  wilting: WiltingItem[];
  review_today: ReviewTodayItem[];
  stats: GardenStats;
  latest_relations: RelationEvent[];
  trend: TrendItem[];
}

// ---------- 导入 ----------
export interface ImportResult {
  created: number;
  failed: number;
  messages?: string[];
}
