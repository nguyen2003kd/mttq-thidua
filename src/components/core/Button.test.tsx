import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from './Button';

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
});
