import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from './Button';

vi.mock('@/hooks/useAuth', () => ({
  useCan: () => () => true,
}));

describe('Button', () => {
  it('hides a selection-dependent action until a row is selected', () => {
    const { rerender } = render(<Button hideWhen> Xem </Button>);
    expect(screen.queryByRole('button', { name: 'Xem' })).not.toBeInTheDocument();

    rerender(<Button hideWhen={false}>Xem</Button>);
    expect(screen.getByRole('button', { name: 'Xem' })).toBeInTheDocument();
  });

  it('uses the raised primary treatment for back actions', () => {
    render(<Button variant="back">Quay lại</Button>);
    const button = screen.getByRole('button', { name: 'Quay lại' });

    expect(button).toHaveClass('bg-primary', 'text-primary-foreground', 'border-b-[4px]');
  });

  it.each([
    ['create', 'bg-button-create', 'text-white'],
    ['edit', 'bg-button-edit', 'text-button-edit-foreground'],
    ['delete', 'bg-button-delete', 'text-white'],
    ['view', 'bg-button-view', 'text-white'],
  ] as const)('uses the semantic color for %s actions', (action, ...classes) => {
    render(<Button action={action}>Thao tác</Button>);

    expect(screen.getByRole('button', { name: 'Thao tác' })).toHaveClass(...classes);
  });

  it('keeps warning actions orange with white text', () => {
    render(<Button variant="warning">Yêu cầu bổ sung</Button>);

    expect(screen.getByRole('button', { name: 'Yêu cầu bổ sung' })).toHaveClass('bg-button-warning', 'text-white');
  });

  it('keeps an edit form save on the primary variant when explicitly requested', () => {
    render(<Button action="edit" variant="default">Lưu thay đổi</Button>);

    expect(screen.getByRole('button', { name: 'Lưu thay đổi' })).toHaveClass('bg-primary');
  });
});
