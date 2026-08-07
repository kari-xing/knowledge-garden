import { useRef, useState } from 'react';
import Modal from './Modal';
import { importPdf, importTextFiles } from '../../api/import';
import { useUiStore } from '../../stores/uiStore';

interface ImportModalProps {
  open: boolean;
  onClose: () => void;
}

/** 多格式导入：PDF（≤20MB）/ txt / md */
export default function ImportModal({ open, onClose }: ImportModalProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const toast = useUiStore((s) => s.toast);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setBusy(true);
    try {
      const pdfs = Array.from(files).filter((f) =>
        /\.pdf$/i.test(f.name),
      );
      const texts = Array.from(files).filter((f) =>
        /\.(md|txt)$/i.test(f.name),
      );
      let created = 0;
      let failed = 0;
      if (pdfs.length > 0) {
        for (const pdf of pdfs) {
          if (pdf.size > 20 * 1024 * 1024) {
            toast(`「${pdf.name}」超过 20MB，已跳过`, 'error');
            failed += 1;
            continue;
          }
          try {
            const r = await importPdf(pdf);
            created += r.created;
            failed += r.failed;
          } catch {
            failed += 1;
          }
        }
      }
      if (texts.length > 0) {
        try {
          const r = await importTextFiles(texts);
          created += r.created;
          failed += r.failed;
        } catch (e) {
          toast((e as Error).message, 'error');
        }
      }
      if (created > 0) {
        toast(`📥 成功导入 ${created} 篇笔记，AI 流水线已触发`, 'success');
        onClose();
      }
      if (failed > 0) toast(`${failed} 篇导入失败`, 'error');
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="📥 导入笔记">
      <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
        支持 <b>PDF</b>（≤20MB，自动提取文本）、<b>Markdown</b> 与{' '}
        <b>txt</b> 纯文本，可多选。导入后自动进入 AI 处理流水线。
      </p>
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50/40 py-10 transition-colors hover:border-emerald-400 hover:bg-emerald-50 dark:border-slate-600 dark:bg-slate-700/30 dark:hover:border-emerald-500">
        <span className="text-4xl">🗂️</span>
        <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
          {busy ? '导入中…' : '点击选择文件'}
        </span>
        <input
          ref={fileRef}
          type="file"
          multiple
          accept=".pdf,.md,.txt,application/pdf,text/markdown,text/plain"
          className="hidden"
          onChange={(e) => void handleFiles(e.target.files)}
        />
      </label>
    </Modal>
  );
}
