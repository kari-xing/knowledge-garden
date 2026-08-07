import { useQuery } from '@tanstack/react-query';
import { useRef } from 'react';
import { getNote } from '../api/notes';

/**
 * 笔记详情 + AI 处理状态轮询。
 * 当 processing_status ∈ {pending, processing} 时每 3s 自动刷新，
 * 完成后停止轮询并回调。
 */
export function useNoteProcessing(
  id: string,
  onDone?: () => void,
  options?: { enabled?: boolean },
) {
  const query = useQuery({
    queryKey: ['note', id],
    queryFn: () => getNote(id),
    enabled: options?.enabled ?? Boolean(id),
    refetchInterval: (q) => {
      const status = q.state.data?.note?.processing_status;
      return status === 'pending' || status === 'processing' ? 3000 : false;
    },
  });

  const prevStatus = usePrevious(query.data?.note.processing_status);
  if (
    onDone &&
    query.data &&
    prevStatus &&
    prevStatus !== 'done' &&
    query.data.note.processing_status === 'done'
  ) {
    onDone();
  }

  return query;
}

function usePrevious<T>(value: T | undefined): T | undefined {
  const ref = useRef<T | undefined>(undefined);
  const result = ref.current;
  ref.current = value;
  return result;
}
