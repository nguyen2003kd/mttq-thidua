import { ApprovalPage } from '@/features/duyet/components/ApprovalPage';
import { Check } from 'lucide-react';

export default function CouncilApprovalPage() {
  return (
    <ApprovalPage
      targetState="CHO_DUYET_HOI_DONG"
      title="Duyệt — Hội đồng TĐKT"
      description="Xem xét kết quả từ Ban và chuyển lên Ban thường trực. Chủ tịch Hội đồng có quyền duyệt."
      emptyTitle="Không có hồ sơ chờ duyệt"
      emptyDescription="Hiện chưa có địa phương nào đến bước chờ Hội đồng TĐKT."
      emptyIcon={Check}
      approveLabel="Duyệt"
      approveAction="approve"
      approveIcon={Check}
      approveClassName="text-success hover:bg-success/10"
      approveSuccessMessage={(name) => `${name} chuyển sang chờ Ban thường trực.`}
      rejectSuccessMessage={(name) => `${name} đã được trả về Ban.`}
      requireChair
    />
  );
}
