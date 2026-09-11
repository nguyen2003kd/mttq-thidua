import { Link } from 'react-router-dom';
import { FileQuestion } from 'lucide-react';
import { Button, EmptyState } from '@/components/core';
import { useAuthStore } from '@/store/authStore';
import { defaultRouteForRole } from '@/lib/rbac';
import { ROUTES } from '@/constants/routes';

export default function NotFoundPage() {
  const user = useAuthStore((s) => s.user);
  const home = user ? defaultRouteForRole(user.role, user) : ROUTES.LOGIN;

  return (
    <div className="min-h-dvh flex items-center justify-center bg-background p-6">
      <EmptyState
        icon={<FileQuestion className="h-8 w-8" />}
        title="Không tìm thấy trang"
        description="Đường dẫn không tồn tại hoặc bạn không có quyền truy cập."
        action={
          <Button render={<Link to={home} />} nativeButton={false}>
            Về trang chính
          </Button>
        }
      />
    </div>
  );
}
