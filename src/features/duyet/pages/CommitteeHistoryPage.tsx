import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/core';
import { AuditLogView } from '@/features/audit/AuditLogPage';

/** COL.01.12 — Lịch sử thao tác của Ủy ban thường trực: bảng + modal audit log, chỉ thấy log của mình. */
export default function CommitteeHistoryPage() {
  return (
    <AuditLogView
      title="Lịch sử thao tác"
      description="Các thay đổi do tài khoản của bạn thực hiện trong hệ thống."
      actions={
        <Button variant="outline" render={<Link to="/thi-dua/duyet/ban-thuong-truc" />} nativeButton={false}>
          <ArrowLeft className="mr-1.5 size-4" />Quay lại danh sách
        </Button>
      }
    />
  );
}
