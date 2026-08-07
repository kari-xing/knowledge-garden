import { client, unwrap } from './client';
import type { Tag, TagMergePayload, TagUpdatePayload, TagWithCount } from '../types';

export async function getTags(): Promise<TagWithCount[]> {
  return unwrap<TagWithCount[]>(client.get('/tags'));
}

export async function updateTag(
  id: string,
  payload: TagUpdatePayload,
): Promise<Tag> {
  return unwrap<Tag>(client.put(`/tags/${id}`, payload));
}

export async function deleteTag(id: string): Promise<null> {
  return unwrap<null>(client.delete(`/tags/${id}`));
}

export async function mergeTags(payload: TagMergePayload): Promise<Tag> {
  return unwrap<Tag>(client.post('/tags/merge', payload));
}
