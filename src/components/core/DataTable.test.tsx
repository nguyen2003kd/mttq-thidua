import type { ColumnDef } from '@tanstack/react-table';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DataTable } from './DataTable';

class ResizeObserverStub {
  observe() {}
  disconnect() {}
}

beforeEach(() => vi.stubGlobal('ResizeObserver', ResizeObserverStub));
afterEach(() => vi.unstubAllGlobals());

interface SearchRow {
  name: string;
}

const columns: ColumnDef<SearchRow>[] = [{ accessorKey: 'name', header: 'Tên' }];

function SearchParam() {
  const { search } = useLocation();
  return <output data-testid="search-param">{new URLSearchParams(search).get('search') ?? ''}</output>;
}

describe('DataTable search', () => {
  it('keeps the typed value while persisting it after debounce', async () => {
    const onSearchChange = vi.fn();
    render(
      <MemoryRouter initialEntries={['/chuyen-vien/tieu-chi']}>
        <>
          <DataTable
            data={[{ name: 'Bảng tiêu chí' }]}
            columns={columns}
            searchable
            searchPlaceholder="Tìm theo tên bảng tiêu chí..."
            onSearchChange={onSearchChange}
          />
          <SearchParam />
        </>
      </MemoryRouter>,
    );

    const input = screen.getByPlaceholderText('Tìm theo tên bảng tiêu chí...');
    fireEvent.change(input, { target: { value: 'tieu chi' } });

    expect(input).toHaveValue('tieu chi');
    expect(screen.getByTestId('search-param')).toHaveTextContent('');
    await waitFor(() => expect(screen.getByTestId('search-param')).toHaveTextContent('tieu chi'));
    expect(input).toHaveValue('tieu chi');
    expect(onSearchChange).toHaveBeenLastCalledWith('tieu chi');
  });
});
