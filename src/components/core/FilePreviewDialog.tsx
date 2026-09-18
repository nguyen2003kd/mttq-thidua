import { useEffect, useState, type CSSProperties } from 'react';
import { File as FileIcon } from 'lucide-react';
import * as XLSX from 'xlsx-js-style';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from './Button';
import { downloadFile, filesApi, type FileItemApi } from '@/features/files/api/filesApi';
import { cn } from '@/lib/utils';

export interface FilePreviewDialogProps {
  /** File cần xem — null = đóng. Chỉ bắt buộc id; metadata (mimeType/extension/url) tự fetch. */
  file: { id: string; displayName?: string | null; originalName?: string | null } | null;
  onOpenChange: (open: boolean) => void;
}

const SHEET_PREVIEW_MAX_ROWS = 300;

interface SheetCellView {
  text: string;
  colSpan: number;
  rowSpan: number;
  style: CSSProperties;
}

interface SheetRowView {
  cells: SheetCellView[];
  height?: number;
}

interface SheetView {
  name: string;
  rows: SheetRowView[];
  /** Độ rộng từng cột (px) đọc từ !cols hoặc ước lượng theo nội dung */
  colWidths: number[];
  truncated: boolean;
  /** CSV không có style sẵn — tự style dòng đầu làm header */
  headerRow?: boolean;
}

interface XlsColor {
  rgb?: string;
  argb?: string;
  theme?: number;
  tint?: number;
  indexed?: number;
}

/** Theme mặc định Office: 0-3 = lt1/dk1/lt2/dk2, 4-9 = accent1-6. */
const THEME_COLORS = ['FFFFFF', '000000', 'E7E6E6', '44546A', '4472C4', 'ED7D31', 'A5A5A5', 'FFC000', '5B9BD5', '70AD47'];

/** Bảng màu indexed chuẩn của Excel (legacy 64 màu). */
const INDEXED_COLORS = [
  '000000', 'FFFFFF', 'FF0000', '00FF00', '0000FF', 'FFFF00', 'FF00FF', '00FFFF',
  '800000', '008000', '000080', '808000', '800080', '008080', 'C0C0C0', '808080',
  '9999FF', '993366', 'FFFFCC', 'CCFFFF', '660066', 'FF8080', '0066CC', 'CCCCFF',
  '000080', 'FF00FF', 'FFFF00', '00FFFF', '800080', '800000', '008080', '0000FF',
  '00CCFF', 'CCFFFF', 'CCFFCC', 'FFFF99', '99CCFF', 'FF99CC', 'CC99FF', 'FFCC99',
  '3366FF', '33CCCC', '99CC00', 'FFCC00', 'FF9900', 'FF6600', '666699', '969696',
  '003366', '339966', '003300', '333300', '993300', '993366', '333399', '333333',
];

/** Tint của Excel: >0 pha về trắng, <0 pha về đen. */
function applyTint(hex: string, tint = 0): string {
  if (!tint) return hex;
  const ch = (v: number) => Math.max(0, Math.min(255, Math.round(tint > 0 ? v + (255 - v) * tint : v * (1 + tint))));
  return [0, 2, 4].map((i) => ch(parseInt(hex.slice(i, i + 2), 16)).toString(16).padStart(2, '0')).join('').toUpperCase();
}

/** Resolve color (rgb/argb / theme+tint / indexed) → hex RRGGBB. */
function resolveColor(color?: XlsColor): string | undefined {
  if (!color) return undefined;
  const raw = color.rgb ?? color.argb;
  if (raw && raw.length >= 6) {
    if (raw.length === 8 && raw.startsWith('00')) return undefined; // alpha 0 = trong suốt
    return raw.slice(-6).toUpperCase();
  }
  if (color.theme != null && THEME_COLORS[color.theme]) return applyTint(THEME_COLORS[color.theme], color.tint);
  if (color.indexed != null && color.indexed !== 64 && INDEXED_COLORS[color.indexed]) return INDEXED_COLORS[color.indexed];
  return undefined;
}

/** Map cell style khi đọc bằng SheetJS (chỉ trả về fill: {patternType, fgColor}) → CSS. */
function cellStyleToCss(style: unknown): CSSProperties {
  const s = style as { patternType?: string; fgColor?: XlsColor } | undefined;
  if (!s) return {};
  const css: CSSProperties = {};
  const fg = resolveColor(s.fgColor);
  if (fg && s.patternType !== 'none') css.backgroundColor = `#${fg}`;
  return css;
}

/** 0 → 'A', 25 → 'Z', 26 → 'AA'… */
function indexToColLetter(index: number): string {
  let s = '';
  let n = index + 1;
  while (n > 0) {
    const rem = (n - 1) % 26;
    s = String.fromCharCode(65 + rem) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

/** Worksheet → lưới cell + độ rộng cột để render giống Excel (merge, width, height, align). */
function sheetToRows(ws: XLSX.WorkSheet): { rows: SheetRowView[]; colWidths: number[]; truncated: boolean } {
  const ref = ws['!ref'];
  if (!ref) return { rows: [], colWidths: [], truncated: false };
  const range = XLSX.utils.decode_range(ref);
  const covered = new Set<string>();
  const merges = new Map<string, { colSpan: number; rowSpan: number }>();
  for (const m of ws['!merges'] ?? []) {
    merges.set(`${m.s.r},${m.s.c}`, { rowSpan: m.e.r - m.s.r + 1, colSpan: m.e.c - m.s.c + 1 });
    for (let r = m.s.r; r <= m.e.r; r++) {
      for (let c = m.s.c; c <= m.e.c; c++) {
        if (r !== m.s.r || c !== m.s.c) covered.add(`${r},${c}`);
      }
    }
  }
  const lastRow = Math.min(range.e.r, range.s.r + SHEET_PREVIEW_MAX_ROWS - 1);
  // Độ rộng cột: ưu tiên !cols; không có (CSV) thì ước lượng theo nội dung dài nhất
  const colWidths: number[] = [];
  for (let c = range.s.c; c <= range.e.c; c++) {
    const col = ws['!cols']?.[c];
    let w = col?.wpx ?? (col?.wch ? col.wch * 7.5 : 0);
    if (!w) {
      let maxLen = 8;
      for (let r = range.s.r; r <= lastRow; r++) {
        const cell = ws[XLSX.utils.encode_cell({ r, c })];
        const len = (cell?.w ?? (cell?.v != null ? String(cell.v) : '')).length;
        if (len > maxLen) maxLen = len;
      }
      w = Math.min(maxLen * 7.2 + 14, 320);
    }
    colWidths.push(Math.round(w));
  }
  const rows: SheetRowView[] = [];
  for (let r = range.s.r; r <= lastRow; r++) {
    const cells: SheetCellView[] = [];
    for (let c = range.s.c; c <= range.e.c; c++) {
      if (covered.has(`${r},${c}`)) continue;
      const cell = ws[XLSX.utils.encode_cell({ r, c })];
      const merge = merges.get(`${r},${c}`);
      const style = cellStyleToCss(cell?.s);
      // Excel: số căn phải mặc định; text wrap xuống dòng để không bị cắt mất
      if (!style.textAlign && cell?.t === 'n') style.textAlign = 'right';
      if (!style.whiteSpace) style.whiteSpace = 'pre-wrap';
      cells.push({
        text: cell?.w ?? (cell?.v != null ? String(cell.v) : ''),
        colSpan: merge?.colSpan ?? 1,
        rowSpan: merge?.rowSpan ?? 1,
        style,
      });
    }
    const rowHeight = ws['!rows']?.[r]?.hpx;
    rows.push({ cells, height: rowHeight ? Math.round(rowHeight) : undefined });
  }
  return { rows, colWidths, truncated: range.e.r > lastRow };
}

/**
 * Modal xem file (dùng Dialog core): ảnh hiển thị trực tiếp, PDF nhúng iframe,
 * loại khác hiển thị thông tin + nút tải xuống. Metadata + presigned URL fetch mới mỗi lần mở (hạn 1h).
 */
export function FilePreviewDialog({ file, onOpenChange }: FilePreviewDialogProps) {
  const [resolved, setResolved] = useState<FileItemApi | null>(null);
  const [sheetViews, setSheetViews] = useState<SheetView[] | null>(null);
  const [activeSheet, setActiveSheet] = useState(0);

  useEffect(() => {
    if (!file) return;
    let cancelled = false;
    setResolved(null);
    filesApi.get(file.id)
      .then((item) => { if (!cancelled) setResolved(item); })
      .catch((error) => {
        if (!cancelled) {
          console.warn('Không lấy được đường dẫn xem file:', error);
          onOpenChange(false);
        }
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onOpenChange ổn định theo caller
  }, [file]);

  const url = resolved?.url ?? null;
  const fileName = file?.displayName || file?.originalName || resolved?.displayName || resolved?.originalName || '';
  const isImage = !!resolved?.mimeType.startsWith('image/');
  const ext = (resolved?.extension ?? '').toLowerCase().replace('.', '');
  const isCsv = ext === 'csv' || resolved?.mimeType === 'text/csv';
  // xls/xlsx/doc/ppt → Office viewer; csv → render in-app bằng SheetJS
  const isOfficeDoc = ['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'].includes(ext)
    || resolved?.mimeType === 'application/vnd.ms-excel'
    || resolved?.mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  const isPdf = resolved?.mimeType === 'application/pdf' || ext === 'pdf';

  // CSV: fetch arrayBuffer → XLSX.read → render bảng có chrome kiểu Excel
  useEffect(() => {
    if (!url || !isCsv) { setSheetViews(null); return; }
    let cancelled = false;
    setActiveSheet(0);
    fetch(url)
      .then((r) => r.arrayBuffer())
      .then((buffer) => {
        if (cancelled) return;
        const workbook = XLSX.read(buffer, { type: 'array', cellStyles: true });
        // Mở đúng sheet đang active khi lưu file (như Excel mở mặc định)
        const activeTab = (workbook.Workbook?.Views?.[0] as { activeTab?: number } | undefined)?.activeTab ?? 0;
        setActiveSheet(Math.min(Math.max(activeTab, 0), workbook.SheetNames.length - 1));
        setSheetViews(workbook.SheetNames.map((name) => {
          const { rows, colWidths, truncated } = sheetToRows(workbook.Sheets[name]);
          return { name, rows, colWidths, truncated, headerRow: isCsv };
        }));
      })
      .catch(() => { if (!cancelled) setSheetViews([]); });
    return () => { cancelled = true; };
  }, [url, isCsv]);

  return (
    <Dialog open={!!file} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[calc(100dvh-2rem)] w-[calc(100dvw-2rem)] max-w-none flex-col gap-0 overflow-hidden p-0 sm:max-w-none">
        <DialogHeader className="border-b px-6 py-4 pr-12">
          <DialogTitle className="truncate">{fileName}</DialogTitle>
        </DialogHeader>
        <div className="flex min-h-0 flex-1 items-center justify-center bg-surface-muted p-4">
          {!file || !url ? (
            <div className="flex w-full flex-col items-center gap-2 py-10">
              <FileIcon className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Đang mở file…</p>
            </div>
          ) : isImage ? (
            <img src={url} alt={fileName} className="max-h-full w-auto max-w-full rounded-md object-contain" />
          ) : isPdf ? (
            <iframe src={url} title={fileName} className="h-full w-full rounded-md border-0 bg-white" />
          ) : isOfficeDoc ? (
            <iframe
              src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`}
              title={fileName}
              className="h-full w-full rounded-md border-0 bg-white"
            />
          ) : isCsv ? (
            !sheetViews ? (
              <div className="flex w-full flex-col items-center gap-2 py-10">
                <FileIcon className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Đang đọc bảng tính…</p>
              </div>
            ) : sheetViews.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <FileIcon className="h-10 w-10 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">File trống hoặc không đọc được. Hãy tải file về máy.</p>
              </div>
            ) : (
              <div className="flex h-full w-full flex-col overflow-hidden rounded-md border bg-white">
                {sheetViews.length > 1 && (
                  <div className="flex shrink-0 gap-1 overflow-x-auto border-b bg-muted/50 px-2 py-1.5">
                    {sheetViews.map((sheet, i) => (
                      <button
                        key={sheet.name}
                        type="button"
                        onClick={() => setActiveSheet(i)}
                        className={cn(
                          'shrink-0 rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                          i === activeSheet ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted',
                        )}
                      >
                        {sheet.name}
                      </button>
                    ))}
                  </div>
                )}
                <div className="min-h-0 flex-1 overflow-auto">
                  <table
                    className="border-collapse text-xs"
                    style={{ tableLayout: 'fixed', width: ((sheetViews[activeSheet]?.colWidths ?? []).reduce((sum, w) => sum + w, 0) || 0) + (sheetViews[activeSheet]?.headerRow ? 36 : 0) || undefined }}
                  >
                    <colgroup>
                      {sheetViews[activeSheet]?.headerRow && <col style={{ width: 36 }} />}
                      {(sheetViews[activeSheet]?.colWidths ?? []).map((w, i) => (
                        <col key={i} style={{ width: w }} />
                      ))}
                    </colgroup>
                    {sheetViews[activeSheet]?.headerRow && (
                      <thead>
                        <tr>
                          <th className="sticky left-0 top-0 z-20 h-6 border bg-muted" />
                          {(sheetViews[activeSheet]?.colWidths ?? []).map((_, i) => (
                            <th key={i} className="sticky top-0 z-20 h-6 border bg-muted px-1 py-0.5 text-center font-normal text-muted-foreground">
                              {indexToColLetter(i)}
                            </th>
                          ))}
                        </tr>
                      </thead>
                    )}
                    <tbody>
                      {(sheetViews[activeSheet]?.rows ?? []).map((row, ri) => (
                        <tr key={ri} style={row.height ? { height: row.height } : undefined}>
                          {sheetViews[activeSheet]?.headerRow && (
                            <th
                              className={cn(
                                'sticky left-0 border bg-muted px-1 text-center font-normal text-muted-foreground',
                                ri === 0 ? 'top-6 z-30' : 'z-10',
                              )}
                            >
                              {ri + 1}
                            </th>
                          )}
                          {row.cells.map((cell, ci) => (
                            <td
                              key={ci}
                              colSpan={cell.colSpan}
                              rowSpan={cell.rowSpan}
                              style={{
                                ...cell.style,
                                // Freeze dòng đầu + cột đầu: nền đặc để không lộ chữ khi cuộn
                                ...((ri === 0 || ci === 0) && !cell.style.backgroundColor
                                  ? {
                                    backgroundColor:
                                      ri === 0
                                        ? (sheetViews[activeSheet]?.headerRow ? '#F6E9EA' : '#FFFFFF')
                                        : (sheetViews[activeSheet]?.headerRow && ri % 2 === 0 ? '#FCFBFA' : '#FFFFFF'),
                                  }
                                  : {}),
                              }}
                              title={cell.text}
                              className={cn(
                                'overflow-hidden border px-1.5 py-0.5',
                                ci === 0 && (sheetViews[activeSheet]?.headerRow ? 'sticky left-9' : 'sticky left-0'),
                                ri === 0 && (sheetViews[activeSheet]?.headerRow ? 'sticky top-6' : 'sticky top-0'),
                                (ri === 0 || ci === 0) && 'z-10',
                                ri === 0 && ci === 0 && 'z-20',
                                sheetViews[activeSheet]?.headerRow && ri === 0 && 'font-semibold',
                                sheetViews[activeSheet]?.headerRow && ri > 0 && ri % 2 === 0 && 'bg-muted/40',
                              )}
                            >
                              {cell.text}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {sheetViews[activeSheet]?.truncated && (
                  <p className="shrink-0 border-t px-3 py-2 text-xs text-muted-foreground">
                    Hiển thị {SHEET_PREVIEW_MAX_ROWS} dòng đầu — tải file để xem đầy đủ.
                  </p>
                )}
              </div>
            )
          ) : (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <FileIcon className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Không xem trước được định dạng này. Hãy tải file về máy.</p>
            </div>
          )}
        </div>
        <div className="flex items-center justify-end gap-2 border-t bg-muted/50 px-6 py-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Đóng</Button>
          <Button
            type="button"
            disabled={!file}
            onClick={() => { if (file) void downloadFile(file.id, fileName || 'file'); }}
          >
            Tải xuống
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
