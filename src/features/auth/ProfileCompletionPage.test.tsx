import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/store/authStore';
import type { UserProfile } from './api/profileApi';
import { profileApi } from './api/profileApi';
import ProfileCompletionPage from './ProfileCompletionPage';

const savedProfile: UserProfile = {
  id: 'user-1',
  email: 'scorer@example.gov.vn',
  username: 'scorer',
  firstName: 'Nhẩn',
  lastName: 'Bùi',
  fullName: 'Bùi Lê Hoàng Nhẩn',
  phone: '0800000000',
  wardCode: null,
  departmentId: 'department-1',
  departmentName: 'Ban Dân chủ',
  avatarId: null,
  status: 'Active',
  roles: ['SCORER'],
  permissions: [],
};

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  useAuthStore.getState().resetStore();
});

describe('ProfileCompletionPage', () => {
  it('loads a saved profile before asking the user to complete it', async () => {
    vi.spyOn(profileApi, 'get').mockResolvedValue(savedProfile);
    useAuthStore.setState({
      isSignedIn: true,
      user: { id: savedProfile.id, name: savedProfile.username!, role: 'SCORER' },
      requires_profile_completion: true,
      full_name: null,
      phone: null,
    });

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[ROUTES.PROFILE_COMPLETION]}>
          <Routes>
            <Route path={ROUTES.PROFILE_COMPLETION} element={<ProfileCompletionPage />} />
            <Route path="*" element={<div>Trang làm việc</div>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByText('Trang làm việc')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Hoàn thiện hồ sơ' })).not.toBeInTheDocument();
    expect(useAuthStore.getState().requires_profile_completion).toBe(false);
    expect(useAuthStore.getState().full_name).toBe(savedProfile.fullName);
    expect(useAuthStore.getState().phone).toBe(savedProfile.phone);
  });
});
