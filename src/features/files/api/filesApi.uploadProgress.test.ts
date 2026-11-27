import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useUploadProgressStore } from '../uploadProgressStore';

const mainInstanceMock = vi.hoisted(() => vi.fn());
vi.mock('@/api/mutator/custom-instance', () => ({ mainInstance: mainInstanceMock }));

import { filesApi } from './filesApi';

describe('upload tracker integration with files API', () => {
  beforeEach(() => {
    mainInstanceMock.mockReset();
    useUploadProgressStore.setState({ items: [], visible: false, minimized: false });
  });

  it('marks an individual file uploaded only after the API confirms success', async () => {
    mainInstanceMock.mockImplementation(async (config: { onUploadProgress?: (value: { loaded: number; total: number }) => void }) => {
      config.onUploadProgress?.({ loaded: 100, total: 100 });
      expect(useUploadProgressStore.getState().items[0]).toMatchObject({ status: 'uploading', progress: 95 });
      return { success: true, data: { id: 'id-1', originalName: 'a.pdf' } };
    });
    const result = await filesApi.upload(new File(['pdf'], 'a.pdf'));
    expect(result.id).toBe('id-1');
    expect(useUploadProgressStore.getState().items[0]).toMatchObject({ status: 'success', progress: 100 });
  });

  it('shows the exact failed file for individually uploaded requests', async () => {
    mainInstanceMock.mockRejectedValue(new Error('File quá lớn'));
    await expect(filesApi.upload(new File(['pdf'], 'b.pdf'))).rejects.toThrow('File quá lớn');
    expect(useUploadProgressStore.getState().items[0]).toMatchObject({
      name: 'b.pdf', status: 'error', error: 'File quá lớn',
    });
  });

  it('marks every file successful when the bulk response confirms all file records', async () => {
    mainInstanceMock.mockResolvedValue({ success: true, data: [{ id: '1' }, { id: '2' }] });
    await filesApi.uploadBulk([
      new File(['a'], 'a.pdf'),
      new File(['b'], 'b.pdf'),
    ]);
    expect(useUploadProgressStore.getState().items).toHaveLength(2);
    expect(useUploadProgressStore.getState().items.every((item) => item.status === 'success')).toBe(true);
  });

  it('does not falsely mark every file failed when a bulk request fails mid-way', async () => {
    mainInstanceMock.mockRejectedValue(new Error('Storage unavailable'));
    await expect(filesApi.uploadBulk([
      new File(['a'], 'a.pdf'),
      new File(['b'], 'b.pdf'),
    ])).rejects.toThrow('Storage unavailable');
    const items = useUploadProgressStore.getState().items;
    expect(items).toHaveLength(2);
    expect(items.every((item) => item.status === 'unknown')).toBe(true);
  });

  it('does not say all succeeded when the backend returns an incomplete bulk result', async () => {
    mainInstanceMock.mockResolvedValue({ success: true, data: [{ id: '1' }] });
    await expect(filesApi.uploadBulk([
      new File(['a'], 'a.pdf'),
      new File(['b'], 'b.pdf'),
    ])).rejects.toThrow('không xác nhận đủ');
    expect(useUploadProgressStore.getState().items.every((item) => item.status === 'unknown')).toBe(true);
  });
});
