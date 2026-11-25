import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FileCheck } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { APPROVAL_TABS, activeApprovalTab } from '@/components/layout/approvalTabs';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

/**
 * Thanh tab chuyển giữa các cấp trong chuỗi chấm/duyệt — chỉ hiển thị cho ADMIN,
 * khi đường dẫn hiện tại thuộc một trong các màn nghiệp vụ tương ứng.
 */
export function AdminApprovalTabs() {
  const role = useAuthStore((s) => s.user?.role);
  const location = useLocation();
  const navigate = useNavigate();

  const activeTab = useMemo(() => activeApprovalTab(location.pathname, location.search)?.value, [location.pathname, location.search]);

  if (role !== 'ADMIN' || !activeTab) return null;

  return (
    <div className="mb-5">
      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          const tab = APPROVAL_TABS.find((t) => t.value === value);
          if (tab) navigate(tab.to);
        }}
      >
        <TabsList
          variant="line"
          aria-label="Chọn cấp chấm/duyệt"
          className="!h-auto w-full flex-wrap justify-start gap-1 border-b border-border pb-2"
        >
          {APPROVAL_TABS.map(({ value, label }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="!flex-none h-10 rounded-md px-4 data-active:bg-primary/5 data-active:text-primary after:bg-primary"
            >
              <FileCheck className="size-4" aria-hidden="true" />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}
