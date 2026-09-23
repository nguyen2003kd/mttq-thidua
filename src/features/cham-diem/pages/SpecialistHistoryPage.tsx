import { AuditLogView } from '@/features/audit/AuditLogPage';

/** Lịch sử thao tác của Chuyên viên — dùng chung bảng + modal audit log; backend chỉ trả log của chính user. */
export default function SpecialistHistoryPage() {
  return (
    <AuditLogView
      title="Lịch sử thao tác"
      description="Các thay đổi do tài khoản của bạn thực hiện trong hệ thống."
    />
  );
}
