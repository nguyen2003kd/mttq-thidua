import { describe, expect, it, vi } from 'vitest';
import { submitAfterSuccessfulUploads } from './submissionFlow';

describe('submitAfterSuccessfulUploads', () => {
  it('does not submit when any upload group fails', async () => {
    const submit = vi.fn().mockResolvedValue('submitted');

    const result = await submitAfterSuccessfulUploads(
      [Promise.resolve(), Promise.reject(new Error('upload failed'))],
      submit,
    );

    expect(result).toEqual({ ok: false, failedUploadGroups: 1 });
    expect(submit).not.toHaveBeenCalled();
  });

  it('submits after every upload group succeeds', async () => {
    const submit = vi.fn().mockResolvedValue('submitted');

    const result = await submitAfterSuccessfulUploads([Promise.resolve()], submit);

    expect(result).toEqual({ ok: true, value: 'submitted' });
    expect(submit).toHaveBeenCalledOnce();
  });
});
