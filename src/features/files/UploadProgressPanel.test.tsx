import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { UploadProgressPanel } from './UploadProgressPanel';
import { useUploadProgressStore } from './uploadProgressStore';

describe('UploadProgressPanel', () => {
  beforeEach(() => {
    useUploadProgressStore.setState({ items: [], visible: false, minimized: false });
  });
  afterEach(() => cleanup());

  it('displays individual file results and allows minimizing and reopening', () => {
    const store = useUploadProgressStore.getState();
    const [first, second, third] = store.startBatch([
      { name: 'hoso.pdf', size: 1024 },
      { name: 'danhsach.xlsx', size: 2048 },
      { name: 'quyetdinh.docx', size: 3000 },
    ]);
    store.succeed(first);
    store.fail(second, 'File vượt quá giới hạn');
    store.setUploading(third);
    store.setProgress(third, 42);

    render(<UploadProgressPanel />);
    expect(screen.getByText('hoso.pdf')).toBeTruthy();
    expect(screen.getByText('danhsach.xlsx')).toBeTruthy();
    expect(screen.getByText('quyetdinh.docx')).toBeTruthy();
    expect(screen.getByText('1 thành công')).toBeTruthy();
    expect(screen.getByText('1 thất bại')).toBeTruthy();
    expect(screen.getByText('Đang tải lên 42%')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Thu gọn bảng tiến trình tải file' }));
    expect(screen.getByRole('button', { name: /Mở bảng tiến trình tải file/ })).toBeTruthy();
    expect(screen.queryByText('hoso.pdf')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Mở bảng tiến trình tải file/ }));
    expect(screen.getByText('hoso.pdf')).toBeTruthy();
  });

  it('closes completed progress and keeps active jobs if close is clicked', () => {
    const store = useUploadProgressStore.getState();
    const [id] = store.startBatch([{ name: 'test.pdf', size: 1024 }]);
    store.setUploading(id);
    render(<UploadProgressPanel />);
    fireEvent.click(screen.getByRole('button', { name: 'Thu gọn trong khi đang tải' }));
    expect(useUploadProgressStore.getState().visible).toBe(true);
    act(() => store.succeed(id));
    fireEvent.click(screen.getByRole('button', { name: /Mở bảng tiến trình tải file/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Đóng bảng tiến trình tải file' }));
    expect(useUploadProgressStore.getState().visible).toBe(false);
  });

  it('shows truthful status for a failed bulk upload', () => {
    const store = useUploadProgressStore.getState();
    const [id] = store.startBatch([{ name: 'hoso.pdf', size: 100 }], 'bulk');
    store.uncertain(id, 'Cần kiểm tra danh sách minh chứng');
    render(<UploadProgressPanel />);
    expect(screen.getByText('1 cần kiểm tra')).toBeTruthy();
    expect(screen.getByText('Cần kiểm tra kết quả')).toBeTruthy();
    expect(screen.getByText('Cần kiểm tra danh sách minh chứng')).toBeTruthy();
  });
});
