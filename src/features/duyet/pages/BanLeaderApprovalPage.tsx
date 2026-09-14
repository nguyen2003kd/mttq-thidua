import { ApprovalPage } from '@/features/duyet/components/ApprovalPage';
import { Check } from 'lucide-react';

export default function BanLeaderApprovalPage() {
  return (
    <ApprovalPage
      targetState="CHO_DUYET_BAN"
      title="Danh sách địa phương"
      description="Các hồ sơ đang chờ Lãnh đạo ban thẩm định và phê duyệt."
      emptyTitle="Không có hồ sơ chờ duyệt"
      emptyDescription="Hiện chưa có địa phương nào nộp bảng điểm để Ban xem xét."
      emptyIcon={Check}
      approveLabel="Duyệt"
      approveAction="approve"
      approveIcon={Check}
      approveClassName="text-success hover:bg-success/10"
      approveSuccessMessage={(name) => `${name} chuyển sang chờ Hội đồng TĐKT.`}
      rejectSuccessMessage={(name) => `${name} đã được trả về nháp.`}
      view="leader"
    />
  );
}
