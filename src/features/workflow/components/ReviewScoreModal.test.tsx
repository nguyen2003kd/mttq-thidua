import type { ReactNode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ReviewScoreModal } from './ReviewScoreModal';

vi.mock('@/components/core', () => ({
  FileUpload: () => null,
  FormDialog: ({ open, children }: { open: boolean; children: ReactNode }) => open ? <div>{children}</div> : null,
}));

describe('ReviewScoreModal background refresh', () => {
  it('preserves edits until reopening or selecting a different criterion', () => {
    const props = { open: true, criterionId: 'c1', maxScoreOverride: 10, initialScore: 1, onOpenChange: vi.fn(), onSave: vi.fn() };
    const { rerender } = render(<ReviewScoreModal {...props} />);
    fireEvent.change(screen.getByLabelText(/Điểm chấm/), { target: { value: '7' } });
    fireEvent.change(screen.getByLabelText(/Lý do/), { target: { value: 'Đang đối chiếu' } });

    rerender(<ReviewScoreModal {...props} initialScore={2} initialReason="Thông tin từ server" />);
    expect(screen.getByLabelText(/Điểm chấm/)).toHaveValue(7);
    expect(screen.getByLabelText(/Lý do/)).toHaveValue('Đang đối chiếu');

    rerender(<ReviewScoreModal {...props} open={false} initialScore={2} />);
    rerender(<ReviewScoreModal {...props} initialScore={2} />);
    expect(screen.getByLabelText(/Điểm chấm/)).toHaveValue(2);

    rerender(<ReviewScoreModal {...props} criterionId="c2" initialScore={3} />);
    expect(screen.getByLabelText(/Điểm chấm/)).toHaveValue(3);
  });
});
