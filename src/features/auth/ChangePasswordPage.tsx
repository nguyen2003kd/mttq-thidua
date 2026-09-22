import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { Eye, EyeOff, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import { Button, PageHeader } from '@/components/core';
import { Input } from '@/components/ui/input';
import { mainInstance } from '@/api/mutator/custom-instance';
import { useAuthStore } from '@/store/authStore';

const MIN_PASSWORD_LENGTH = 6;
const MAX_PASSWORD_LENGTH = 128;

interface ApiErrorResponse {
  errors?: Array<{ messages?: { vi?: string | null; en?: string | null } | null } | null> | null;
}

interface ChangePasswordResponse {
  success?: boolean;
  data?: { changed?: boolean; message?: { vi?: string | null; en?: string | null } | null } | null;
}

function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiErrorResponse | undefined;
    return data?.errors?.[0]?.messages?.vi ?? 'Không thể đổi mật khẩu. Vui lòng thử lại.';
  }
  return error instanceof Error ? error.message : 'Không thể đổi mật khẩu. Vui lòng thử lại.';
}

/** POST /api/v1/auth/change-password — token tự gắn qua interceptor. */
function postApiV1AuthChangePassword(body: { oldPassword: string; newPassword: string }) {
  return mainInstance<ChangePasswordResponse>({
    url: '/api/v1/auth/change-password',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
  });
}

export default function ChangePasswordPage() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [oldPassword, setOldPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: (body: { oldPassword: string; newPassword: string }) => postApiV1AuthChangePassword(body),
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!oldPassword) {
      setError('Vui lòng nhập mật khẩu hiện tại.');
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Mật khẩu mới phải có ít nhất ${MIN_PASSWORD_LENGTH} ký tự.`);
      return;
    }
    if (password.length > MAX_PASSWORD_LENGTH) {
      setError(`Mật khẩu mới tối đa ${MAX_PASSWORD_LENGTH} ký tự.`);
      return;
    }
    if (password !== confirm) {
      setError('Xác nhận mật khẩu không khớp.');
      return;
    }
    setError('');
    mutation.mutate({ oldPassword, newPassword: password }, {
      onSuccess: (response) => {
        toast.success(response?.data?.message?.vi ?? 'Đổi mật khẩu thành công', { description: 'Lần đăng nhập sau vui lòng dùng mật khẩu mới.' });
        setOldPassword('');
        setPassword('');
        setConfirm('');
        navigate(-1);
      },
      onError: (err) => {
        setError(extractErrorMessage(err));
      },
    });
  };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <PageHeader
        title="Đổi mật khẩu"
        description="Cập nhật mật khẩu đăng nhập của tài khoản."
        actions={<Button variant="outline" onClick={() => navigate(-1)}>Quay lại</Button>}
      />

      <form onSubmit={handleSubmit} className="space-y-5 rounded-[10px] border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/4 px-3 py-2.5">
          <KeyRound className="size-4 shrink-0 text-primary" />
          <p className="text-sm text-muted-foreground">
            Đang đổi mật khẩu cho tài khoản <span className="font-semibold text-foreground">{user?.name ?? '—'}</span>
          </p>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="old-password" className="text-[13px] font-medium">Mật khẩu hiện tại <span className="text-destructive">*</span></label>
          <div className="relative">
            <Input
              id="old-password"
              type={showOldPassword ? 'text' : 'password'}
              value={oldPassword}
              onChange={(event) => setOldPassword(event.target.value)}
              placeholder="Nhập mật khẩu hiện tại"
              autoComplete="current-password"
              className="pr-10"
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
        </div>

        <div className="space-y-1.5">
          <label htmlFor="new-password" className="text-[13px] font-medium">Mật khẩu mới <span className="text-destructive">*</span></label>
          <div className="relative">
            <Input
              id="new-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Nhập mật khẩu mới"
              autoComplete="new-password"
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted"
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">Tối thiểu {MIN_PASSWORD_LENGTH} ký tự, tối đa {MAX_PASSWORD_LENGTH} ký tự, không chứa email/họ tên và không trùng 5 mật khẩu gần nhất.</p>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="confirm-password" className="text-[13px] font-medium">Nhập lại mật khẩu mới <span className="text-destructive">*</span></label>
          <div className="relative">
            <Input
              id="confirm-password"
              type={showConfirm ? 'text' : 'password'}
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              placeholder="Nhập lại mật khẩu mới"
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted"
              aria-label={showConfirm ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            >
              {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        {error && (
          <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">{error}</p>
        )}

        <div className="flex justify-end gap-2 border-t pt-4">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>Hủy</Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Đang lưu…' : 'Đổi mật khẩu'}
          </Button>
        </div>
      </form>
    </div>
  );
}
