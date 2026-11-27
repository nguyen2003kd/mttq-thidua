/**
 * Prepare authenticated PDF bytes for native browser preview.
 * A download endpoint may send application/octet-stream and attachment headers;
 * Blob URLs allow the browser to embed the file without exposing storage URLs.
 */
export async function preparePdfPreviewBlob(blob: Blob): Promise<Blob> {
  if (blob.size === 0) {
    throw new Error('Tệp PDF trống hoặc không tải được nội dung.');
  }

  // Detect HTML / JSON error pages returned with HTTP 200 instead of showing
  // a broken embedded document. Allow the PDF header within the first 1024 bytes.
  const header = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(new Error('Không đọc được nội dung PDF.'));
    reader.readAsText(blob.slice(0, 1024));
  });
  if (!header.includes('%PDF-')) {
    throw new Error('Máy chủ không trả về tệp PDF hợp lệ. Vui lòng kiểm tra quyền truy cập hoặc đường dẫn tệp.');
  }

  return blob.type === 'application/pdf'
    ? blob
    : new Blob([blob], { type: 'application/pdf' });
}
