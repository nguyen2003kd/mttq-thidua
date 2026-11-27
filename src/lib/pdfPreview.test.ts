import { describe, expect, it } from 'vitest';
import { preparePdfPreviewBlob } from './pdfPreview';

describe('PDF preview normalization', () => {
  it('converts an authenticated PDF attachment to an embeddable PDF Blob', async () => {
    const downloaded = new Blob(['%PDF-1.7\nexample'], { type: 'application/octet-stream' });
    const preview = await preparePdfPreviewBlob(downloaded);
    expect(preview.type).toBe('application/pdf');
    expect(preview.size).toBe(downloaded.size);
  });

  it('keeps a valid PDF without copying if the MIME type is already correct', async () => {
    const downloaded = new Blob(['%PDF-1.7\nexample'], { type: 'application/pdf' });
    expect(await preparePdfPreviewBlob(downloaded)).toBe(downloaded);
  });

  it('detects an HTML error page so that the modal can show a useful error', async () => {
    const response = new Blob(['<!doctype html><title>Access denied</title>'], { type: 'text/html' });
    await expect(preparePdfPreviewBlob(response)).rejects.toThrow('PDF hợp lệ');
  });

  it('rejects a zero-byte file', async () => {
    await expect(preparePdfPreviewBlob(new Blob([]))).rejects.toThrow('PDF trống');
  });
});
