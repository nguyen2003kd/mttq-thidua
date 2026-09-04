import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { ROUTES } from '@/constants/routes';
import { ROLE_LABELS } from '@/constants/enums';
import { Button } from '@/components/core';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Eye, EyeOff, Lock, User, Star, ShieldCheck } from 'lucide-react';
import type { Role } from '@/types/rbac';

const DEMO_ROLES: Role[] = ['ADMIN', 'LOCALITY', 'SPECIALIST', 'BAN_LEADER', 'COUNCIL_CHAIR', 'STANDING_COMMITTEE'];

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role>('ADMIN');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast.error('Vui lòng nhập đầy đủ tài khoản và mật khẩu');
      return;
    }
    setLoading(true);

    setTimeout(() => {
      const scope =
        selectedRole === 'LOCALITY'
          ? { localityId: 'dp1' }
          : selectedRole === 'BAN_LEADER'
            ? { banId: 'ban1' }
            : {};
      setAuth(
        { id: '1', name: username.trim(), role: selectedRole, ...scope },
        'mock-token',
        'mock-refresh',
      );
      toast.success(`Đăng nhập thành công với vai trò ${ROLE_LABELS[selectedRole]}`, {
        description: 'Chuyển đến Dashboard...',
      });
      const defaultRoute =
        selectedRole === 'LOCALITY'
          ? ROUTES.LOCALITY_TRANG_THAI
          : selectedRole === 'BAN_LEADER'
            ? `/thi-dua/duyet/lanh-dao-ban/${scope.banId ?? 'ban1'}`
            : selectedRole === 'COUNCIL_CHAIR' || selectedRole === 'COUNCIL_VICE'
              ? ROUTES.DUYET_COUNCIL
              : selectedRole === 'STANDING_COMMITTEE'
                ? ROUTES.DUYET_STANDING
                : ROUTES.DASHBOARD_OVERVIEW;
      navigate(defaultRoute);
      setLoading(false);
    }, 600);
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
                  Tài khoản
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Nhập tài khoản"
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

              {/* Demo role selector */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium">
                  Vai trò demo (chọn để test phân quyền):
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {DEMO_ROLES.map((role) => (
                    <Button
                      key={role}
                      type="button"
                      size="sm"
                      variant={selectedRole === role ? 'default' : 'outline'}
                      onClick={() => setSelectedRole(role)}
                      className="w-full !justify-start overflow-hidden"
                    >
                      <span className="truncate">{ROLE_LABELS[role]}</span>
                    </Button>
                  ))}
                </div>
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
