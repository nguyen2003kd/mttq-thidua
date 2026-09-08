import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '@/store/authStore';
import { loginWeb } from '@/api/endpoints/authentication';
import { Button } from '@/components/core';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Eye, EyeOff, Lock, User, Star, ShieldCheck } from 'lucide-react';
import type { Role } from '@/types/rbac';
import { defaultRouteForRole } from '@/lib/rbac';

const APP_ROLES: Role[] = [
  'ADMIN',
  'LOCALITY',
  'SPECIALIST',
  'BAN_LEADER',
  'COUNCIL_CHAIR',
  'COUNCIL_VICE',
  'STANDING_COMMITTEE',
];

function resolveAppRole(roles: string[]): Role | null {
  for (const role of roles) {
    const normalizedRole = role.trim().toUpperCase().replace(/[-\s]/g, '_');
    if (APP_ROLES.includes(normalizedRole as Role)) return normalizedRole as Role;
    if (normalizedRole === 'ADMIN' || normalizedRole === 'SYSTEM_ADMIN') return 'ADMIN';
  }

  return null;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const setStore = useAuthStore((s) => s.setStore);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast.error('Vui lòng nhập đầy đủ tài khoản và mật khẩu');
      return;
    }
    setLoading(true);

    try {
      const response = await loginWeb({
        email: username.trim(),
        password,
        device_info: { platform: 'web' },
      });
      const loginData = response.data;
      const role = loginData ? resolveAppRole(loginData.user.roles) : null;

      if (!response.success || !loginData || !role) {
        throw new Error(
          role ? 'Không thể xác thực phiên đăng nhập.' : 'Tài khoản chưa được gán vai trò trong hệ thống thi đua.',
        );
      }

      const { user, session } = loginData;
      const name = [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username || user.email;
      setStore({
        isSignedIn: true,
        id: user.id,
        email: user.email,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        roles: user.roles,
        permissions: user.permissions,
        status: user.status,
        last_login_at: user.last_login_at ?? null,
        session: {
          id: session.id,
          expires_at: session.expires_at,
          refresh_expires_at: session.refresh_expires_at,
        },
        access_token: loginData.access_token ?? null,
        refresh_token: loginData.refresh_token ?? null,
        expires_in: session.expires_in,
        refresh_expires_in:session.refresh_expires_in,
        token_type: session.token_type,
        access_token_expires_at: new Date(Date.now() + session.expires_in * 1000),
        refresh_token_expires_at: new Date(Date.now() + session.refresh_expires_in * 1000),
        storedUsername: remember ? user.email : null,
        user: { id: user.id, name, role },
      });
      toast.success('Đăng nhập thành công', { description: 'Đang chuyển đến trang làm việc...' });
      navigate(defaultRouteForRole(role));
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? ((error.response?.data as { message?: string } | undefined)?.message ?? 'Email hoặc mật khẩu không đúng.')
        : error instanceof Error
          ? error.message
          : 'Không thể đăng nhập. Vui lòng thử lại.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Brand Panel — Left background image */}
      <div
        className="hidden lg:flex lg:w-[45%] xl:w-[48%] relative overflow-hidden bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/login-left.png')" }}
      >
        <div className="absolute inset-0 bg-primary/30" aria-hidden="true" />

        <div className="relative flex flex-col justify-between p-12 xl:p-16 text-white w-full z-10">
          {/* Logo area */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-14 h-14 rounded-full border-2 border-accent bg-white/10 backdrop-blur-sm">
              <Star className="w-7 h-7 text-accent fill-accent" />
            </div>
            <div>
              <p className="font-bold text-lg leading-tight">MTTQ Việt Nam</p>
              <p className="text-xs text-white/70">Mặt trận Tổ quốc Việt Nam</p>
            </div>
          </div>

          {/* Hero text */}
          <div className="space-y-6">
            <div className="space-y-3">
              <h1 className="text-4xl xl:text-5xl font-bold tracking-tight leading-[1.1]">
                Thi đua
                <br />
                Khen thưởng
              </h1>
              <div className="h-1 w-20 bg-accent rounded-full" />
            </div>
            <p className="text-lg text-white/80 max-w-md leading-relaxed">
              Hệ thống quản lý thi đua, khen thưởng — minh bạch, công bằng, hiện đại.
            </p>
            <p className="text-base text-accent font-medium italic">
              "Vinh danh xứng tầm — Ghi nhận minh bạch"
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center gap-2 text-xs text-white/60">
            <ShieldCheck className="w-4 h-4" />
            <span>Hệ thống nội bộ — Cổng thông tin điện tử MTTQ Việt Nam</span>
          </div>
        </div>
      </div>

      {/* Form Panel — Right background image */}
      <div
        className="flex-1 flex flex-col items-center justify-center px-6 py-12 sm:px-12 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/login-right.png')" }}
      >
        <div className="w-full max-w-[440px]">
          {/* Form card */}
          <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-2xl border border-white/60 p-8 sm:p-10 space-y-7">
            {/* Header */}
            <div className="space-y-3 text-center">
              <div className="mx-auto w-14 h-14 rounded-full border-2 border-primary/20 bg-primary/5 flex items-center justify-center">
                <ShieldCheck className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-foreground">Đăng nhập</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Vui lòng đăng nhập để tiếp tục vào hệ thống
                </p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-5">
              {/* Username */}
              <div className="space-y-1.5">
                <label htmlFor="username" className="text-sm font-medium">
                  Email
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="username"
                    type="email"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Nhập email"
                    className="pl-10 h-10"
                    autoComplete="username"
                    autoFocus
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label htmlFor="password" className="text-sm font-medium">
                  Mật khẩu
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu"
                    className="pl-10 pr-10 h-10"
                    autoComplete="current-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {/* Remember + Forgot */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                  <Checkbox checked={remember} onCheckedChange={(v) => setRemember(!!v)} />
                  <span>Ghi nhớ đăng nhập</span>
                </label>
                <Button
                  type="button"
                  variant="link"
                  className="text-sm text-primary hover:text-primary/80 font-medium h-auto p-0"
                  onClick={() => toast.info('Liên hệ quản trị viên để đặt lại mật khẩu')}
                >
                  Quên mật khẩu?
                </Button>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                size="lg"
                disabled={loading}
                className="w-full h-10 text-sm font-semibold bg-gradient-to-r from-primary to-[hsl(355,74%,40%)] shadow-md hover:shadow-lg transition-shadow"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Đang xử lý...
                  </span>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    Đăng nhập
                  </>
                )}
              </Button>
            </form>

            {/* Footer note */}
            <p className="text-center text-xs text-muted-foreground">
              © {new Date().getFullYear()} Mặt trận Tổ quốc Việt Nam — Bản quyền nội bộ
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
