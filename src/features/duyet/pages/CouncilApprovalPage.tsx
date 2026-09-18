import { ApprovalPage } from '@/features/duyet/components/ApprovalPage';
import { Check } from 'lucide-react';

export default function CouncilApprovalPage() {
  return (
    <ApprovalPage
      targetState="CHO_DUYET_HOI_DONG"
      title="Danh sách địa phương chờ Hội đồng duyệt"
      description="Xem điểm tổng, đọc hồ sơ và thực hiện duyệt, nhận xét hoặc yêu cầu Chuyên viên bổ sung."
      emptyTitle="Không có hồ sơ chờ duyệt"
      emptyDescription="Hiện chưa có địa phương nào đến bước chờ Hội đồng TĐKT."
      emptyIcon={Check}
      approveLabel="Duyệt & gửi Ủy ban"
      approveAction="approve"
      approveIcon={Check}
      approveClassName="text-success hover:bg-success/10"
      approveSuccessMessage={(name) => `${name} đã được gửi lên Ủy ban thường trực.`}
      rejectSuccessMessage={(name) => `${name} đã được gửi yêu cầu về Chuyên viên để xử lý.`}
      requireChair
      useConfirmDialog
      confirmDescription="Duyệt và gửi hồ sơ này lên Ủy ban thường trực? Sau khi duyệt, Hội đồng chỉ còn có thể xem lịch sử hồ sơ."
      view="council"
      readOnlyDetail
      enableComment
      historyPath="/hoi-dong/lich-su"
    />
  );
}
