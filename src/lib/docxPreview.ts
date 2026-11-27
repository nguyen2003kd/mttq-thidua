import DOMPurify from 'dompurify';

/** Sanitize converted DOCX HTML; the result is rendered inside a script-free sandboxed iframe. */
export function sanitizeDocxHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'style', 'svg', 'math'],
    FORBID_ATTR: ['srcset'],
  });
}

export function buildDocxPreviewDocument(safeHtml: string): string {
  // Script execution and access to the parent are blocked by the iframe sandbox.
  const css = [
    'html,body{margin:0;background:#edf0f4;color:#20242a;font:15px/1.65 Arial,sans-serif}',
    'article{box-sizing:border-box;max-width:850px;min-height:100%;margin:20px auto;padding:40px 48px;background:#fff;box-shadow:0 2px 10px #0001;overflow-wrap:break-word}',
    'table{border-collapse:collapse;width:100%;margin:12px 0}',
    'td,th{border:1px solid #cbd5e1;padding:6px 9px;vertical-align:top}',
    'img{max-width:100%;height:auto}',
    'p{margin:.4em 0 .8em}',
    'h1,h2,h3,h4{line-height:1.35}',
    '@media(max-width:700px){article{margin:0;padding:20px 16px}}',
  ].join('');
  return [
    '<!doctype html><html lang="vi"><head><meta charset="utf-8">',
    '<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; img-src data: blob:; style-src \'unsafe-inline\'; font-src data:; base-uri \'none\'; form-action \'none\';">',
    '<style>', css, '</style></head><body><article>', safeHtml, '</article></body></html>',
  ].join('');
}

/**
 * Convert an authenticated DOCX Blob locally. No document bytes or private URL
 * are sent to a third-party document viewer.
 */
export async function prepareDocxPreview(blob: Blob): Promise<string> {
  if (!blob.size || blob.size > 20 * 1024 * 1024) {
    throw new Error('Tệp DOCX trống hoặc vượt quá giới hạn xem trước 20 MB.');
  }
  const { default: mammoth } = await import('mammoth');
  const arrayBuffer = await blob.arrayBuffer();
  // The browser entry reads arrayBuffer; the Node entry (used by tests) reads buffer.
  const input = { arrayBuffer, buffer: new Uint8Array(arrayBuffer) };
  const { value } = await mammoth.convertToHtml(
    input as unknown as Parameters<typeof mammoth.convertToHtml>[0],
    { externalFileAccess: false },
  );
  if (value.length > 12 * 1024 * 1024) {
    throw new Error('Nội dung DOCX quá lớn để xem trước. Vui lòng tải file về máy.');
  }
  return buildDocxPreviewDocument(sanitizeDocxHtml(value));
}
