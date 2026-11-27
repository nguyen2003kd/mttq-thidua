import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import ExcelJS from 'exceljs-hardened';
import JSZip from 'jszip';
import type { ReactNode } from 'react';
import { FilePreviewDialog } from './FilePreviewDialog';

const mockFiles = vi.hoisted(() => ({
  get: vi.fn(),
  getFileBlob: vi.fn(),
  downloadFile: vi.fn(),
}));

vi.mock('@/features/files/api/filesApi', () => ({
  filesApi: { get: mockFiles.get },
  getFileBlob: mockFiles.getFileBlob,
  downloadFile: mockFiles.downloadFile,
  getFilesApiError: (error: unknown) => error instanceof Error ? error.message : 'Lỗi tải file',
}));

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ open, children }: { open: boolean; children: ReactNode }) => open ? <div>{children}</div> : null,
  DialogContent: ({ children }: { children: ReactNode }) => <div role="dialog">{children}</div>,
  DialogHeader: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock('./Button', () => ({
  Button: ({ children, onClick }: { children: ReactNode; onClick?: () => void }) => <button onClick={onClick}>{children}</button>,
}));

async function docxBlob(): Promise<Blob> {
  const zip = new JSZip();
  zip.file('[Content_Types].xml', '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
  zip.file('_rels/.rels', '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
  zip.file('word/document.xml', '<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Xem minh chứng thành công</w:t></w:r></w:p><w:sectPr/></w:body></w:document>');
  const bytes = await zip.generateAsync({ type: 'arraybuffer' });
  const blob = new Blob([bytes]);
  Object.defineProperty(blob, 'arrayBuffer', { value: async () => bytes });
  return blob;
}

describe('FilePreviewDialog for authenticated files', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true, writable: true, value: vi.fn(() => 'blob:authorized-file'),
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true, writable: true, value: vi.fn(),
    });
  });
  afterEach(() => cleanup());

  it('previews a private PDF using the authenticated API instead of its storage URL', async () => {
    mockFiles.get.mockResolvedValue({ originalName: 'minh-chung.pdf', extension: '.pdf', mimeType: 'application/pdf', url: 'https://private-storage.example/file' });
    mockFiles.getFileBlob.mockResolvedValue(new Blob(['%PDF-1.7\nhello'], { type: 'application/pdf' }));
    render(<FilePreviewDialog file={{ id: 'pdf1', originalName: 'minh-chung.pdf' }} onOpenChange={vi.fn()} />);
    await waitFor(() => expect(screen.getByTitle('minh-chung.pdf').getAttribute('src')).toBe('blob:authorized-file'));
    expect(mockFiles.getFileBlob).toHaveBeenCalled();
  });

  it('renders a DOCX locally in a sandboxed iframe', async () => {
    mockFiles.get.mockResolvedValue({ originalName: 'minh-chung.docx', extension: '.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', url: null });
    mockFiles.getFileBlob.mockResolvedValue(await docxBlob());
    render(<FilePreviewDialog file={{ id: 'docx1', originalName: 'minh-chung.docx' }} onOpenChange={vi.fn()} />);
    await waitFor(() => expect(screen.getByTitle('minh-chung.docx').getAttribute('srcdoc')).toContain('Xem minh chứng thành công'));
    expect(screen.getByTitle('minh-chung.docx').getAttribute('sandbox')).toBe('');
  });

  it('renders a protected XLSX as an in-app table without Office Online', async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Tổng hợp');
    sheet.addRow(['Xã phường', 'Điểm']);
    sheet.addRow(['Xuân Lộc', 95]);
    const bytes = await workbook.xlsx.writeBuffer();
    const blob = new Blob([new Uint8Array(bytes)]);
    Object.defineProperty(blob, 'arrayBuffer', { value: async () => new Uint8Array(bytes).buffer });
    mockFiles.get.mockResolvedValue({ originalName: 'diem.xlsx', extension: '.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', url: null });
    mockFiles.getFileBlob.mockResolvedValue(blob);
    render(<FilePreviewDialog file={{ id: 'excel1', originalName: 'diem.xlsx' }} onOpenChange={vi.fn()} />);
    await waitFor(() => expect(screen.getByText('Xuân Lộc')).toBeTruthy());
    expect(screen.getByText('95')).toBeTruthy();
    expect(screen.queryByTitle('diem.xlsx')).toBeNull();
  });

  it('shows a clear message for unsupported old Office formats', async () => {
    mockFiles.get.mockResolvedValue({ originalName: 'old.xls', extension: '.xls', mimeType: 'application/vnd.ms-excel', url: null });
    render(<FilePreviewDialog file={{ id: 'old1', originalName: 'old.xls' }} onOpenChange={vi.fn()} />);
    expect(await screen.findByText(/Chưa hỗ trợ xem trực tiếp định dạng/)).toBeTruthy();
    expect(mockFiles.getFileBlob).not.toHaveBeenCalled();
  });
});
