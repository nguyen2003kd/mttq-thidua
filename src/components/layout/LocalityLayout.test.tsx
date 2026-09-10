import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LocalityLayout } from './LocalityLayout';
import { useAuthStore } from '@/store/authStore';

beforeEach(() => {
  useAuthStore.setState({
    user: { id: 'u', name: 'Phường A', role: 'LOCAL', localityId: 'dp1' },
    token: 't',
    refreshToken: 'r',
  });
});

describe('LocalityLayout (B15)', () => {
  it('render header có nút menu người dùng (mở được menu đăng xuất)', () => {
    render(
      <MemoryRouter initialEntries={['/thi-dua/dia-phuong/trang-thai']}>
        <LocalityLayout>
          <div>nội dung</div>
        </LocalityLayout>
      </MemoryRouter>,
    );

    // trigger menu người dùng — điểm vào để đăng xuất (trước đây layout không có)
    const trigger = screen.getByRole('button', { name: /Phường A/ });
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveAttribute('aria-haspopup');
    expect(screen.getByText('nội dung')).toBeInTheDocument();
  });
});
