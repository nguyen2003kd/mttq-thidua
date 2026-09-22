import { useState } from 'react';
import axios from 'axios';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Mail, KeyRound } from 'lucide-react';
import { AppDialog, Button } from '@/components/core';
import { Input } from '@/components/ui/input';
import {
  postApiV1AuthForgotPasswordRequest,
  postApiV1AuthForgotPasswordSubmit,
} from '@/api/endpoints/auth';

interface ApiEnvelope {
  success?: boolean;
  data?: { message?: { vi?: string | null; en?: string | null } | null } | null;
  errors?: Array<{ messages?: { vi?: string | null; en?: string | null } | null } | null> | null;
}

function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiEnvelope | undefined;
    return data?.errors?.[0]?.messages?.vi ?? 'Không thể thực hiện. Vui lòng thử lại.';
  }
  return error instanceof Error ? error.message : 'Không thể thực hiện. Vui lòng thử lại.';
}

interface ForgotPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Dialog quên mật khẩu 2 bước: gửi OTP qua email → đặt lại mật khẩu bằng mã. */
export function ForgotPasswordDialog({ open, onOpenChange }: ForgotPasswordDialogProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');

  const requestMutation = useMutation({
    mutationFn: () => postApiV1AuthForgotPasswordRequest({ email }),
  });

  const submitMutation = useMutation({
    mutationFn: () => postApiV1AuthForgotPasswordSubmit({ email, code, newPassword }),
  });

  const pending = requestMutation.isPending || submitMutation.isPending;

  const close = () => {
    onOpenChange(false);
    setStep(1);
    setEmail('');
    setCode('');
    setNewPassword('');
    setConfirm('');
    setError('');
  };

  const handleRequest = (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim()) {
      setError('Vui lòng nhập email.');
      return;
    }
    setError('');
    requestMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success('Đã gửi mã xác thực qua email', { description: 'Vui lòng kiểm tra hộp thư để lấy mã.' });
        setStep(2);
        setError('');
      },
      onError: (err) => setError(extractErrorMessage(err)),
    });
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!code.trim()) {
      setError('Vui lòng nhập mã xác thực.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }
    if (newPassword !== confirm) {
      setError('Xác nhận mật khẩu không khớp.');
      return;
    }
    setError('');
    submitMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success('Đặt lại mật khẩu thành công', { description: 'Vui lòng đăng nhập bằng mật khẩu mới.' });
        close();
      },
      onError: (err) => setError(extractErrorMessage(err)),
    });
  };

  return (
    <AppDialog
      open={open}
      onOpenChange={(v) => { if (!v) close(); }}
      title="Quên mật khẩu"
      subtitle={step === 1 ? 'Nhập email để nhận mã xác thực' : 'Nhập mã xác thực và mật khẩu mới'}
      size="max-w-md sm:max-w-md"
      height="h-auto"
      hideFooter
    >
      {step === 1 ? (
        <form onSubmit={handleRequest} className="space-y-4">
          <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/4 px-3 py-2.5">
            <Mail className="size-4 shrink-0 text-primary" />
            <p className="text-sm text-muted-foreground">Hệ thống sẽ gửi mã xác thực về email của bạn.</p>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="forgot-email" className="text-[13px] font-medium">Email <span className="text-destructive">*</span></label>
            <Input
              id="forgot-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Nhập email đăng nhập"
              autoComplete="email"
            />
          </div>

          {error && (
            <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">{error}</p>
          )}

          <div className="flex justify-end gap-2 border-t pt-4">
            <Button type="button" variant="outline" onClick={close}>Hủy</Button>
            <Button type="submit" disabled={pending}>
              {requestMutation.isPending ? 'Đang gửi…' : 'Gửi mã xác thực'}
            </Button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/4 px-3 py-2.5">
            <KeyRound className="size-4 shrink-0 text-primary" />
            <p className="text-sm text-muted-foreground">
              Mã xác thực đã được gửi tới <span className="font-semibold text-foreground">{email}</span>
            </p>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="forgot-code" className="text-[13px] font-medium">Mã xác thực <span className="text-destructive">*</span></label>
            <Input
              id="forgot-code"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="Nhập mã trong email"
              autoComplete="one-time-code"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="forgot-new-password" className="text-[13px] font-medium">Mật khẩu mới <span className="text-destructive">*</span></label>
            <Input
              id="forgot-new-password"
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="Nhập mật khẩu mới"
              autoComplete="new-password"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="forgot-confirm" className="text-[13px] font-medium">Nhập lại mật khẩu mới <span className="text-destructive">*</span></label>
            <Input
              id="forgot-confirm"
              type="password"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              placeholder="Nhập lại mật khẩu mới"
              autoComplete="new-password"
            />
          </div>

          {error && (
            <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">{error}</p>
          )}

          <div className="flex justify-end gap-2 border-t pt-4">
            <Button type="button" variant="outline" onClick={() => { setStep(1); setError(''); }}>Quay lại</Button>
            <Button type="submit" disabled={pending}>
              {submitMutation.isPending ? 'Đang đặt lại…' : 'Đặt lại mật khẩu'}
            </Button>
          </div>
        </form>
      )}
    </AppDialog>
  );
}
