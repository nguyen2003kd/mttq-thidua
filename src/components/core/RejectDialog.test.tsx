import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RejectDialog } from './RejectDialog';
import { useAuthStore } from '@/store/authStore';

beforeEach(() => {
  useAuthStore.setState({
    user: { id: 'u', name: 'Lãnh đạo', role: 'LEADER', banId: 'ban1' },
    token: 't',
    refreshToken: 'r',
  });
});

const common = { state: 'CHO_DUYET_BAN' as const, scope: { banId: 'ban1' } };

describe('RejectDialog', () => {
  it('nút xác nhận disabled khi chưa nhập lý do, enabled khi có', async () => {
    const user = userEvent.setup();
    render(<RejectDialog open onOpenChange={() => {}} localityName="Phường A" onConfirm={vi.fn()} {...common} />);

    const confirm = screen.getByRole('button', { name: 'Trả lại' });
    expect(confirm).toBeDisabled();

    await user.type(screen.getByLabelText('Lý do trả lại'), 'Thiếu minh chứng');
    expect(confirm).toBeEnabled();
  });

  it('gọi onConfirm với lý do đã trim rồi đóng', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <RejectDialog open onOpenChange={onOpenChange} localityName="Phường A" onConfirm={onConfirm} {...common} />,
    );

    await user.type(screen.getByLabelText('Lý do trả lại'), '  Sai số liệu  ');
    await user.click(screen.getByRole('button', { name: 'Trả lại' }));

    expect(onConfirm).toHaveBeenCalledWith('Sai số liệu');
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('hiển thị tên địa phương trong mô tả', () => {
    render(<RejectDialog open onOpenChange={() => {}} localityName="Phường B" onConfirm={vi.fn()} {...common} />);
    expect(screen.getByText(/Phường B/)).toBeInTheDocument();
  });
});
