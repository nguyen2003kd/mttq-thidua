import { useState } from 'react';
import { FileText, Paperclip } from 'lucide-react';
import { Button } from '@/components/core';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export interface ForwardingDocumentFile {
  id: string;
  originalName?: string | null;
  displayName?: string | null;
}

export interface ForwardingDocument {
  label: string;
  explanationLabel: string;
  explanation?: string | null;
  files?: ForwardingDocumentFile[];
}

export function ForwardingDocumentsDialog({ documents, onPreview }: { documents: ForwardingDocument[]; onPreview?: (file: ForwardingDocumentFile) => void }) {
  const [open, setOpen] = useState(false);
  // Chỉ xuất hiện sau khi thực sự có hồ sơ được chuyển lên ở ít nhất một cấp.
  const visibleDocuments = documents.filter((document) => document.explanation || (document.files?.length ?? 0) > 0);
  const totalFiles = visibleDocuments.reduce((total, document) => total + (document.files?.length ?? 0), 0);
  if (visibleDocuments.length === 0) return null;

  return <><Button type="button" variant="outline" onClick={() => setOpen(true)}><Paperclip className="size-4" />Hồ sơ và tệp đính kèm{totalFiles > 0 ? ` (${totalFiles} tệp)` : ''}</Button><Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[calc(100dvh-2rem)] max-w-3xl overflow-y-auto sm:max-w-3xl"><DialogHeader><DialogTitle>Hồ sơ và tệp đính kèm</DialogTitle><DialogDescription>Xem diễn giải và tệp đính kèm theo từng cấp chuyển hồ sơ.</DialogDescription></DialogHeader><div className="grid gap-3 md:grid-cols-2">{visibleDocuments.map((document) => { const files = document.files ?? []; return <section key={document.label} className="min-w-0 rounded-lg border border-primary/15 bg-primary/[0.03] p-4"><div className="flex items-center justify-between gap-2"><h3 className="text-sm font-semibold text-primary">{document.label}</h3>{files.length > 0 && <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">{files.length} tệp</span>}</div>{document.explanation && <div className="mt-3"><p className="text-xs font-medium text-muted-foreground">{document.explanationLabel}</p><p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-foreground">{document.explanation}</p></div>}{files.length > 0 && <div className="mt-4 space-y-2 border-t border-primary/15 pt-3">{files.map((file) => <button key={file.id} type="button" onClick={() => onPreview?.(file)} className="flex w-full min-w-0 items-center gap-2 rounded-md border border-primary/20 bg-card px-3 py-2 text-left text-sm text-primary transition-colors hover:bg-primary/10"><FileText className="size-4 shrink-0" /><span className="min-w-0 break-all">{file.displayName || file.originalName}</span></button>)}</div>}</section>; })}</div></DialogContent></Dialog></>;
}
