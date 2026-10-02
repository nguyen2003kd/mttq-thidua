import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { clustersApi } from '@/features/admin/api/clustersApi';
import { periodsApi } from '@/features/admin/api/periodsApi';
import { useAuthStore } from '@/store/authStore';
import { specialistApi, type SubmissionApi, type SubmissionResultItem } from '../api/specialistApi';
import SpecialistScoreSummaryPage from './SpecialistScoreSummaryPage';

vi.mock('./SpecialistReviewPage', () => ({
  default: ({ embeddedDetail }: {
    embeddedDetail?: { localityId: string; criteriaGroupId: string };
  }) => (
    <div
      data-testid="embedded-specialist-review"
      data-locality-id={embeddedDetail?.localityId}
      data-group-id={embeddedDetail?.criteriaGroupId}
    />
  ),
}));

class ResizeObserverStub {
  observe() {}
  disconnect() {}
}

const result: SubmissionResultItem = {
  id: 'result-1',
  submissionId: 'submission-1',
  criteriaId: 'criterion-1',
  criteriaContent: 'Tổ chức tuyên truyền pháp luật',
  snapshotMaxPoint: 10,
  snapshotMaxBonusPoint: 2,
  point: 8,
  bonusPoint: 1,
  officialPoint: 9,
  officialBonusPoint: 1,
  officialReason: null,
  explanation: 'Đã tổ chức hoạt động tại khu phố.',
  reviewStatus: 'Reviewed',
  files: [],
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: null,
};

const submission: SubmissionApi = {
  id: 'submission-1',
  criteriaGroupId: 'group-1',
  criteriaGroupName: 'An ninh trật tự',
  currentStage: 'ReviewerApproved',
  totalProposedPoint: 9,
  totalFinalPoint: 10,
  submittedAt: '2026-01-01T00:00:00Z',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: null,
  createdBy: '26362',
  createdByUsername: 'Phường Trảng Dài',
  createdByWardCode: '26362',
  localityFullName: 'Phường Trảng Dài',
  hasSubmission: true,
  results: [result],
};

function prepareQueries() {
  vi.spyOn(specialistApi, 'listAllSubmissions').mockResolvedValue({
    items: [submission],
    total: 1,
    page: 1,
    pageSize: 100,
  } as unknown as Awaited<ReturnType<typeof specialistApi.listAllSubmissions>>);
  vi.spyOn(specialistApi, 'getSubmission').mockResolvedValue(submission);
  vi.spyOn(periodsApi, 'listAll').mockResolvedValue([]);
  vi.spyOn(clustersApi, 'list').mockResolvedValue([]);
}

function renderPage(readOnly = false) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/chuyen-vien/tong-hop-cham-diem']}>
        <SpecialistScoreSummaryPage readOnly={readOnly} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  useAuthStore.getState().resetStore();
});

describe('SpecialistScoreSummaryPage detail modal', () => {
  it('opens the selected group directly in specialist review without a comparison tab', async () => {
    vi.stubGlobal('ResizeObserver', ResizeObserverStub);
    prepareQueries();
    useAuthStore.setState({ user: { id: 'reviewer-1', name: 'Chuyên viên duyệt', role: 'REVIEWER' } });
    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: /Phường Trảng Dài/ }));
    fireEvent.click(await screen.findByRole('button', { name: /An ninh trật tự/ }));
    expect(await screen.findByRole('dialog')).toHaveClass('h-[calc(100dvh-2rem)]');
    expect(screen.getByRole('dialog')).toHaveClass('sm:max-w-[1880px]');
    expect(await screen.findByTestId('embedded-specialist-review')).toHaveAttribute('data-locality-id', '26362');
    expect(screen.getByTestId('embedded-specialist-review')).toHaveAttribute('data-group-id', 'group-1');
    expect(screen.queryByRole('tab', { name: 'Đối chiếu điểm' })).not.toBeInTheDocument();
    expect(specialistApi.getSubmission).not.toHaveBeenCalled();
  });

  it('does not offer review actions from a read-only summary route', async () => {
    vi.stubGlobal('ResizeObserver', ResizeObserverStub);
    prepareQueries();
    useAuthStore.setState({ user: { id: 'specialist-1', name: 'Chuyên viên', role: 'SPECIALIST' } });
    renderPage(true);

    fireEvent.click(await screen.findByRole('button', { name: /Phường Trảng Dài/ }));
    fireEvent.click(await screen.findByRole('button', { name: /An ninh trật tự/ }));

    expect(screen.queryByRole('tab', { name: 'Thẩm định' })).not.toBeInTheDocument();
    expect(screen.getByRole('dialog')).toHaveClass('sm:max-w-6xl');
    expect(screen.getByText('Địa phương đề xuất')).toBeInTheDocument();
  });
});
