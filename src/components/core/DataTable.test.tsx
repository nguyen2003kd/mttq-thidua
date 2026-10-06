import type { ColumnDef } from '@tanstack/react-table';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FilterTextInput } from './FilterDropdown';
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

interface PeriodSortRow {
  startYear: number;
}

const columns: ColumnDef<SearchRow>[] = [{ accessorKey: 'name', header: 'Tên' }];
const sortableYearColumn: ColumnDef<PeriodSortRow>[] = [{
  accessorKey: 'startYear',
  header: 'Năm bắt đầu',
  enableSorting: true,
  sortDescFirst: false,
  meta: { sortable: true, list: { width: '132px' } },
}];

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

describe('DataTable text filters', () => {
  it('keeps filter text as a string and applies it only after confirmation', () => {
    const onFilterChange = vi.fn();
    render(
      <MemoryRouter>
        <DataTable
          data={[{ name: 'Cụm 1' }]}
          columns={columns}
          filters={<FilterTextInput value="" onChange={onFilterChange} placeholder="Tìm tên cụm…" />}
        />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Bộ lọc' }));
    const input = screen.getByPlaceholderText('Tìm tên cụm…');
    fireEvent.change(input, { target: { value: 'Cụm 1' } });

    expect(input).toHaveValue('Cụm 1');
    expect(onFilterChange).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận' }));
    expect(onFilterChange).toHaveBeenCalledWith('Cụm 1');
  });

  it('enables and applies the clear action when a clear handler is provided', () => {
    const onFilterChange = vi.fn();
    const onClearFilters = vi.fn();
    render(
      <MemoryRouter>
        <DataTable
          data={[{ name: 'Cụm 1' }]}
          columns={columns}
          filters={<FilterTextInput value="Cụm 1" onChange={onFilterChange} placeholder="Tìm tên cụm…" />}
          onClearFilters={onClearFilters}
        />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Bộ lọc' }));
    const clearButton = screen.getByRole('button', { name: 'Xóa lọc' });
    expect(clearButton).toBeEnabled();
    fireEvent.click(clearButton);

    expect(onFilterChange).toHaveBeenCalledWith('');
    expect(onClearFilters).toHaveBeenCalled();
  });
});

describe('DataTable list sorting', () => {
  it('sorts opted-in columns when their headers are clicked', () => {
    render(
      <MemoryRouter>
        <DataTable
          data={[{ startYear: 2024 }, { startYear: 1991 }]}
          columns={sortableYearColumn}
          variant="list"
          showPagination={false}
        />
      </MemoryRouter>,
    );

    const header = screen.getByText('Năm bắt đầu');
    fireEvent.click(header);
    expect(screen.getAllByText(/^(1991|2024)$/).map((item) => item.textContent)).toEqual(['1991', '2024']);

    fireEvent.click(header);
    expect(screen.getAllByText(/^(1991|2024)$/).map((item) => item.textContent)).toEqual(['2024', '1991']);
  });

  it('resets column sorting when an external sort preset changes', async () => {
    const data = [{ startYear: 2024 }, { startYear: 1991 }];
    const { rerender } = render(
      <MemoryRouter>
        <DataTable
          data={data}
          columns={sortableYearColumn}
          variant="list"
          showPagination={false}
          sortingResetKey="createdAt-desc"
        />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByText('Năm bắt đầu'));
    await waitFor(() => {
      expect(screen.getAllByText(/^(1991|2024)$/).map((item) => item.textContent)).toEqual(['1991', '2024']);
    });

    rerender(
      <MemoryRouter>
        <DataTable
          data={data}
          columns={sortableYearColumn}
          variant="list"
          showPagination={false}
          sortingResetKey="name-asc"
        />
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(screen.getAllByText(/^(1991|2024)$/).map((item) => item.textContent)).toEqual(['2024', '1991']);
    });
  });
});
