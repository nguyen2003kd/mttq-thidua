import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button, PageHeader, PageLoading, EmptyState } from '@/components/core';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store/authStore';
import { profileApi, profileDisplayName, profileNeedsCompletion } from './api/profileApi';

const schema = z.object({
  fullName: z.string().trim().min(2, 'Họ tên tối thiểu 2 ký tự.').max(200, 'Họ tên tối đa 200 ký tự.'),
  phone: z.string().trim().regex(/^\+?\d{8,15}$/, 'Số điện thoại gồm 8–15 chữ số.'),
});

type FormValues = z.infer<typeof schema>;

const roleLabels: Record<string, string> = {
  LOCAL: 'Địa phương',
  LOCALITY: 'Địa phương',
  SPECIALIST: 'Chuyên viên',
  LEADER: 'Lãnh đạo',
  BAN_LEADER: 'Lãnh đạo',
  COUNCIL: 'Hội đồng',
  COMMITTEE: 'Ủy ban',
  STANDING_COMMITTEE: 'Ủy ban',
  ADMIN: 'Quản trị',
  SYSTEM_ADMIN: 'Quản trị hệ thống',
  USER: 'Người dùng',
};

const statusLabels: Record<string, string> = {
  Active: 'Hoạt động',
  Inactive: 'Ngừng hoạt động',
  Suspended: 'Tạm khóa',
  PendingVerification: 'Chờ xác thực',
};

function extractError(error: unknown) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { errors?: Array<{ messages?: { vi?: string | null } | null }> } | undefined;
    return data?.errors?.[0]?.messages?.vi ?? 'Không lưu được thông tin. Vui lòng thử lại.';
  }
  return error instanceof Error ? error.message : 'Không lưu được thông tin. Vui lòng thử lại.';
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1.5">
      <p className="text-[13px] font-medium text-muted-foreground">{label}</p>
      <p className="rounded-md border border-border bg-surface-muted px-3 py-2 text-sm text-foreground">{value || '—'}</p>
    </div>
  );
}

/** Trang Tài khoản — xem thông tin đăng nhập (read-only) + sửa họ tên/SĐT người đại diện. */
export default function AccountPage() {
  const user = useAuthStore((s) => s.user);
  const setStore = useAuthStore((s) => s.setStore);

  const profileQuery = useQuery({ queryKey: ['auth-profile'], queryFn: () => profileApi.get() });
  const profile = profileQuery.data;

  const { register, handleSubmit, reset, formState: { errors, isSubmitting, isDirty } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { fullName: '', phone: '' },
  });

  useEffect(() => {
    if (profile) reset({ fullName: profile.fullName ?? '', phone: profile.phone ?? '' });
  }, [profile, reset]);

  const onSubmit = async (values: FormValues) => {
    try {
      const updated = await profileApi.update({ fullName: values.fullName, phone: values.phone });
      setStore({
        full_name: updated.fullName,
        phone: updated.phone,
        requires_profile_completion: profileNeedsCompletion(updated),
        ...(user ? { user: { ...user, name: profileDisplayName(updated) } } : {}),
      });
      reset({ fullName: updated.fullName ?? '', phone: updated.phone ?? '' });
      toast.success('Đã cập nhật thông tin người đại diện');
    } catch (error) {
      toast.error(extractError(error));
    }
  };

  if (profileQuery.isPending) return <PageLoading label="Đang tải thông tin tài khoản…" />;
  if (profileQuery.isError || !profile) {
    return <EmptyState variant="error" title="Không tải được thông tin tài khoản" description="Vui lòng thử lại sau." />;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Thông tin tài khoản" description="Thông tin đăng nhập và người đại diện của tài khoản." />

      <section className="space-y-4 rounded-lg border border-border bg-card p-5">
        <h2 className="text-lg font-semibold text-foreground">Tài khoản đăng nhập</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ReadOnlyField label="Email" value={profile.email} />
          <ReadOnlyField label="Tên đăng nhập" value={profile.username ?? ''} />
          <div className="space-y-1.5">
            <p className="text-[13px] font-medium text-muted-foreground">Vai trò</p>
            <div className="flex min-h-9 flex-wrap items-center gap-1.5 rounded-md border border-border bg-surface-muted px-3 py-1.5">
              {profile.roles.length
                ? profile.roles.map((role) => (
                    <Badge key={role} variant="outline">{roleLabels[role.trim().toUpperCase()] ?? role}</Badge>
                  ))
                : <span className="text-sm text-foreground">—</span>}
            </div>
          </div>
          <ReadOnlyField label="Trạng thái" value={statusLabels[profile.status] ?? profile.status} />
        </div>
      </section>

      <section className="space-y-4 rounded-lg border border-border bg-card p-5">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Người đại diện</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Họ tên và số điện thoại dùng làm tên hiển thị trong lịch sử thao tác và kết quả công bố.
          </p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="acc-fullname">
                Họ tên người đại diện <span className="text-destructive">*</span>
              </Label>
              <Input id="acc-fullname" placeholder="VD: Nguyễn Văn A" autoComplete="name" {...register('fullName')} />
              {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="acc-phone">
                Số điện thoại <span className="text-destructive">*</span>
              </Label>
              <Input id="acc-phone" type="tel" placeholder="VD: 0901234567" autoComplete="tel" {...register('phone')} />
              {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting || !isDirty}>
              {isSubmitting ? 'Đang lưu…' : 'Lưu thay đổi'}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
