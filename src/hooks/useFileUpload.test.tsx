import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useUploadProgressStore } from '@/features/files/uploadProgressStore';

const mainInstanceMock = vi.hoisted(() => vi.fn());
vi.mock('@/api/mutator/custom-instance', () => ({ mainInstance: mainInstanceMock }));
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
  },
}));

import { useFileUpload } from './useFileUpload';

describe('useFileUpload with 10 files', () => {
  beforeEach(() => {
    mainInstanceMock.mockReset();
    useUploadProgressStore.setState({ items: [], visible: false, minimized: false });
  });

  it('displays 5 successful and 5 failed files without mixing up their names', async () => {
    let firstRequest = true;
    mainInstanceMock.mockImplementation(async (config: { data: FormData }) => {
      const file = config.data.get('file') as File;
      if (firstRequest) {
        firstRequest = false;
        const current = useUploadProgressStore.getState().items;
        expect(current).toHaveLength(10);
        expect(current.filter((item) => item.status === 'queued')).toHaveLength(9);
      }
      const index = Number(file.name.match(/\d+/)?.[0] ?? 0);
      if (index % 2 === 0) throw new Error('Tệp không hợp lệ');
      return { success: true, data: { id: String(index), originalName: file.name, sizeBytes: file.size } };
    });

    const files = Array.from({ length: 10 }, (_, index) =>
      new File(['test'], 'file-' + (index + 1) + '.pdf'),
    );
    const { result } = renderHook(() => useFileUpload());
    let saved: unknown[] = [];
    await act(async () => {
      saved = await result.current.uploadFiles(files);
    });

    expect(saved).toHaveLength(5);
    const items = useUploadProgressStore.getState().items;
    expect(items).toHaveLength(10);
    expect(items.filter((item) => item.status === 'success')).toHaveLength(5);
    expect(items.filter((item) => item.status === 'error')).toHaveLength(5);
    expect(items.find((item) => item.name === 'file-10.pdf')?.status).toBe('error');
    expect(items.find((item) => item.name === 'file-9.pdf')?.status).toBe('success');
    expect(result.current.uploading).toBe(false);
  });
});
