import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { ShieldCheck, UserRound, Phone } from 'lucide-react';
import { Button } from '@/components/core';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/store/authStore';
import { defaultRouteForRole } from '@/lib/rbac';
import { profileApi, profileDisplayName, profileNeedsCompletion } from './api/profileApi';

const schema = z.object({
  fullName: z.string().trim().min(2, 'Họ tên tối thiểu 2 ký tự.').max(200, 'Họ tên tối đa 200 ký tự.'),
  phone: z.string().trim().regex(/^\+?\d{8,15}$/, 'Số điện thoại gồm 8–15 chữ số.'),
});

type FormValues = z.infer<typeof schema>;

function extractError(error: unknown) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { errors?: Array<{ messages?: { vi?: string | null } | null }> } | undefined;
    return data?.errors?.[0]?.messages?.vi ?? 'Không lưu được thông tin. Vui lòng thử lại.';
  }
  return error instanceof Error ? error.message : 'Không lưu được thông tin. Vui lòng thử lại.';
}

/**
 * Form BẮT BUỘC sau login khi user thiếu fullName/phone (requiresProfileCompletion).
 * Không có nút đóng/bỏ qua — submit xong mới vào được app.
 */
export default function ProfileCompletionPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const requiresCompletion = useAuthStore((s) => s.requires_profile_completion);
  const fullName = useAuthStore((s) => s.full_name);
  const phone = useAuthStore((s) => s.phone);
  const setStore = useAuthStore((s) => s.setStore);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { fullName: fullName ?? '', phone: phone ?? '' },
  });

  if (!user) return <Navigate to={ROUTES.LOGIN} replace />;
  // Đã đủ thông tin (hoặc session cũ chưa check — ProfileGate sẽ đẩy lại nếu thiếu).
  if (requiresCompletion === false) return <Navigate to={defaultRouteForRole(user.role)} replace />;

  const onSubmit = async (values: FormValues) => {
    try {
      const profile = await profileApi.update({ fullName: values.fullName, phone: values.phone });
      setStore({
        full_name: profile.fullName,
        phone: profile.phone,
        requires_profile_completion: profileNeedsCompletion(profile),
        user: { ...user, name: profileDisplayName(profile) },
      });
      toast.success('Đã lưu thông tin người đại diện');
      navigate(defaultRouteForRole(user.role), { replace: true });
    } catch (error) {
      toast.error(extractError(error));
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-surface-muted px-4 py-10">
      <div className="w-full max-w-110 rounded-lg border border-border bg-card p-8 shadow-[0_18px_45px_rgba(0,32,96,0.12)] sm:p-10">
        <div className="space-y-3 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border-2 border-primary/20 bg-primary/5">
            <ShieldCheck className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Hoàn thiện hồ sơ</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Tài khoản chưa có thông tin người đại diện. Vui lòng nhập họ tên và số điện thoại để tiếp tục sử dụng hệ thống.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="pc-fullname">
              Họ tên người đại diện <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <UserRound className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="pc-fullname"
                placeholder="VD: Nguyễn Văn A"
                className="h-10 pl-10"
                autoComplete="name"
                autoFocus
                {...register('fullName')}
              />
            </div>
            {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pc-phone">
              Số điện thoại <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="pc-phone"
                type="tel"
                placeholder="VD: 0901234567"
                className="h-10 pl-10"
                autoComplete="tel"
                {...register('phone')}
              />
            </div>
            {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
          </div>

          <Button type="submit" size="lg" disabled={isSubmitting} className="h-10 w-full text-sm font-semibold">
            {isSubmitting ? 'Đang lưu…' : 'Lưu và tiếp tục'}
          </Button>
        </form>

        <p className="mt-5 text-center text-xs text-muted-foreground">
          Thông tin này dùng làm tên hiển thị trong lịch sử thao tác và kết quả công bố.
        </p>
      </div>
    </div>
  );
}
