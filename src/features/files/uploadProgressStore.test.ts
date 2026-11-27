import { beforeEach, describe, expect, it } from 'vitest';
import { useUploadProgressStore } from './uploadProgressStore';

describe('upload progress state', () => {
  beforeEach(() => {
    useUploadProgressStore.setState({ items: [], visible: false, minimized: false });
  });

  it('shows every selected file immediately, including repeated filenames', () => {
    const store = useUploadProgressStore.getState();
    const ids = store.startBatch([
      { name: 'minh-chung.pdf', size: 1024 },
      { name: 'minh-chung.pdf', size: 2048 },
      { name: 'bang-diem.xlsx', size: 3000 },
    ]);
    expect(new Set(ids).size).toBe(3);
    expect(useUploadProgressStore.getState().items).toHaveLength(3);
    expect(useUploadProgressStore.getState().items.every((item) => item.status === 'queued')).toBe(true);
    expect(useUploadProgressStore.getState().visible).toBe(true);
  });

  it('reports separate success/failure and never shows 100% before server confirmation', () => {
    const store = useUploadProgressStore.getState();
    const [first, second] = store.startBatch([
      { name: 'ok.pdf', size: 1024 },
      { name: 'invalid.docx', size: 1024 },
    ]);
    store.setUploading(first);
    store.setProgress(first, 100);
    expect(useUploadProgressStore.getState().items.find((item) => item.id === first)?.progress).toBe(95);
    store.succeed(first);
    store.setUploading(second);
    store.fail(second, 'File không hợp lệ');
    const items = useUploadProgressStore.getState().items;
    expect(items.find((item) => item.id === first)).toMatchObject({ status: 'success', progress: 100 });
    expect(items.find((item) => item.id === second)).toMatchObject({ status: 'error', error: 'File không hợp lệ' });
  });

  it('minimizes instead of losing active upload data and can clear after completion', () => {
    const store = useUploadProgressStore.getState();
    const [id] = store.startBatch([{ name: 'large.pdf', size: 4000 }]);
    store.setUploading(id);
    store.dismiss();
    expect(useUploadProgressStore.getState()).toMatchObject({ visible: true, minimized: true });
    store.succeed(id);
    store.clearFinished();
    expect(useUploadProgressStore.getState()).toMatchObject({ items: [], visible: false });
  });

  it('labels bulk errors as uncertain instead of incorrectly asserting that each file failed', () => {
    const store = useUploadProgressStore.getState();
    const [first, second] = store.startBatch([
      { name: 'file-1.pdf', size: 10 },
      { name: 'file-2.pdf', size: 10 },
    ], 'bulk');
    store.uncertain(first, 'Chưa xác nhận');
    store.uncertain(second, 'Chưa xác nhận');
    expect(useUploadProgressStore.getState().items.every((item) => item.status === 'unknown')).toBe(true);
  });
});
