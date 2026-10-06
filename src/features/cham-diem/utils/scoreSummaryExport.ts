import * as XLSX from 'xlsx-js-style';

// Màu xanh hệ thống (--primary: 198 100% 28%)
const PRIMARY = '0072B8';

const headerStyle = {
  fill: { fgColor: { rgb: PRIMARY } },
  font: { bold: true, color: { rgb: 'FFFFFF' } },
  alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
} as const;

const sectionTitleStyle = {
  fill: { fgColor: { rgb: PRIMARY } },
  font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 12 },
  alignment: { horizontal: 'left', vertical: 'center' },
} as const;

const groupStyle = {
  fill: { fgColor: { rgb: PRIMARY } },
  font: { bold: true, color: { rgb: 'FFFFFF' } },
  alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
} as const;

const numberStyle = {
  alignment: { horizontal: 'right', vertical: 'center' },
} as const;

const textStyle = {
  alignment: { horizontal: 'left', vertical: 'center', wrapText: true },
} as const;

const labelStyle = {
  font: { bold: true },
  alignment: { horizontal: 'left', vertical: 'center' },
} as const;

const valueStyle = {
  alignment: { horizontal: 'left', vertical: 'center' },
} as const;

const HEADERS = [
  'Cụm thi đua',
  'Tên xã, phường',
  'Địa phương chấm',
  'Điểm điểm thưởng địa phương',
  'Tỉnh chấm',
  'Điểm thưởng của tỉnh',
  'Địa phương chấm (điểm tự chấm + điểm thưởng)',
  'Tỉnh chấm (điểm chấm + điểm thưởng)',
];

export interface ScoreSummaryExportRow {
  cluster: string;
  localityName: string;
  proposedScore: number | null;
  proposedBonus: number | null;
  provinceScore: number | null;
  provinceBonus: number | null;
  proposedTotal: number | null;
  provinceTotal: number | null;
}

export interface ScoreSummaryExportMeta {
  periodName: string | null;
  totalUnits: number;
  proposed: { excellent: number; good: number; fair: number };
  province: { excellent: number; good: number; fair: number };
  rankings: { rank: number; localityName: string; total: number }[];
}

type Distribution = ScoreSummaryExportMeta['proposed'];

export function toDistribution(distribution: Record<string, number>): Distribution {
  return {
    excellent: distribution.EXCELLENT ?? 0,
    good: distribution.GOOD ?? 0,
    fair: distribution.FAIR ?? 0,
  };
}

function setCell(
  worksheet: XLSX.WorkSheet,
  r: number,
  c: number,
  value: string | number,
  style?: Record<string, unknown>,
): void {
  const address = XLSX.utils.encode_cell({ r, c });
  worksheet[address] = { t: typeof value === 'number' ? 'n' : 's', v: value, ...(style ? { s: style } : {}) } as XLSX.CellObject;
}

function writeOverviewBlock(worksheet: XLSX.WorkSheet, row: number, meta: ScoreSummaryExportMeta): number {
  setCell(worksheet, row, 0, 'Đề xuất điểm', sectionTitleStyle);
  setCell(worksheet, row, 1, 'Tỉnh chấm', sectionTitleStyle);
  worksheet['!merges']!.push({ s: { r: row, c: 1 }, e: { r: row, c: 3 } });
  worksheet['!merges']!.push({ s: { r: row, c: 4 }, e: { r: row, c: 7 } });

  const distributionRows: Array<[string, keyof ScoreSummaryExportMeta['proposed']]> = [
    ['Xuất sắc', 'excellent'],
    ['Tốt', 'good'],
    ['Khá', 'fair'],
  ];
  let current = row + 1;
  for (const [label, key] of distributionRows) {
    setCell(worksheet, current, 0, label, labelStyle);
    setCell(worksheet, current, 1, meta.proposed[key], valueStyle);
    setCell(worksheet, current, 4, label, labelStyle);
    setCell(worksheet, current, 5, meta.province[key], valueStyle);
    worksheet['!merges']!.push({ s: { r: current, c: 1 }, e: { r: current, c: 3 } });
    worksheet['!merges']!.push({ s: { r: current, c: 5 }, e: { r: current, c: 7 } });
    current += 1;
  }
  return current;
}

function writeRankingBlock(worksheet: XLSX.WorkSheet, row: number, meta: ScoreSummaryExportMeta): number {
  setCell(worksheet, row, 0, 'Xếp hạng tỉnh chấm', sectionTitleStyle);
  worksheet['!merges']!.push({ s: { r: row, c: 0 }, e: { r: row, c: 3 } });
  setCell(worksheet, row, 4, `${meta.rankings.length} đã chấm`, sectionTitleStyle);
  worksheet['!merges']!.push({ s: { r: row, c: 4 }, e: { r: row, c: 7 } });

  let current = row + 1;
  for (const item of meta.rankings) {
    setCell(worksheet, current, 0, item.rank, numberStyle);
    setCell(worksheet, current, 1, item.localityName, textStyle);
    setCell(worksheet, current, 4, item.total, numberStyle);
    worksheet['!merges']!.push({ s: { r: current, c: 1 }, e: { r: current, c: 3 } });
    worksheet['!merges']!.push({ s: { r: current, c: 4 }, e: { r: current, c: 7 } });
    current += 1;
  }
  return current;
}

function writeScaleBlock(worksheet: XLSX.WorkSheet, row: number): number {
  setCell(worksheet, row, 0, 'Thang điểm xếp loại', sectionTitleStyle);
  worksheet['!merges']!.push({ s: { r: row, c: 0 }, e: { r: row, c: 3 } });
  setCell(worksheet, row, 4, 'Áp dụng cho tổng điểm chấm và điểm thưởng.', textStyle);
  worksheet['!merges']!.push({ s: { r: row, c: 4 }, e: { r: row, c: 7 } });

  const scaleRows: Array<[string, string]> = [
    ['Xuất sắc', 'Từ 95 đến 100 điểm'],
    ['Tốt', 'Từ 85 đến dưới 95 điểm'],
    ['Khá', 'Từ 70 đến dưới 85 điểm'],
  ];
  let current = row + 1;
  for (const [label, description] of scaleRows) {
    setCell(worksheet, current, 0, label, labelStyle);
    setCell(worksheet, current, 4, description, valueStyle);
    worksheet['!merges']!.push({ s: { r: current, c: 0 }, e: { r: current, c: 3 } });
    worksheet['!merges']!.push({ s: { r: current, c: 4 }, e: { r: current, c: 7 } });
    current += 1;
  }
  return current;
}

export function exportScoreSummaryToExcel(
  rows: ScoreSummaryExportRow[],
  fileName: string,
  meta?: ScoreSummaryExportMeta,
): void {
  const data: (string | number)[][] = [HEADERS];
  const clusterSpans: Array<{ start: number; count: number }> = [];
  let previousCluster: string | null = null;

  for (const row of rows) {
    if (row.cluster !== previousCluster) {
      clusterSpans.push({ start: data.length, count: 0 });
      previousCluster = row.cluster;
    }
    clusterSpans[clusterSpans.length - 1].count += 1;
    data.push([
      '',
      row.localityName,
      row.proposedScore ?? '',
      row.proposedBonus ?? '',
      row.provinceScore ?? '',
      row.provinceBonus ?? '',
      row.proposedTotal ?? '',
      row.provinceTotal ?? '',
    ]);
  }

  const worksheet = XLSX.utils.aoa_to_sheet(data);
  worksheet['!cols'] = [
    { wch: 22 },
    { wch: 30 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
    { wch: 18 },
    { wch: 20 },
    { wch: 20 },
  ];
  worksheet['!rows'] = [{ hpt: 32 }];
  worksheet['!merges'] = [];

  const range = XLSX.utils.decode_range(worksheet['!ref']!);
  for (let r = range.s.r; r <= range.e.r; r++) {
    for (let c = range.s.c; c <= range.e.c; c++) {
      const address = XLSX.utils.encode_cell({ r, c });
      const cell = worksheet[address] as XLSX.CellObject | undefined;
      if (!cell) continue;
      if (r === range.s.r) {
        cell.s = headerStyle;
        continue;
      }
      cell.s = c >= 2 ? numberStyle : textStyle;
    }
  }

  for (const span of clusterSpans) {
    if (span.count <= 1) continue;
    const startRow = span.start;
    const endRow = span.start + span.count - 1;
    worksheet['!merges']!.push({ s: { r: startRow, c: 0 }, e: { r: endRow, c: 0 } });
    const address = XLSX.utils.encode_cell({ r: startRow, c: 0 });
    const cell = worksheet[address] as XLSX.CellObject | undefined;
    if (cell) {
      cell.v = rows[span.start]?.cluster ?? '';
      cell.s = groupStyle;
    }
  }

  if (meta) {
    let metaRow = range.e.r + 2;
    metaRow = writeOverviewBlock(worksheet, metaRow, meta);
    metaRow = writeRankingBlock(worksheet, metaRow + 1, meta);
    metaRow = writeScaleBlock(worksheet, metaRow + 1);
    worksheet['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: metaRow - 1, c: 7 } });
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Bảng tổng hợp');
  XLSX.writeFile(workbook, fileName);
}
