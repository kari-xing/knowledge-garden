import { client, unwrap } from './client';
import type {
  Note,
  NoteCreatePayload,
  NoteCreateResult,
  NoteDetail,
  NoteUpdatePayload,
  Page,
  ReprocessResult,
  ReviewResponse,
} from '../types';

export interface NotesQuery {
  page?: number;
  page_size?: number;
  tag?: string;
  status?: string;
  q?: string;
}

export async function getNotes(params: NotesQuery = {}): Promise<Page<Note>> {
  return unwrap<Page<Note>>(client.get('/notes', { params }));
}

export async function getNote(id: string): Promise<NoteDetail> {
  return unwrap<NoteDetail>(client.get(`/notes/${id}`));
}

export async function createNote(
  payload: NoteCreatePayload,
): Promise<NoteCreateResult> {
  return unwrap<NoteCreateResult>(client.post('/notes', payload));
}

export async function updateNote(
  id: string,
  payload: NoteUpdatePayload,
): Promise<Note> {
  return unwrap<Note>(client.put(`/notes/${id}`, payload));
}

export async function deleteNote(id: string): Promise<null> {
  return unwrap<null>(client.delete(`/notes/${id}`));
}

export async function reprocessNote(id: string): Promise<ReprocessResult> {
  return unwrap<ReprocessResult>(client.post(`/notes/${id}/reprocess`));
}

export async function reviewNote(
  id: string,
  result: 'remember' | 'fuzzy',
): Promise<ReviewResponse> {
  return unwrap<ReviewResponse>(client.post(`/notes/${id}/review`, { result }));
}
