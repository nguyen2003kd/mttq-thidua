import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ConfirmDialog } from './ConfirmDialog';

describe('ConfirmDialog', () => {
  it('wraps long filenames inside the dialog description', () => {
    const description = 'File "01_ho_so_nhap_khau_thiet_bi_dien_tu_5_trang.pdf" sẽ bị xóa khỏi hệ thống.';

    render(
      <ConfirmDialog
        open
        onOpenChange={() => {}}
        title="Xóa file đính kèm"
        description={description}
        onConfirm={() => {}}
        variant="destructive"
        confirmLabel="Xóa file"
      />,
    );

    const descriptionElement = screen.getByText(description);
    expect(descriptionElement).toHaveClass('break-words');
    expect(descriptionElement.parentElement).toHaveClass('min-w-0', 'flex-1');
  });
});
