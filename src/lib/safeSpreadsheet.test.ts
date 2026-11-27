import { describe, expect, it, vi } from 'vitest';
import ExcelJS from 'exceljs-hardened';
import { read, utils, writeFile } from './safeSpreadsheet';
import { parseCriteriaExcelFile } from '@/features/admin/criteriaExcel';

describe('safe spreadsheet adapter', () => {
  it('parses UTF-8 CSV including quoted commas, quotes and multiline fields', async () => {
    const input = new TextEncoder().encode('Tên,Giá trị\r\n"Xã, phường","Có ""dấu""" \r\n"Xuống\n dòng",42');
    const workbook = await read(input.buffer as ArrayBuffer, { format: 'csv' });
    expect(workbook.SheetNames).toEqual(['CSV']);
    expect(utils.sheet_to_json(workbook.Sheets.CSV)).toEqual([
      ['Tên', 'Giá trị'],
      ['Xã, phường', 'Có "dấu" '],
      ['Xuống\n dòng', '42'],
    ]);
  });

  it('rejects CSV cells exceeding preview limits', async () => {
    const input = new TextEncoder().encode('A'.repeat(20_001));
    await expect(read(input.buffer as ArrayBuffer, { format: 'csv' })).rejects.toThrow('Ô CSV quá dài');
  });

  it('imports a real XLSX and keeps Vietnam deadlines', async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Bảng tiêu chí');
    sheet.addRow(['Nội dung', 'Điểm chuẩn', 'Ghi chú', 'Hạn nộp']);
    sheet.addRow(['Nhóm kiểm thử', 10, '', '2030-11-26 17:00']);
    sheet.addRow(['Tiêu chí kiểm thử', 10, '', '2030-11-26 16:00']);
    const binary = await workbook.xlsx.writeBuffer();
    const file = new File([new Uint8Array(binary)], 'tieu-chi.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    Object.defineProperty(file, 'arrayBuffer', { value: async () => new Uint8Array(binary).buffer });

    const result = await parseCriteriaExcelFile(file);
    expect(result.name).toBe('Nhóm kiểm thử');
    expect(result.deadline).toBe('2030-11-26T17:00:00+07:00');
    expect(result.criteria[0].deadline).toBe('2030-11-26T16:00:00+07:00');
  });

  it('reads native Excel date/time cells as Vietnam wall-clock deadlines', async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Bảng tiêu chí');
    sheet.addRow(['Nội dung', 'Điểm chuẩn', 'Ghi chú', 'Hạn nộp']);
    sheet.addRow(['Nhóm ngày Excel', 5, '', new Date(Date.UTC(2030, 10, 26, 17, 0))]);
    sheet.addRow(['Tiêu chí ngày Excel', 5, '', new Date(Date.UTC(2030, 10, 26, 16, 0))]);
    sheet.getCell('D2').numFmt = 'dd/mm/yyyy hh:mm';
    sheet.getCell('D3').numFmt = 'dd/mm/yyyy hh:mm';
    const binary = await workbook.xlsx.writeBuffer();
    const file = new File([new Uint8Array(binary)], 'date-cells.xlsx');
    Object.defineProperty(file, 'arrayBuffer', { value: async () => new Uint8Array(binary).buffer });
    const result = await parseCriteriaExcelFile(file);
    expect(result.deadline).toBe('2030-11-26T17:00:00+07:00');
    expect(result.criteria[0].deadline).toBe('2030-11-26T16:00:00+07:00');
  });

  it('keeps Excel fill color, column width, row height, and merged cells in preview', async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Xem trước');
    sheet.getCell('A1').value = 'Bảng tổng hợp';
    sheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0072B8' } };
    sheet.getCell('A1').font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getColumn(1).width = 30;
    sheet.getRow(1).height = 32;
    sheet.mergeCells('A1:B1');
    const bytes = await workbook.xlsx.writeBuffer();
    const result = await read(new Uint8Array(bytes).buffer, { type: 'array', cellStyles: true });
    const previewSheet = result.Sheets['Xem trước'];
    expect((previewSheet.A1 as { s?: { fgColor?: { argb?: string } } }).s?.fgColor?.argb).toBe('FF0072B8');
    expect(previewSheet['!cols']?.[0]?.wch).toBe(30);
    expect(previewSheet['!rows']?.[0]?.hpt).toBe(32);
    expect(previewSheet['!merges']).toEqual([
      { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } },
    ]);
  });

  it('exports a readable XLSX with the expected sheet name and header styles', async () => {
    let output: Blob | undefined;
    const originalCreate = URL.createObjectURL;
    const originalRevoke = URL.revokeObjectURL;
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true, writable: true, value: (blob: Blob) => { output = blob; return 'blob:test-export'; },
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true, writable: true, value: () => undefined,
    });
    try {
      const book = utils.book_new();
      const sheet = utils.aoa_to_sheet([['Nội dung', 'Điểm chuẩn'], ['Tiêu chí', 10]]);
      sheet.A1 = {
        t: 's', v: 'Nội dung',
        s: { fill: { fgColor: { rgb: '0072B8' } }, font: { bold: true, color: { rgb: 'FFFFFF' } } },
      };
      sheet['!cols'] = [{ wch: 35 }, { wch: 15 }];
      utils.book_append_sheet(book, sheet, 'Bảng tiêu chí');
      await writeFile(book, 'test.xlsx');
      expect(click).toHaveBeenCalledOnce();
      expect(output).toBeInstanceOf(Blob);

      const bytes = await new Promise<ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.onerror = () => reject(reader.error);
        reader.readAsArrayBuffer(output!);
      });
      const parsed = new ExcelJS.Workbook();
      await parsed.xlsx.load(new Uint8Array(bytes) as unknown as Parameters<typeof parsed.xlsx.load>[0]);
      const ws = parsed.getWorksheet('Bảng tiêu chí');
      expect(ws?.getCell('A1').value).toBe('Nội dung');
      expect(ws?.getCell('A1').fill).toMatchObject({
        type: 'pattern',
        fgColor: { argb: 'FF0072B8' },
      });
      expect(ws?.getCell('B2').value).toBe(10);
      expect(ws?.getColumn(1).width).toBe(35);
    } finally {
      click.mockRestore();
      Object.defineProperty(URL, 'createObjectURL', {
        configurable: true, writable: true, value: originalCreate,
      });
      Object.defineProperty(URL, 'revokeObjectURL', {
        configurable: true, writable: true, value: originalRevoke,
      });
    }
  });

  it('requires XLSX rather than unsupported legacy XLS', async () => {
    const file = new File([], 'old.xls');
    await expect(parseCriteriaExcelFile(file)).rejects.toThrow('.xlsx');
  });
});
