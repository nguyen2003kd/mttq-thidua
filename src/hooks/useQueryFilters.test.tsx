import type { ReactNode } from 'react';
import { act, renderHook } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { useQueryFilters } from './useQueryFilters';

function createWrapper(initialEntry: string) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <MemoryRouter initialEntries={[initialEntry]}>{children}</MemoryRouter>;
  };
}

describe('useQueryFilters', () => {
  it('restores filter values from query parameters and preserves unrelated parameters', () => {
    const { result, unmount } = renderHook(() => {
      const queryFilters = useQueryFilters({ search: '', status: '', sort: 'createdAt-desc' });
      const location = useLocation();
      return { ...queryFilters, search: location.search };
    }, { wrapper: createWrapper('/items?tab=active&status=Reviewed') });

    expect(result.current.filters).toEqual({ search: '', status: 'Reviewed', sort: 'createdAt-desc' });

    act(() => result.current.setFilter('search', 'Phường Trảng Dài'));
    act(() => result.current.setFilter('sort', 'name-asc'));
    expect(result.current.search).toContain('tab=active');
    expect(result.current.search).toContain('status=Reviewed');
    expect(result.current.search).toContain('search=Ph%C6%B0%E1%BB%9Dng');
    expect(result.current.search).toContain('sort=name-asc');

    const refreshUrl = `/items${result.current.search}`;
    unmount();
    const reloaded = renderHook(() => useQueryFilters({ search: '', status: '', sort: 'createdAt-desc' }), {
      wrapper: createWrapper(refreshUrl),
    });
    expect(reloaded.result.current.filters).toEqual({ search: 'Phường Trảng Dài', status: 'Reviewed', sort: 'name-asc' });

    act(() => reloaded.result.current.setFilters({ search: '', status: '', sort: 'createdAt-desc' }));
    expect(reloaded.result.current.filters).toEqual({ search: '', status: '', sort: 'createdAt-desc' });
  });
});
