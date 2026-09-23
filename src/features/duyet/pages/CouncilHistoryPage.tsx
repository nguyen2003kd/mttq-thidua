import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/core';
import { AuditLogView } from '@/features/audit/AuditLogPage';

/** COL.01.10 — Lịch sử thao tác của Hội đồng: bảng + modal audit log, chỉ thấy log của mình. */
export default function CouncilHistoryPage() {
  return (
    <AuditLogView
      title="Lịch sử thao tác"
      description="Các thay đổi do tài khoản của bạn thực hiện trong hệ thống."
      actions={
        <Button variant="outline" render={<Link to="/thi-dua/duyet/hoi-dong-tdkt" />} nativeButton={false}>
          <ArrowLeft className="mr-1.5 size-4" />Quay lại danh sách
        </Button>
      }
    />
  );
}
