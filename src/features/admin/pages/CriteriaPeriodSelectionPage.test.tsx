import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PeriodApi } from '../api/periodsApi';
import { periodsApi } from '../api/periodsApi';
import CriteriaPeriodSelectionPage from './CriteriaPeriodSelectionPage';

class ResizeObserverStub {
  observe() {}
  disconnect() {}
}

const period: PeriodApi = {
  id: 'period-1',
  startYear: 2026,
  endYear: 2030,
  name: '2026-2030',
  status: 'Active',
  createdBy: null,
  updatedBy: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: null,
};

function CurrentLocation() {
  const { pathname, search } = useLocation();
  return <output data-testid="current-location">{pathname}{search}</output>;
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('CriteriaPeriodSelectionPage', () => {
  it('opens the criteria list with the selected period filter', async () => {
    vi.stubGlobal('ResizeObserver', ResizeObserverStub);
    vi.spyOn(periodsApi, 'listAll').mockResolvedValue([period]);
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/chuyen-vien/tieu-chi?view=periods']}>
          <CriteriaPeriodSelectionPage />
          <CurrentLocation />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    fireEvent.click(await screen.findByText(period.name));
    await waitFor(() => {
      expect(screen.getByTestId('current-location')).toHaveTextContent(
        '/chuyen-vien/tieu-chi?periodFilter=period-1',
      );
    });
  });
});
