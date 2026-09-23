import { ArrowLeft } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/core';
import { AuditLogView } from '@/features/audit/AuditLogPage';

/** COL.01.08 — Lịch sử thao tác của Lãnh đạo ban: bảng + modal audit log, chỉ thấy log của mình. */
export default function BanLeaderHistoryPage() {
  const { banId = 'ban1' } = useParams<{ banId?: string }>();
  return (
    <AuditLogView
      title="Lịch sử thao tác"
      description="Các thay đổi do tài khoản của bạn thực hiện trong hệ thống."
      actions={
        <Button variant="outline" render={<Link to={`/thi-dua/duyet/lanh-dao-ban/${banId}`} />} nativeButton={false}>
          <ArrowLeft className="mr-1.5 size-4" />Quay lại danh sách
        </Button>
      }
    />
  );
}
