export const ALLOWED_UPLOAD_EXTENSIONS = [
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
  '.bmp',
  '.xls',
  '.xlsx',
  '.csv',
  '.doc',
  '.docx',
  '.pdf',
  '.txt',
] as const;

const allowedUploadExtensions = new Set<string>(ALLOWED_UPLOAD_EXTENSIONS);

export const ALLOWED_UPLOAD_ACCEPT = ALLOWED_UPLOAD_EXTENSIONS.join(',');
export const EXCEL_WORKBOOK_ACCEPT = '.xls,.xlsx';
export const UPLOAD_FILE_TYPE_ERROR = 'Chỉ chấp nhận ảnh, tệp Excel/CSV, Word, PDF hoặc TXT.';
export const UPLOAD_FILE_SELECTION_ERROR = 'Tệp này không đúng định dạng được chấp nhận ở mục này.';

export function getFileExtension(fileName: string): string {
  const name = fileName.replace(/\\/g, '/').split('/').pop() ?? fileName;
  const dotIndex = name.lastIndexOf('.');
  return dotIndex < 0 ? '' : name.slice(dotIndex).toLowerCase();
}

export function isAllowedUploadFileName(fileName: string): boolean {
  return allowedUploadExtensions.has(getFileExtension(fileName));
}

export function isExcelWorkbookFileName(fileName: string): boolean {
  const extension = getFileExtension(fileName);
  return extension === '.xls' || extension === '.xlsx';
}
