import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PeriodApi } from '../api/periodsApi';
import { periodsApi } from '../api/periodsApi';
import { scoringConfigsApi, type ScoringConfigApi } from '../api/scoringConfigsApi';
import { useAuthStore } from '@/store/authStore';
import CriteriaPeriodSelectionPage from './CriteriaPeriodSelectionPage';

// Base UI Select không tương tác ổn định trong jsdom — thay bằng <select> native
// giữ nguyên id của trigger và các option từ SelectItem để fireEvent.change hoạt động.
vi.mock('@/components/ui/select', async () => {
  const React = await import('react');
  type MockElement = { props: Record<string, unknown> & { children?: unknown } };

  const SelectTrigger = ({ children }: { children?: React.ReactNode }) => <>{children}</>;
  const SelectValue = () => null;
  const SelectContent = () => null;
  const SelectItem = () => null;
  const SelectGroup = ({ children }: { children?: React.ReactNode }) => <>{children}</>;

  const Select = ({ value, onValueChange, children }: {
    value?: string;
    onValueChange?: (value: string) => void;
    children?: unknown;
  }) => {
    let selectId: string | undefined;
    const options: Array<{ value: string; label: React.ReactNode }> = [];
    const walk = (node: unknown) => {
      if (!React.isValidElement(node)) return;
      const element = node as unknown as MockElement & { type: unknown };
      if (element.type === SelectTrigger) {
        selectId = element.props.id as string | undefined;
        React.Children.forEach(element.props.children, walk);
        return;
      }
      if (element.type === SelectItem) {
        options.push({ value: element.props.value as string, label: element.props.children as React.ReactNode });
        return;
      }
      React.Children.forEach(element.props.children, walk);
    };
    React.Children.forEach(children, walk);
    return React.createElement(
      'select',
      {
        id: selectId,
        value: value ?? '',
        onChange: (event: React.ChangeEvent<HTMLSelectElement>) => onValueChange?.(event.target.value),
      },
      options.map((option) => React.createElement('option', { key: option.value, value: option.value }, option.label)),
    );
  };

  return { Select, SelectTrigger, SelectValue, SelectContent, SelectItem, SelectGroup };
});

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
  scoringConfigId: null,
  scoringConfigName: null,
  maxBonusPointPerPeriod: 5,
  maxBonusPointPerCriteria: 1,
  createdBy: null,
  updatedBy: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: null,
};

const scoringConfig: ScoringConfigApi = {
  id: 'config-1',
  name: 'Cấu hình A',
  description: null,
  levels: [],
  usedByPeriodCount: 0,
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
  useAuthStore.getState().resetStore();
});

describe('CriteriaPeriodSelectionPage', () => {
  // Chặn XHR thật của danh sách cấu hình điểm (gây lỗi mạng lặp lại trong jsdom).
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', ResizeObserverStub);
    vi.spyOn(scoringConfigsApi, 'listAll').mockResolvedValue([]);
  });

  it('opens the criteria list with the selected period filter', async () => {
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

    fireEvent.doubleClick(await screen.findByText(period.name));
    await waitFor(() => {
      expect(screen.getByTestId('current-location')).toHaveTextContent(
        '/chuyen-vien/tieu-chi?periodFilter=period-1',
      );
    });
  });

  it('creates a period from the periods view', async () => {
    useAuthStore.setState({ user: { id: 'specialist-1', name: 'Chuyên viên', role: 'SPECIALIST' } });
    vi.spyOn(periodsApi, 'listAll').mockResolvedValue([period]);
    vi.spyOn(scoringConfigsApi, 'listAll').mockResolvedValue([scoringConfig]);
    const createPeriod = vi.spyOn(periodsApi, 'create').mockResolvedValue({ ...period, id: 'period-2' });
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/chuyen-vien/tieu-chi?view=periods']}>
          <CriteriaPeriodSelectionPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    fireEvent.click(await screen.findByRole('button', { name: /Thêm kỳ thi đua/i }));
    fireEvent.change(await screen.findByLabelText(/Năm bắt đầu/), { target: { value: '2027' } });
    fireEvent.change(screen.getByLabelText(/Năm kết thúc/), { target: { value: '2028' } });
    fireEvent.change(screen.getByLabelText(/Cấu hình điểm/), { target: { value: scoringConfig.id } });
    fireEvent.click(screen.getByRole('button', { name: 'Tạo kỳ' }));

    await waitFor(() => {
      expect(createPeriod).toHaveBeenCalledWith({
        startYear: 2027,
        endYear: 2028,
        name: null,
        status: 'Active',
        scoringConfigId: 'config-1',
        maxBonusPointPerPeriod: 5,
        maxBonusPointPerCriteria: 1,
      });
    });
  });

  it('lets locality users open a selected period without create or edit actions', async () => {
    vi.spyOn(periodsApi, 'listAll').mockResolvedValue([period]);
    const onOpenPeriod = vi.fn();
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/dia-phuong/tieu-chi']}>
          <CriteriaPeriodSelectionPage readOnly onOpenPeriod={onOpenPeriod} />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    fireEvent.click(await screen.findByText(period.name));
    expect(await screen.findByRole('button', { name: /Xem tiêu chí/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Thêm kỳ thi đua/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Chỉnh sửa kỳ/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Xem tiêu chí/ }));
    expect(onOpenPeriod).toHaveBeenCalledWith(period);
  });

  it('supports custom copy for a read-only period selection flow', async () => {
    vi.spyOn(periodsApi, 'listAll').mockResolvedValue([period]);
    const onOpenPeriod = vi.fn();
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/chuyen-vien/duyet']}>
          <CriteriaPeriodSelectionPage
            readOnly
            copy={{
              title: 'Chấm và thẩm định',
              description: 'Chọn kỳ thi đua để xem danh sách hồ sơ địa phương cần thẩm định.',
              openPeriodLabel: 'Xem',
              emptyDescription: 'Chưa có kỳ thi đua để chấm và thẩm định.',
              stickyDescription: 'Chọn một kỳ để xem hồ sơ địa phương.',
            }}
            onOpenPeriod={onOpenPeriod}
          />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByRole('heading', { name: 'Chấm và thẩm định' })).toBeInTheDocument();
    expect(screen.getByText('Chọn kỳ thi đua để xem danh sách hồ sơ địa phương cần thẩm định.')).toBeInTheDocument();
    fireEvent.doubleClick(await screen.findByText(period.name));
    await waitFor(() => expect(onOpenPeriod).toHaveBeenCalledWith(period));
  });

  it('selects a period before exposing the edit action', async () => {
    useAuthStore.setState({ user: { id: 'specialist-1', name: 'Chuyên viên', role: 'SPECIALIST' } });
    vi.spyOn(periodsApi, 'listAll').mockResolvedValue([period]);
    vi.spyOn(scoringConfigsApi, 'listAll').mockResolvedValue([scoringConfig]);
    const updatePeriod = vi.spyOn(periodsApi, 'update').mockResolvedValue({ ...period, endYear: 2031 });
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
    expect(screen.getByTestId('current-location')).toHaveTextContent('/chuyen-vien/tieu-chi?view=periods');
    fireEvent.click(await screen.findByRole('button', { name: /Chỉnh sửa kỳ/ }));
    expect(screen.getByTestId('current-location')).toHaveTextContent('/chuyen-vien/tieu-chi?view=periods');
    fireEvent.change(screen.getByLabelText(/Năm kết thúc/), { target: { value: '2031' } });
    fireEvent.change(screen.getByLabelText(/Cấu hình điểm/), { target: { value: scoringConfig.id } });
    fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }));

    await waitFor(() => {
      expect(updatePeriod).toHaveBeenCalledWith('period-1', {
        startYear: 2026,
        endYear: 2031,
        name: '2026-2030',
        status: 'Active',
        scoringConfigId: 'config-1',
        maxBonusPointPerPeriod: 5,
        maxBonusPointPerCriteria: 1,
      });
    });
  });

  it('sorts periods with active then published statuses first', async () => {
    const periods: PeriodApi[] = [
      { ...period, id: 'draft', name: 'Kỳ nháp', status: 'Draft' },
      { ...period, id: 'published', name: 'Kỳ đã công bố', status: 'Published' },
      { ...period, id: 'closed', name: 'Kỳ đã kết thúc', status: 'Closed' },
      { ...period, id: 'active', name: 'Kỳ đang áp dụng', status: 'Active' },
    ];
    vi.spyOn(periodsApi, 'listAll').mockResolvedValue(periods);
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/chuyen-vien/tieu-chi?view=periods']}>
          <CriteriaPeriodSelectionPage readOnly />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await screen.findByText('Kỳ nháp');
    fireEvent.click(screen.getByText('Trạng thái'));

    await waitFor(() => {
      expect(screen.getAllByText(/^Kỳ (đang áp dụng|đã công bố|nháp|đã kết thúc)$/).map((item) => item.textContent)).toEqual([
        'Kỳ đang áp dụng',
        'Kỳ đã công bố',
        'Kỳ nháp',
        'Kỳ đã kết thúc',
      ]);
    });
  });
});
