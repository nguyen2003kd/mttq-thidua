import type ExcelJS from 'exceljs-hardened';

/**
 * Compatibility adapter for the limited SheetJS features used by this application.
 * All XLSX parsing and writing goes through the security-hardened ExcelJS fork.
 */
export interface CellObject {
  t?: string;
  v?: string | number | boolean;
  w?: string;
  s?: Record<string, unknown>;
}
export interface CellRange { s: { r: number; c: number }; e: { r: number; c: number } }
export type WorkSheet = Record<string, unknown> & {
  '!ref'?: string;
  '!cols'?: { wch?: number; wpx?: number }[];
  '!rows'?: { hpt?: number; hpx?: number }[];
  '!merges'?: CellRange[];
};
export interface WorkBook {
  SheetNames: string[];
  Sheets: Record<string, WorkSheet>;
  Workbook?: { Views?: { activeTab?: number }[] };
}

function columnLabel(columnIndex: number): string {
  let index = columnIndex + 1;
  let result = '';
  while (index > 0) {
    index -= 1;
    result = String.fromCharCode(65 + index % 26) + result;
    index = Math.floor(index / 26);
  }
  return result;
}

function columnIndex(label: string): number {
  let result = 0;
  for (const char of label) result = result * 26 + char.charCodeAt(0) - 64;
  return result - 1;
}

function encode_cell({ r, c }: { r: number; c: number }): string {
  return columnLabel(c) + String(r + 1);
}

function decode_cell(address: string) {
  const match = /^([A-Z]+)([1-9]\d*)$/.exec(address);
  if (!match) throw new Error('Địa chỉ ô Excel không hợp lệ.');
  return { c: columnIndex(match[1]), r: Number(match[2]) - 1 };
}

function encode_range(range: CellRange): string {
  return encode_cell(range.s) + ':' + encode_cell(range.e);
}

function decode_range(ref: string): CellRange {
  const [first, last = first] = ref.split(':');
  return { s: decode_cell(first), e: decode_cell(last) };
}

function aoa_to_sheet(data: (string | number | boolean)[][]): WorkSheet {
  const sheet: WorkSheet = {};
  let maxCol = 0;
  for (let r = 0; r < data.length; r += 1) {
    for (let c = 0; c < data[r].length; c += 1) {
      maxCol = Math.max(maxCol, c);
      sheet[encode_cell({ r, c })] = {
        t: typeof data[r][c] === 'number' ? 'n' : 's',
        v: data[r][c],
      } satisfies CellObject;
    }
  }
  if (data.length > 0) sheet['!ref'] = encode_range({ s: { r: 0, c: 0 }, e: { r: data.length - 1, c: maxCol } });
  return sheet;
}

function book_new(): WorkBook {
  return { SheetNames: [], Sheets: Object.create(null) as Record<string, WorkSheet> };
}

function book_append_sheet(book: WorkBook, sheet: WorkSheet, name: string): void {
  if (book.SheetNames.includes(name)) throw new Error('Trùng tên trang tính.');
  book.SheetNames.push(name);
  book.Sheets[name] = sheet;
}

function sheet_to_json<T = unknown[]>(sheet: WorkSheet, _options?: { header?: number; defval?: string; raw?: boolean }): T[] {
  if (!sheet['!ref']) return [];
  const range = decode_range(sheet['!ref']);
  // Guard against maliciously huge sheet dimensions.
  if (range.e.r > 10_000 || range.e.c > 100) throw new Error('Bảng tính có quá nhiều dòng hoặc cột.');
  const rows: unknown[][] = [];
  for (let r = range.s.r; r <= range.e.r; r += 1) {
    const row: unknown[] = [];
    for (let c = range.s.c; c <= range.e.c; c += 1) {
      row.push((sheet[encode_cell({ r, c })] as CellObject | undefined)?.v ?? '');
    }
    rows.push(row);
  }
  return rows as T[];
}

function parse_date_code(serial: number) {
  if (!Number.isFinite(serial) || serial < 0 || serial > 3_000_000) return null;
  const date = new Date(Date.UTC(1899, 11, 30) + Math.round(serial * 86_400_000));
  return {
    y: date.getUTCFullYear(),
    m: date.getUTCMonth() + 1,
    d: date.getUTCDate(),
    H: date.getUTCHours(),
    M: date.getUTCMinutes(),
  };
}

function csvToBook(buffer: ArrayBuffer): WorkBook {
  if (buffer.byteLength > 5 * 1024 * 1024) throw new Error('File CSV vượt quá dung lượng xem trước.');
  const content = new TextDecoder('utf-8').decode(buffer).replace(/^\uFEFF/, '');
  const data: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  let truncated = false;
  for (let i = 0; i < content.length; i += 1) {
    const ch = content[i];
    if (ch === '"') {
      if (quoted && content[i + 1] === '"') { field += '"'; i += 1; }
      else if (quoted || field.length === 0) quoted = !quoted;
      else field += ch;
    } else if (ch === ',' && !quoted) {
      row.push(field); field = '';
      if (row.length > 100) throw new Error('File CSV có quá nhiều cột.');
    } else if ((ch === '\n' || ch === '\r') && !quoted) {
      if (ch === '\r' && content[i + 1] === '\n') i += 1;
      row.push(field);
      data.push(row);
      row = []; field = '';
      if (data.length >= 301) { truncated = true; break; }
    } else {
      field += ch;
      if (field.length > 20_000) throw new Error('Ô CSV quá dài để xem trước.');
    }
  }
  if (!truncated && (field !== '' || row.length > 0)) data.push([...row, field]);
  const sheet = aoa_to_sheet(data);
  if (truncated && sheet['!ref']) {
    const range = decode_range(sheet['!ref']);
    sheet['!ref'] = encode_range({ s: range.s, e: { r: 301, c: range.e.c } });
  }
  const book = book_new();
  book_append_sheet(book, sheet, 'CSV');
  return book;
}

function excelValue(value: ExcelJS.CellValue): string | number | boolean {
  if (value == null) return '';
  if (value instanceof Date) return (value.getTime() - Date.UTC(1899, 11, 30)) / 86_400_000;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value;
  if ('result' in value && value.result != null) return excelValue(value.result as ExcelJS.CellValue);
  if ('text' in value && typeof value.text === 'string') return value.text;
  if ('richText' in value) return value.richText.map((part) => part.text).join('');
  return '';
}

async function read(buffer: ArrayBuffer, options?: { format?: 'csv'; type?: string; cellStyles?: boolean }): Promise<WorkBook> {
  if (options?.format === 'csv') return csvToBook(buffer);
  if (buffer.byteLength > 20 * 1024 * 1024) throw new Error('Tệp Excel vượt quá 20 MB.');
  const { default: ExcelJSRuntime } = await import('exceljs-hardened');
  const workbook = new ExcelJSRuntime.Workbook();
  await workbook.xlsx.load(new Uint8Array(buffer) as unknown as Parameters<typeof workbook.xlsx.load>[0]);
  const result = book_new();
  workbook.eachSheet((ws) => {
    if (ws.rowCount > 10_000 || ws.columnCount > 100) throw new Error('Bảng tính có quá nhiều dòng hoặc cột.');
    const sheet: WorkSheet = {};
    if (options?.cellStyles) {
      sheet['!cols'] = ws.columns.map((col) => ({ wch: Math.max(8, Math.min(80, col.width ?? 16)) }));
      sheet['!rows'] = Array.from({ length: ws.rowCount }, (_, index) => ({
        hpt: ws.getRow(index + 1).height,
      }));
      const rawMerges = ws.model.merges ?? [];
      if (rawMerges.length > 1000) throw new Error('Bảng tính có quá nhiều vùng gộp.');
      sheet['!merges'] = rawMerges.map(decode_range);
    }
    ws.eachRow({ includeEmpty: false }, (row, rowIndex) => {
      row.eachCell({ includeEmpty: false }, (cell, colIndex) => {
        const value = excelValue(cell.value);
        const converted: CellObject = {
          t: typeof value === 'number' ? 'n' : 's',
          v: value,
        };
        if (options?.cellStyles) {
          const style: Record<string, unknown> = {};
          const fill = cell.fill as { type?: string; pattern?: string; fgColor?: unknown } | undefined;
          if (fill?.type === 'pattern' && fill.fgColor) {
            style.patternType = fill.pattern ?? 'solid';
            style.fgColor = fill.fgColor;
          }
          if (cell.font) style.font = cell.font;
          if (cell.alignment) style.alignment = cell.alignment;
          if (Object.keys(style).length) converted.s = style;
          if (cell.value instanceof Date) {
            const date = cell.value;
            const pad = (part: number) => String(part).padStart(2, '0');
            const day = pad(date.getUTCDate());
            const month = pad(date.getUTCMonth() + 1);
            const year = date.getUTCFullYear();
            const time = pad(date.getUTCHours()) + ':' + pad(date.getUTCMinutes());
            converted.w = day + '/' + month + '/' + year + (time !== '00:00' ? ' ' + time : '');
          }
        }
        sheet[encode_cell({ r: rowIndex - 1, c: colIndex - 1 })] = converted;
      });
    });
    if (ws.rowCount > 0) sheet['!ref'] = encode_range({
      s: { r: 0, c: 0 },
      e: { r: ws.rowCount - 1, c: Math.max(0, ws.columnCount - 1) },
    });
    book_append_sheet(result, sheet, ws.name);
  });
  return result;
}

function toArgb(rgb: string): string {
  return rgb.length === 6 ? 'FF' + rgb : rgb;
}

function convertStyle(style: Record<string, unknown>): Partial<ExcelJS.Style> {
  const source = style as {
    fill?: { fgColor?: { rgb?: string }; patternType?: string };
    font?: { bold?: boolean; italic?: boolean; color?: { rgb?: string }; sz?: number };
    alignment?: ExcelJS.Alignment;
    border?: Record<string, { style?: string; color?: { rgb?: string } }>;
  };
  const result: Partial<ExcelJS.Style> = {};
  if (source.fill?.fgColor?.rgb) result.fill = {
    type: 'pattern', pattern: 'solid', fgColor: { argb: toArgb(source.fill.fgColor.rgb) },
  };
  if (source.font) result.font = {
    bold: source.font.bold,
    italic: source.font.italic,
    size: source.font.sz,
    color: source.font.color?.rgb ? { argb: toArgb(source.font.color.rgb) } : undefined,
  };
  if (source.alignment) result.alignment = source.alignment;
  if (source.border) {
    const border: Partial<ExcelJS.Borders> = {};
    for (const edge of ['top', 'bottom', 'left', 'right'] as const) {
      const b = source.border[edge];
      if (b?.style) border[edge] = {
        style: b.style as ExcelJS.BorderStyle,
        color: b.color?.rgb ? { argb: toArgb(b.color.rgb) } : undefined,
      };
    }
    result.border = border;
  }
  return result;
}

async function writeFile(book: WorkBook, fileName: string): Promise<void> {
  const { default: ExcelJSRuntime } = await import('exceljs-hardened');
  const workbook = new ExcelJSRuntime.Workbook();
  for (const name of book.SheetNames) {
    const source = book.Sheets[name];
    const sheet = workbook.addWorksheet(name);
    for (const [index, column] of (source['!cols'] ?? []).entries()) {
      sheet.getColumn(index + 1).width = column.wch ?? (column.wpx ? column.wpx / 7.5 : 12);
    }
    for (const [index, row] of (source['!rows'] ?? []).entries()) {
      if (row.hpt || row.hpx) sheet.getRow(index + 1).height = row.hpt ?? (row.hpx! * 0.75);
    }
    for (const [address, value] of Object.entries(source)) {
      if (!/^[A-Z]+[1-9]\d*$/.test(address)) continue;
      const input = value as CellObject;
      const cell = sheet.getCell(address);
      if (input.v !== undefined) cell.value = input.v;
      if (input.s) cell.style = convertStyle(input.s);
    }
    for (const merge of source['!merges'] ?? []) sheet.mergeCells(encode_range(merge));
  }
  const output = await workbook.xlsx.writeBuffer();
  const blob = new Blob([new Uint8Array(output)], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = href;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(href), 1000);
}

export const utils = { encode_cell, encode_range, decode_range, aoa_to_sheet, book_new, book_append_sheet, sheet_to_json };
export const SSF = { parse_date_code };
export { read, writeFile };
