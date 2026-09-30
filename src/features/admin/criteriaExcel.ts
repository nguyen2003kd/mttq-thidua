import * as XLSX from 'xlsx-js-style';
import type { CriteriaPayload } from '@/features/admin/api/criteriaGroupsApi';

const HEADERS = ['Nội dung', 'Điểm chuẩn', 'Điểm thưởng từng tiêu chí con', 'Ghi chú', 'Hạn nộp'];
const GROUP_NAME_HINT = 'Nhập tên nhóm tiêu chí';
const CHILD_NAME_HINT = 'Nhập tên tiêu chí con';
const TEMPLATE_HINTS = new Set([GROUP_NAME_HINT, CHILD_NAME_HINT]);
const HEADER_STYLE = {
  fill: { patternType: 'solid', fgColor: { rgb: '0072B8' } },
  font: { bold: true, color: { rgb: 'FFFFFF' } },
  alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
  border: { top: { style: 'thin', color: { rgb: '0072B8' } }, bottom: { style: 'thin', color: { rgb: '0072B8' } } },
} as const;
const GROUP_ROW_STYLE = {
  fill: { patternType: 'solid', fgColor: { rgb: 'E8F2F8' } },
  font: { bold: true, color: { rgb: '0072B8' } },
  alignment: { vertical: 'center', wrapText: true },
  border: { top: { style: 'medium', color: { rgb: '0072B8' } }, bottom: { style: 'medium', color: { rgb: '0072B8' } } },
} as const;
const CHILD_ROW_STYLE = {
  fill: { patternType: 'solid', fgColor: { rgb: 'FAF7F5' } },
  alignment: { vertical: 'center', wrapText: true },
  border: { bottom: { style: 'thin', color: { rgb: 'E7E2DE' } } },
} as const;
const CHILD_ROW_CENTERED_STYLE = {
  ...CHILD_ROW_STYLE,
  alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
} as const;

function styleRow(worksheet: XLSX.WorkSheet, row: number, columnCount: number, style: Record<string, unknown>) {
  for (let column = 0; column < columnCount; column += 1) {
    const address = XLSX.utils.encode_cell({ r: row, c: column });
    const cell = worksheet[address] as XLSX.CellObject | undefined;
    worksheet[address] = { ...(cell ?? { t: 's', v: ' ' }), s: style } as XLSX.CellObject;
  }
}

/** Căn giữa từng cột chỉ định (0-based) trong một dòng, giữ nguyên style nền/viền. */
function centerColumns(worksheet: XLSX.WorkSheet, row: number, columns: number[], style: Record<string, unknown>) {
  for (const column of columns) {
    const address = XLSX.utils.encode_cell({ r: row, c: column });
    const cell = worksheet[address] as XLSX.CellObject | undefined;
    worksheet[address] = { ...(cell ?? { t: 's', v: ' ' }), s: { ...style, alignment: { horizontal: 'center', vertical: 'center', wrapText: true } } } as XLSX.CellObject;
  }
}

export interface ParsedCriteriaExcel {
  name: string;
  maxPoint: number;
  maxBonusPoint: number;
  content: string;
  deadline: string | null;
  criteria: CriteriaPayload[];
}

const cellValue = (row: unknown[] | undefined, column: number) => row?.[column] ?? '';
const isBlank = (value: unknown) => value == null || (typeof value === 'string' && (!value.trim() || TEMPLATE_HINTS.has(value.trim())));
const toScoreUnits = (value: number) => Math.round(value * 100);

function toText(value: unknown) {
  return isBlank(value) ? '' : String(value).trim();
}

function parseScore(value: unknown, cell: string, allowZero: boolean) {
  if (isBlank(value)) throw new Error(`${cell} cần có giá trị.`);

  const score = typeof value === 'number'
    ? value
    : typeof value === 'string'
      ? Number(value.trim().replace(',', '.'))
      : Number.NaN;

  if (!Number.isFinite(score) || (allowZero ? score < 0 : score <= 0)) {
    throw new Error(`${cell} phải là số ${allowZero ? 'không âm' : 'lớn hơn 0'}.`);
  }

  return score;
}

function formatDateTime(year: number, month: number, day: number, hour: number, minute: number) {
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  const date = new Date(year, month - 1, day, hour, minute);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${String(year).padStart(4, '0')}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}`;
}

function parseDeadline(value: unknown, rowNumber: number): string | null {
  if (isBlank(value)) return null;

  if (typeof value === 'number') {
    const parts = XLSX.SSF.parse_date_code(value);
    if (!parts) throw new Error(`Hạn nộp tại dòng ${rowNumber} không hợp lệ.`);
    const hasTime = value % 1 > 0.0000001;
    const result = formatDateTime(parts.y, parts.m, parts.d, hasTime ? parts.H : 23, hasTime ? parts.M : 59);
    if (result) return result;
    throw new Error(`Hạn nộp tại dòng ${rowNumber} không hợp lệ.`);
  }

  const text = String(value).trim();
  const isoDate = text.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[T\s](\d{1,2}):(\d{2}))?/);
  const localDate = text.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})(?:[T\s](\d{1,2}):(\d{2}))?$/);
  const match = isoDate ?? localDate;
  if (match) {
    const isIso = match === isoDate;
    const year = Number(match[isIso ? 1 : 3]);
    const month = Number(match[isIso ? 2 : 2]);
    const day = Number(match[isIso ? 3 : 1]);
    const hasTime = match[4] != null;
    const result = formatDateTime(
      year,
      month,
      day,
      hasTime ? Number(match[4]) : 23,
      hasTime ? Number(match[5]) : 59,
    );
    if (result) return result;
  }

  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) {
    const hasTime = /[T\s]\d{1,2}:\d{2}/.test(text);
    const result = formatDateTime(
      parsed.getFullYear(),
      parsed.getMonth() + 1,
      parsed.getDate(),
      hasTime ? parsed.getHours() : 23,
      hasTime ? parsed.getMinutes() : 59,
    );
    if (result) return result;
  }

  throw new Error(`Hạn nộp tại dòng ${rowNumber} không hợp lệ.`);
}

function normalizeHeader(value: unknown) {
  return toText(value).toLocaleLowerCase('vi').replace(/đ/g, 'd').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ');
}

export function parseCriteriaExcelRows(rows: unknown[][]): ParsedCriteriaExcel {
  const header = rows[0] ?? [];
  const allowedHeaders = [
    ['noi dung', 'ten', 'ten tieu chi'],
    ['diem chuan'],
    ['diem thuong tung tieu chi con', 'diem thuong'],
    ['ghi chu'],
    ['han nop'],
  ];

  allowedHeaders.forEach((allowed, index) => {
    if (!allowed.includes(normalizeHeader(cellValue(header, index)))) {
      const column = String.fromCharCode(65 + index);
      throw new Error(`Tiêu đề ô ${column}1 không đúng. Vui lòng dùng mẫu Excel tải từ trang.`);
    }
  });

  const groupRow = rows[1];
  const groupName = toText(cellValue(groupRow, 0));
  if (!groupName) throw new Error('Ô A2 cần có tên nhóm tiêu chí.');

  const maxPoint = parseScore(cellValue(groupRow, 1), 'Điểm chuẩn tổng tại ô B2', false);
  const maxBonusPoint = parseScore(cellValue(groupRow, 2), 'Điểm thưởng tổng tại ô C2', true);
  const deadline = parseDeadline(cellValue(groupRow, 4), 2);
  const content = toText(cellValue(groupRow, 3));
  const childRows = rows.slice(2)
    .map((row, index) => ({ row, rowNumber: index + 3 }))
    .filter(({ row }) => row.slice(0, 5).some((value) => !isBlank(value)));

  if (childRows.length === 0) throw new Error('Tệp Excel cần có ít nhất một tiêu chí con từ dòng 3 trở đi.');

  const criteria = childRows.map(({ row, rowNumber }) => {
    const name = toText(cellValue(row, 0));
    if (!name) throw new Error(`Ô A${rowNumber} cần có tên tiêu chí con.`);

    return {
      type: 'Standard' as const,
      content: name,
      maxPoint: parseScore(cellValue(row, 1), `Điểm chuẩn tại ô B${rowNumber}`, false),
      maxBonusPoint: parseScore(cellValue(row, 2), `Điểm thưởng tại ô C${rowNumber}`, true),
      note: toText(cellValue(row, 3)) || undefined,
      deadline: parseDeadline(cellValue(row, 4), rowNumber),
    };
  });

  const childPointTotal = criteria.reduce((total, item) => total + item.maxPoint, 0);
  if (toScoreUnits(childPointTotal) !== toScoreUnits(maxPoint)) {
    throw new Error(`Điểm chuẩn tổng tại ô B2 (${maxPoint}) không bằng tổng điểm chuẩn của tiêu chí con (${childPointTotal}).`);
  }

  const childBonusTotal = criteria.reduce((total, item) => total + item.maxBonusPoint, 0);
  if (toScoreUnits(childBonusTotal) !== toScoreUnits(maxBonusPoint)) {
    throw new Error(`Điểm thưởng tổng tại ô C2 (${maxBonusPoint}) không bằng tổng điểm thưởng của tiêu chí con (${childBonusTotal}).`);
  }

  // Hạn nộp của tiêu chí con không được vượt quá hạn nộp của nhóm tiêu chí.
  if (deadline) {
    const groupDeadlineMs = new Date(deadline).getTime();
    for (const item of criteria) {
      if (!item.deadline) continue;
      if (new Date(item.deadline).getTime() > groupDeadlineMs) {
        throw new Error(`Hạn nộp của tiêu chí con "${item.content}" không được vượt quá hạn nộp của nhóm tiêu chí (Ô E2).`);
      }
    }
  }

  return { name: groupName, maxPoint, maxBonusPoint, content, deadline, criteria };
}

export async function parseCriteriaExcelFile(file: File) {
  if (file.size > 20 * 1024 * 1024) throw new Error('Tệp Excel không được vượt quá 20 MB.');
  if (!/\.xlsx?$/i.test(file.name)) throw new Error('Vui lòng chọn tệp Excel định dạng .xlsx hoặc .xls.');

  const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) throw new Error('Tệp Excel không có trang tính để nhập.');
  const rows = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[firstSheetName], { header: 1, defval: '', raw: true });
  return parseCriteriaExcelRows(rows);
}

export function downloadCriteriaExcelTemplate() {
  const workbook = XLSX.utils.book_new();
  const childTemplateRows = 10;
  const emptyRow = () => Array<string>(HEADERS.length).fill('');
  const worksheet = XLSX.utils.aoa_to_sheet([
    HEADERS,
    emptyRow(),
    ...Array.from({ length: childTemplateRows }, emptyRow),
  ]);
  worksheet['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: childTemplateRows + 1, c: HEADERS.length - 1 } });
  worksheet['!cols'] = [{ wch: 42 }, { wch: 16 }, { wch: 28 }, { wch: 36 }, { wch: 22 }];
  worksheet['!rows'] = [
    { hpt: 30 },
    { hpt: 32 },
    ...Array.from({ length: childTemplateRows }, () => ({ hpt: 34 })),
  ];
  styleRow(worksheet, 0, HEADERS.length, HEADER_STYLE);
  styleRow(worksheet, 1, HEADERS.length, GROUP_ROW_STYLE);
  // Cột B (Điểm chuẩn tổng), C (Điểm thưởng tổng), D (Ghi chú), E (Hạn nộp) căn giữa.
  centerColumns(worksheet, 1, [1, 2, 3, 4], GROUP_ROW_STYLE);
  for (let row = 2; row < childTemplateRows + 2; row += 1) {
    styleRow(worksheet, row, HEADERS.length, CHILD_ROW_STYLE);
    // Cột B (Điểm chuẩn), C (Điểm thưởng), D (Ghi chú), E (Hạn nộp) căn giữa.
    centerColumns(worksheet, row, [1, 2, 3, 4], CHILD_ROW_CENTERED_STYLE);
  }
  worksheet.A2 = { t: 's', v: GROUP_NAME_HINT, s: { ...GROUP_ROW_STYLE, font: { italic: true, color: { rgb: '9CA3AF' } } } };
  worksheet.A3 = { t: 's', v: CHILD_NAME_HINT, s: { ...CHILD_ROW_STYLE, font: { italic: true, color: { rgb: '9CA3AF' } } } };
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Bảng tiêu chí');

  const guide = XLSX.utils.aoa_to_sheet([
    ['Hướng dẫn nhập nhóm tiêu chí'],
    ['Giữ nguyên tiêu đề cột ở dòng 1 của trang tính “Bảng tiêu chí”.'],
    ['Dòng 2 có nền xanh nhạt: thay chữ mờ tại A2 bằng tên nhóm; các ô B2:E2 là thông tin tổng của nhóm.'],
    ['Dòng 3 có chữ mờ tại A3: thay bằng tiêu chí con đầu tiên; từ dòng 3 trở đi, mỗi dòng là một tiêu chí con.'],
    ['Tổng điểm chuẩn tại B2 phải bằng tổng cột B từ dòng 3 trở đi.'],
    ['Tổng điểm thưởng tại C2 phải bằng tổng cột C từ dòng 3 trở đi.'],
    ['Kỳ thi đua và ban xử lý được chọn trên màn hình sau khi đọc tệp Excel.'],
  ]);
  guide['!cols'] = [{ wch: 100 }];
  styleRow(guide, 0, 1, HEADER_STYLE);
  styleRow(guide, 2, 1, GROUP_ROW_STYLE);
  styleRow(guide, 3, 1, CHILD_ROW_STYLE);
  XLSX.utils.book_append_sheet(workbook, guide, 'Hướng dẫn');
  XLSX.writeFile(workbook, 'Mau_nhap_nhom_tieu_chi.xlsx');
}
