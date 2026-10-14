import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getGetApiV1AuthProfileQueryKey } from '@/api/endpoints/auth';
import { getGetApiV1UsersQueryKey } from '@/api/endpoints/users';
import { dataQueryKey } from '@/api/mutator/query-keys';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { mainInstance } from '@/api/mutator/custom-instance';
import { ShieldCheck, UserRound, Phone, KeyRound, Eye, EyeOff } from 'lucide-react';
import { Button, PageLoading } from '@/components/core';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/store/authStore';
import { defaultRouteForRole } from '@/lib/rbac';
import { profileApi, profileDisplayName, profileNeedsCompletion } from './api/profileApi';

const MIN_PASSWORD_LENGTH = 6;

/** mustChangePassword = tài khoản vẫn dùng mật khẩu khởi tạo → đổi mật khẩu là BẮT BUỘC. */
function makeSchema(mustChangePassword: boolean) {
  return z.object({
    fullName: z.string().trim().min(2, 'Họ tên tối thiểu 2 ký tự.').max(200, 'Họ tên tối đa 200 ký tự.'),
    phone: z.string().trim().regex(/^\+?\d{8,15}$/, 'Số điện thoại gồm 8–15 chữ số.'),
    oldPassword: z.string().optional(),
    newPassword: z.string().optional(),
    confirmPassword: z.string().optional(),
  })
    .refine((v) => !(mustChangePassword || v.newPassword) || Boolean(v.oldPassword), { path: ['oldPassword'], message: 'Vui lòng nhập mật khẩu hiện tại.' })
    .refine((v) => !(mustChangePassword || v.newPassword) || Boolean(v.newPassword && v.newPassword.length >= MIN_PASSWORD_LENGTH), { path: ['newPassword'], message: `Mật khẩu mới tối thiểu ${MIN_PASSWORD_LENGTH} ký tự.` })
    .refine((v) => !(mustChangePassword || v.newPassword) || (v.newPassword?.length ?? 0) <= 128, { path: ['newPassword'], message: 'Mật khẩu mới tối đa 128 ký tự.' })
    .refine((v) => !(mustChangePassword || v.newPassword) || v.newPassword === v.confirmPassword, { path: ['confirmPassword'], message: 'Mật khẩu nhập lại không khớp.' });
}

type FormValues = z.infer<ReturnType<typeof makeSchema>>;

function extractError(error: unknown, fallback = 'Không lưu được thông tin. Vui lòng thử lại.') {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { errors?: Array<{ messages?: { vi?: string | null } | null }> } | undefined;
    return data?.errors?.[0]?.messages?.vi ?? fallback;
  }
  return error instanceof Error ? error.message : fallback;
}

/**
 * Form BẮT BUỘC sau login khi user thiếu fullName/phone (requiresProfileCompletion).
 * Không có nút đóng/bỏ qua — submit xong mới vào được app.
 */
export default function ProfileCompletionPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const user = useAuthStore((s) => s.user);
  const requiresCompletion = useAuthStore((s) => s.requires_profile_completion);
  const fullName = useAuthStore((s) => s.full_name);
  const phone = useAuthStore((s) => s.phone);
  const setStore = useAuthStore((s) => s.setStore);
  const profileQuery = useQuery({
    queryKey: dataQueryKey(getGetApiV1AuthProfileQueryKey(), user?.id ?? ''),
    queryFn: () => profileApi.get(),
    enabled: Boolean(user) && requiresCompletion !== false,
  });

  const mustChangePassword = profileQuery.data?.mustChangePassword ?? false;
  const schema = useMemo(() => makeSchema(mustChangePassword), [mustChangePassword]);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting, isDirty } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { fullName: profileQuery.data?.fullName ?? fullName ?? '', phone: profileQuery.data?.phone ?? phone ?? '' },
  });

  useEffect(() => {
    const profile = profileQuery.data;
    const currentUser = useAuthStore.getState().user;
    if (!profile || !currentUser) return;
    const needsCompletion = profileNeedsCompletion(profile);
    setStore({
      first_name: profile.firstName,
      last_name: profile.lastName,
      full_name: profile.fullName,
      phone: profile.phone,
      ward_code: profile.wardCode,
      requires_profile_completion: needsCompletion,
      user: { ...currentUser, name: profileDisplayName(profile), banId: profile.departmentId ?? undefined },
    });
    if (!isDirty) reset({ fullName: profile.fullName ?? '', phone: profile.phone ?? '' });
  }, [profileQuery.data, reset, setStore, isDirty]);

  if (!user) return <Navigate to={ROUTES.LOGIN} replace />;
  // Đã đủ thông tin (hoặc session cũ chưa check — ProfileGate sẽ đẩy lại nếu thiếu).
  if (requiresCompletion === false) return <Navigate to={defaultRouteForRole(user.role)} replace />;
  if (profileQuery.isLoading || (profileQuery.data && !profileNeedsCompletion(profileQuery.data))) {
    return <PageLoading label="Đang kiểm tra thông tin hồ sơ…" />;
  }

  const onSubmit = async (values: FormValues) => {
    try {
      const profile = await profileApi.update({ fullName: values.fullName, phone: values.phone });
      queryClient.setQueryData(dataQueryKey(getGetApiV1AuthProfileQueryKey(), user.id), profile);
      setStore({
        full_name: profile.fullName,
        phone: profile.phone,
        requires_profile_completion: profileNeedsCompletion(profile),
        user: { ...user, name: profileDisplayName(profile) },
      });
      await queryClient.invalidateQueries({ queryKey: getGetApiV1UsersQueryKey() });
      toast.success('Đã lưu thông tin người đại diện');

      // Đổi mật khẩu ngay lần đầu đăng nhập (tùy chọn) — lỗi thì ở lại để sửa, hồ sơ đã lưu thành công.
      if (values.newPassword) {
        try {
          await mainInstance({
            url: '/api/v1/auth/change-password',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            data: { oldPassword: values.oldPassword ?? '', newPassword: values.newPassword },
          });
          toast.success('Đã đổi mật khẩu');
        } catch (error) {
          toast.error(extractError(error, 'Không đổi được mật khẩu. Vui lòng thử lại.'));
          return;
        }
      }

      navigate(defaultRouteForRole(user.role), { replace: true });
    } catch (error) {
      toast.error(extractError(error));
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-surface-muted px-4 py-10">
      <div className="w-full max-w-lg rounded-lg border border-border bg-card p-8 shadow-[0_18px_45px_hsl(var(--foreground)/0.12)] sm:p-10">
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

          <div className="space-y-3 rounded-lg border border-border bg-surface-muted/50 p-4">
            <div className="flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold text-foreground">Đổi mật khẩu {mustChangePassword && <span className="text-destructive">*</span>}</p>
              <span className="text-xs text-muted-foreground">{mustChangePassword ? '(bắt buộc — tài khoản vẫn dùng mật khẩu khởi tạo)' : '(nên đổi ngay lần đầu đăng nhập)'}</span>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pc-old-password">Mật khẩu hiện tại {mustChangePassword && <span className="text-destructive">*</span>}</Label>
              <div className="relative">
                <Input
                  id="pc-old-password"
                  type={showOldPassword ? 'text' : 'password'}
                  placeholder="Nhập mật khẩu đang dùng"
                  className="h-10 pr-10"
                  autoComplete="current-password"
                  {...register('oldPassword')}
                />
                <button
                  type="button"
                  onClick={() => setShowOldPassword((v) => !v)}
                  className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted"
                  aria-label={showOldPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showOldPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {errors.oldPassword && <p className="text-xs text-destructive">{errors.oldPassword.message}</p>}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="pc-new-password">Mật khẩu mới {mustChangePassword && <span className="text-destructive">*</span>}</Label>
                <div className="relative">
                  <Input
                    id="pc-new-password"
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="Tối thiểu 6 ký tự"
                    className="h-10 pr-10"
                    autoComplete="new-password"
                    {...register('newPassword')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((v) => !v)}
                    className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted"
                    aria-label={showNewPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showNewPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {errors.newPassword && <p className="text-xs text-destructive">{errors.newPassword.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pc-confirm-password">Nhập lại mật khẩu mới {mustChangePassword && <span className="text-destructive">*</span>}</Label>
                <div className="relative">
                  <Input
                    id="pc-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Nhập lại mật khẩu"
                    className="h-10 pr-10"
                    autoComplete="new-password"
                    {...register('confirmPassword')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted"
                    aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
              </div>
            </div>
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
