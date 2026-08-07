import { client, unwrap } from './client';
import type { ImportResult } from '../types';

/** 批量导入 txt / md 文件 */
export async function importTextFiles(files: File[]): Promise<ImportResult> {
  const form = new FormData();
  files.forEach((f) => form.append('files', f));
  return unwrap<ImportResult>(
    client.post('/import/text', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  );
}

/** 导入单个 PDF（≤20MB） */
export async function importPdf(file: File): Promise<ImportResult> {
  const form = new FormData();
  form.append('file', file);
  return unwrap<ImportResult>(
    client.post('/import/pdf', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  );
}
