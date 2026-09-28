import { lazy, Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Building2, CalendarRange, Layers, Users } from 'lucide-react';
import { PageHeader, PageLoading } from '@/components/core';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const UserManagementPage = lazy(() => import('./UserManagementPage'));
const DepartmentManagementPage = lazy(() => import('./DepartmentManagementPage'));
const ClusterManagementPage = lazy(() => import('./ClusterManagementPage'));
const PeriodManagementPage = lazy(() => import('./PeriodManagementPage'));

const MANAGEMENT_TABS = [
  { value: 'tai-khoan', label: 'Tài khoản', icon: Users },
  { value: 'ban', label: 'Ban', icon: Building2 },
  { value: 'cum', label: 'Cụm', icon: Layers },
  { value: 'ky', label: 'Kỳ thi đua', icon: CalendarRange },
] as const;

type ManagementTab = (typeof MANAGEMENT_TABS)[number]['value'];

const MANAGEMENT_PAGES = {
  'tai-khoan': UserManagementPage,
  ban: DepartmentManagementPage,
  cum: ClusterManagementPage,
  ky: PeriodManagementPage,
} satisfies Record<ManagementTab, typeof UserManagementPage>;

function isManagementTab(value: string | null): value is ManagementTab {
  return MANAGEMENT_TABS.some((tab) => tab.value === value);
}

export default function AdminManagementPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const activeTab: ManagementTab = isManagementTab(requestedTab) ? requestedTab : 'tai-khoan';
  const ActivePage = MANAGEMENT_PAGES[activeTab];
  const activeLabel = MANAGEMENT_TABS.find((tab) => tab.value === activeTab)?.label ?? 'dữ liệu';

  return (
    <div className="space-y-5 pb-6">
      <PageHeader
        title="Quản lý hệ thống"
        description="Quản lý tài khoản, ban, cụm và kỳ thi đua tại một nơi."
      />

      <Tabs value={activeTab} onValueChange={(value) => setSearchParams({ tab: value })}>
        <TabsList
          variant="line"
          aria-label="Chọn nội dung quản lý"
          className="!h-auto w-full flex-wrap justify-start gap-1 border-b border-border pb-2"
        >
          {MANAGEMENT_TABS.map(({ value, label, icon: Icon }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="!flex-none h-10 rounded-md px-4 data-active:bg-primary/5 data-active:text-primary after:bg-primary"
            >
              <Icon className="size-4" aria-hidden="true" />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        {MANAGEMENT_TABS.map(({ value }) => (
          <TabsContent key={value} value={value} className="min-w-0 pt-3">
            {activeTab === value && (
              <Suspense fallback={<PageLoading label={`Đang tải ${activeLabel.toLowerCase()}…`} />}>
                <ActivePage embedded />
              </Suspense>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
