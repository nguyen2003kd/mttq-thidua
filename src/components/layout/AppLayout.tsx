import { Suspense, useMemo, useState, type ReactNode, type ComponentType } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Trophy,
  Table,
  ClipboardCheck,
  ClipboardList,
  FileCheck,
  FilePlus2,
  FileText,
  FileX2,
  History,
  LogOut,
  Bell,
  Inbox,
  ChevronDown,
  CheckCheck,
  Clock,
  Menu,
  MessageSquareWarning,
  KeyRound,
  UserRound,
  Settings2,
  AlarmClock,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useScoreStore } from '@/store/scoreStore';
import { useUIStore } from '@/store/uiStore';
import { useNotificationStore } from '@/store/notificationStore';
import { useSseNotifications } from '@/hooks/useSseNotifications';
import { notificationsApi } from '@/features/notifications/api/notificationsApi';
import { getNotificationTarget, parseNotificationPayload } from '@/lib/notificationNavigation';
import { ROLE_LABELS } from '@/constants/enums';
import { ROUTES } from '@/constants/routes';
import { LABELS } from '@/constants/labels';
import { NavItem, PageLoading } from '@/components/core';
import { vnWards } from '@/data/vn-wards';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

interface NavItemDef {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

/** Tra tên phường/xã theo mã — build map 1 lần (3321 entries). */
const wardNameByCode = new Map(vnWards.map((w) => [w.code, w.name]));

function renderNotificationBody(body: string): ReactNode {
  return body.split(/('[^']*'|“[^”]*”)/g).map((part, index) => {
    const isImportant = (part.startsWith("'") && part.endsWith("'")) || (part.startsWith('“') && part.endsWith('”'));
    return isImportant
      ? <strong key={`${part}-${index}`} className="font-semibold text-foreground">{part}</strong>
      : <span key={`${part}-${index}`}>{part}</span>;
  });
}

/** Icon + màu theo loại thông báo — phân biệt rõ từng loại sự kiện (xanh dương / xanh lá / vàng / đỏ). */
interface NotificationVisual {
  Icon: ComponentType<{ className?: string }>;
  colorClass: string;
}

function getNotificationVisual(eventType: string | undefined): NotificationVisual {
  switch (eventType) {
    // Xanh dương — nhóm tiêu chí được giao / cập nhật.
    case 'criteria_group_applied':
    case 'criteria_group_updated':
      return { Icon: ClipboardList, colorClass: 'bg-primary/10 text-primary' };
    // Vàng — thay đổi tiêu chí, yêu cầu chỉnh sửa, nhắc nộp hồ sơ.
    case 'criteria_added':
    case 'criteria_updated':
      return { Icon: FileText, colorClass: 'bg-warning/10 text-warning' };
    case 'criteria_disabled':
      return { Icon: FileX2, colorClass: 'bg-destructive/10 text-destructive' };
    case 'revision_requested':
    case 'scorer_revision_requested':
    case 'reviewer_revision_requested':
    case 'specialist_review_requested':
      return { Icon: MessageSquareWarning, colorClass: 'bg-warning/10 text-warning' };
    case 'submission_reminder':
      return { Icon: AlarmClock, colorClass: 'bg-warning/10 text-warning' };
    // Xanh lá — kết quả tốt / bổ sung mới.
    case 'supplementary_criteria_added':
      return { Icon: FilePlus2, colorClass: 'bg-success/10 text-success' };
    case 'result_published':
      return { Icon: Trophy, colorClass: 'bg-success/10 text-success' };
    default:
      return { Icon: Bell, colorClass: 'bg-primary/10 text-primary' };
  }
}

/** Định dạng thời gian tương đối: "Vừa xong", "5 phút trước", … fallback ngày vi-VN. */
function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const minutes = Math.floor((Date.now() - date.getTime()) / 60_000);
  if (minutes < 1) return 'Vừa xong';
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ngày trước`;
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function AppLayout({ children }: { children: ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const wardCode = useAuthStore((s) => s.ward_code);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const criteriaTables = useScoreStore((s) => s.criteriaTables);
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // SSE notifications
  useSseNotifications();
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const notifications = useNotificationStore((s) => s.notifications);
  const markAllReadStore = useNotificationStore((s) => s.markAllRead);
  const markReadStore = useNotificationStore((s) => s.markRead);
  const fetchFirstPage = useNotificationStore((s) => s.fetchFirstPage);
  const loadMore = useNotificationStore((s) => s.loadMore);
  const loadingNotifications = useNotificationStore((s) => s.loading);
  const hasMoreNotifications = useNotificationStore((s) => s.hasMore);

  const stickyTitle = useUIStore((s) => s.stickyTitle);
  const stickyDescription = useUIStore((s) => s.stickyDescription);

  const navItems = useMemo<NavItemDef[]>(() => {
    const items: NavItemDef[] = [];
    if (user?.role === 'LOCAL') {
      items.push({ to: ROUTES.LOCALITY_CRITERIA, label: 'Tiêu chí được giao', icon: Table });
      items.push({ to: ROUTES.LOCALITY_RESULTS, label: LABELS.LOCALITY_RESULT_TITLE, icon: Trophy });
      items.push({ to: '/thi-dua/lich-su-thay-doi', label: 'Lịch sử thao tác', icon: History });
    }

    if (user?.role === 'SCORER') {
      items.push({ to: '/thi-dua/cham-diem', label: 'Chấm điểm', icon: ClipboardCheck });
    }

    if (user?.role === 'REVIEWER') {
      items.push({ to: ROUTES.SPECIALIST_REVIEW, label: 'Thẩm định', icon: FileCheck });
    }

    if (user?.role === 'SPECIALIST') {
      items.push({ to: `${ROUTES.SPECIALIST_CRITERIA}?view=periods`, label: 'Quản lý tiêu chí', icon: Table });
      if (criteriaTables[0]) {
        items.push({ to: ROUTES.SPECIALIST_REVIEW, label: 'Chấm và thẩm định', icon: ClipboardCheck });
      }
      items.push({ to: ROUTES.SPECIALIST_SCORE_SUMMARY, label: 'Bảng tổng hợp điểm', icon: ClipboardList });
      // items.push({ to: ROUTES.SPECIALIST_HISTORY, label: 'Lịch sử chấm', icon: History });
      items.push({ to: ROUTES.ADMIN_MANAGEMENT, label: 'Quản lý hệ thống', icon: Settings2 });
    }

    if (user?.role === 'ADMIN') {
      items.push({ to: ROUTES.ADMIN_CRITERIA_LIST, label: 'Quản lý tiêu chí', icon: Table });
      items.push({ to: ROUTES.ADMIN_DEADLINE_CONFIG, label: 'Cấu hình thời hạn', icon: ClipboardCheck });
      items.push({ to: ROUTES.ADMIN_LOCALITY, label: 'Địa phương', icon: Trophy });
      items.push({ to: ROUTES.ADMIN_MANAGEMENT, label: 'Quản lý hệ thống', icon: Settings2 });
    }

    if (user?.role === 'LEADER') {
      items.push({
        to: `/thi-dua/duyet/lanh-dao-ban/${user.banId ?? 'ban1'}`,
        label: 'Duyệt — Lãnh đạo Ban',
        icon: FileCheck,
      });
    }

    // if (user?.role === 'COMMITTEE') {
    //   items.push({ to: ROUTES.DUYET_STANDING_REVIEW, label: 'Duyệt theo địa phương', icon: FileCheck });
    // }

    if (user?.role === 'COUNCIL') {
      items.push({ to: ROUTES.DUYET_COUNCIL, label: 'Duyệt — Hội đồng TĐKT', icon: FileCheck });
      items.push({ to: ROUTES.COUNCIL_SCORE_SUMMARY, label: 'Bảng tổng hợp điểm', icon: ClipboardList });
    }

    if (user?.role === 'COMMITTEE') {
      items.push({ to: ROUTES.DUYET_STANDING, label: 'Duyệt — Ban Thường trực', icon: FileCheck });
      items.push({ to: ROUTES.COMMITTEE_SCORE_SUMMARY, label: 'Bảng tổng hợp điểm', icon: ClipboardList });
    }

    if (user?.role && user.role !== 'LOCAL') {
      items.push({ to: ROUTES.AUDIT_LOG.replace('/:diaPhuongId', ''), label: LABELS.AUDIT_TIMELINE_TITLE, icon: History });
    }
    return items;
  }, [user, criteriaTables]);

  const handleLogout = () => {
    clearAuth();
    navigate(ROUTES.LOGIN);
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.readAll();
    } catch {
      // still mark locally so UI stays consistent
    }
    markAllReadStore();
  };

  const handleNotificationClick = async (id: string, isRead?: boolean, data?: string) => {
    if (!isRead) {
      markReadStore(id);
      try {
        await notificationsApi.markRead(id);
      } catch {
        // ignore — will re-sync on next connect
      }
    }

    // Bấm thông báo → chuyển tới nội dung của thông báo (nhóm tiêu chí, kết quả, hồ sơ…).
    const target = getNotificationTarget(parseNotificationPayload(data), user?.role, wardCode);
    if (target) {
      setMobileNavOpen(false);
      navigate(target.to);
    }
  };

  const handleNotificationScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const el = event.currentTarget;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 40) {
      void loadMore();
    }
  };

  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="flex h-dvh bg-background">
      {/* Sidebar trái — chỉ cho role ADMIN */}
      {isAdmin && (
        <aside className="hidden w-60 shrink-0 flex-col bg-sidebar text-sidebar-foreground xl:flex">
          <div className="flex items-center gap-2 border-b border-white/20 px-5 py-4">
            <Trophy className="h-6 w-6 shrink-0 text-accent" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">Mặt Trận Tổ Quốc</p>
              <p className="text-[11px] text-white/90">Phân hệ Quản lý Thi đua</p>
            </div>
          </div>
          <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Điều hướng quản trị">
            {navItems.map((item) => {
              const isActive = location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);
              return (
                <button
                  key={item.to}
                  type="button"
                  onClick={() => navigate(item.to)}
                  className={`flex h-10 w-full items-center gap-3 rounded-[6px] px-3 text-left text-sm font-medium transition-colors ${
                    isActive ? 'bg-white text-primary' : 'text-white hover:bg-white/10'
                  }`}
                >
                  <item.icon className={`size-4 shrink-0 ${isActive ? 'text-primary' : 'text-white/90'}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
          {user && (
            <div className="border-t border-white/20 px-5 py-4">
              <p className="truncate text-sm font-semibold text-white">{user.name}</p>
              <p className="mt-0.5 text-xs text-white/90">{ROLE_LABELS[user.role]}</p>
            </div>
          )}
        </aside>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
      <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-primary bg-primary px-4 text-primary-foreground">
        <div className="flex min-w-0 items-center gap-3">
          {/* Brand */}
          <div className="flex shrink-0 items-center pl-1 pr-2">
            <span className="hidden lg:block font-semibold text-sm tracking-tight whitespace-nowrap">Mặt Trận Tổ Quốc</span>
          </div>
          <span className="hidden h-6 w-px bg-white/25 xl:block" aria-hidden="true" />
          {/* Navigation ngang — ẩn với ADMIN (dùng sidebar trái) */}
          {!isAdmin && (
            <nav className="hidden min-w-0 items-center gap-1 xl:flex">
              {navItems.map((item) => (
                <NavItem
                  key={item.to}
                  to={item.to}
                  label={item.label}
                  icon={item.icon}
                  theme="header"
                />
              ))}
            </nav>
          )}
          {stickyTitle && (
            <div className="ml-auto hidden min-w-0 flex-col justify-center border-l border-white/25 pl-4 xl:flex">
              <h1 className="truncate text-[13px] font-semibold tracking-tight leading-relaxed">{stickyTitle}</h1>
              {stickyDescription && (
                <p className="truncate text-[10px] text-white/90 leading-relaxed">{stickyDescription}</p>
              )}
            </div>
          )}
        </div>
          <div className="flex shrink-0 items-center gap-2">
            <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
              <SheetTrigger
                render={
                  <button
                    type="button"
                    className="flex size-9 cursor-pointer items-center justify-center rounded-[6px] border border-white/25 bg-white/10 text-white transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent xl:hidden"
                    aria-label="Mở menu điều hướng"
                  />
                }
              >
                <Menu className="size-5" />
              </SheetTrigger>
              <SheetContent side="left" className="w-[min(84vw,320px)] gap-0 p-0">
                <SheetHeader className="border-b border-white/20 bg-primary px-5 py-5 text-left text-white">
                  <div className="flex items-center gap-2.5">
                    <Trophy className="size-6 text-accent" />
                    <SheetTitle className="text-base font-semibold text-white">Mặt Trận Tổ Quốc</SheetTitle>
                  </div>
                  <SheetDescription className="mt-1 text-xs text-white/90">Phân hệ Quản lý Thi đua</SheetDescription>
                </SheetHeader>
                <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3" aria-label="Điều hướng chính">
                  {navItems.map((item) => {
                    const isActive = location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);
                    return (
                      <button
                        key={item.to}
                        type="button"
                        onClick={() => {
                          navigate(item.to);
                          setMobileNavOpen(false);
                        }}
                        className={`flex h-11 w-full items-center gap-3 rounded-[6px] px-3 text-left text-sm font-medium transition-colors ${
                          isActive ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted'
                        }`}
                      >
                        <item.icon className={`size-4 shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </nav>
                {user && (
                  <div className="border-t border-border p-4">
                    <p className="truncate text-sm font-semibold text-foreground">{user.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{ROLE_LABELS[user.role]}</p>
                  </div>
                )}
              </SheetContent>
            </Sheet>
            <DropdownMenu onOpenChange={(open) => { if (open) void fetchFirstPage(); }}>
              <DropdownMenuTrigger
                render={
                  <button
                    type="button"
                    aria-label={unreadCount > 0 ? `Thông báo, ${unreadCount} chưa đọc` : 'Thông báo'}
                    className="relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-white/25 bg-white/10 text-white transition-all hover:bg-white/15"
                  >
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground ring-2 ring-primary">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                }
              />
              <DropdownMenuContent align="end" sideOffset={6} className="w-[360px] overflow-hidden overflow-y-hidden rounded-xl p-0">
                <div className="flex items-center justify-between gap-2 border-b border-border/60 px-4 py-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">Thông báo</span>
                    {unreadCount > 0 && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive/10 px-1.5 text-[11px] font-bold text-destructive">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={handleMarkAllRead}
                        title="Đánh dấu đã đọc tất cả"
                        className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-primary transition-colors duration-150 hover:bg-primary/10"
                      >
                        <CheckCheck className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
                <div
                  className="max-h-[min(24rem,60vh)] space-y-1 overflow-y-auto p-2"
                  onScroll={handleNotificationScroll}
                >
                  {notifications.length === 0 && !loadingNotifications ? (
                    <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
                        <Inbox className="h-5 w-5" />
                      </span>
                      <p className="text-sm font-medium text-foreground">Chưa có thông báo</p>
                      <p className="text-xs text-muted-foreground">Thông báo mới sẽ xuất hiện tại đây</p>
                    </div>
                  ) : (
                    <>
                      {notifications.map((n) => {
                        const visual = getNotificationVisual(parseNotificationPayload(n.data)?.eventType);
                        return (
                          <button
                            key={n.id}
                            type="button"
                            onClick={() => handleNotificationClick(n.id, n.isRead, n.data)}
                            className={`flex w-full cursor-pointer items-start gap-3 rounded-lg px-3 py-3 text-left transition-colors duration-150 hover:bg-muted/70 ${
                              n.isRead ? '' : 'bg-primary/[0.06]'
                            }`}
                          >
                            <span
                              className={`relative mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${visual.colorClass}`}
                            >
                              <visual.Icon className="h-4 w-4" />
                              {!n.isRead && (
                                <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-background bg-destructive" />
                              )}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="flex items-start gap-2">
                                <span
                                  className={`min-w-0 flex-1 text-sm leading-5 ${
                                    n.isRead ? 'font-medium text-foreground/90' : 'font-semibold text-foreground'
                                  }`}
                                >
                                  {n.title}
                                </span>
                                {!n.isRead && (
                                  <span className="mt-0.5 shrink-0 rounded-full bg-destructive/10 px-1.5 py-0.5 text-[10px] font-semibold text-destructive">
                                    Mới
                                  </span>
                                )}
                              </span>
                              {n.body && (
                                <>
                                  <span aria-hidden className="my-1.5 block h-px w-full bg-border" />
                                  <span className="line-clamp-3 block text-xs leading-5 text-muted-foreground">
                                    {renderNotificationBody(n.body)}
                                  </span>
                                </>
                              )}
                              <span className="mt-1.5 flex items-center gap-1 text-[11px] text-muted-foreground/75">
                                <Clock className="h-3 w-3" />
                                {formatRelativeTime(n.createdAt)}
                              </span>
                            </span>
                          </button>
                        );
                      })}
                      {loadingNotifications && (
                        <p className="px-3 py-2.5 text-center text-xs text-muted-foreground">Đang tải…</p>
                      )}
                      {!loadingNotifications && !hasMoreNotifications && notifications.length > 0 && (
                        <p className="px-3 py-2 text-center text-[11px] text-muted-foreground/75">— Đã hiển thị tất cả —</p>
                      )}
                    </>
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <button
                      type="button"
                      className="flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-white/25 bg-white/10 px-3 text-sm text-white transition-all hover:bg-white/15"
                    >
                      <span className="hidden items-center gap-2 sm:flex">
                        <span className="max-w-40 truncate text-[13px] font-medium">{user.name}</span>
                        <span className="h-3.5 w-px shrink-0 bg-white/30" aria-hidden="true" />
                        <span className="max-w-40 truncate text-xs text-white/85">
                          {(wardCode && wardNameByCode.get(wardCode)) || ROLE_LABELS[user.role]}
                        </span>
                      </span>
                      <ChevronDown className="h-3.5 w-3.5 text-white/90 transition-transform data-[popup-open]:rotate-180" />
                    </button>
                  }
                />
                <DropdownMenuContent align="end" sideOffset={6} className="w-64 p-1.5">
                  <div className="px-2 py-2.5">
                    <p className="truncate text-sm font-semibold">{user.name}</p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {(wardCode && wardNameByCode.get(wardCode)) || ROLE_LABELS[user.role]}
                    </p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate(ROUTES.ACCOUNT)} className="rounded-lg px-2 py-2">
                    <UserRound className="h-4 w-4 text-muted-foreground" />
                    <span>Thông tin tài khoản</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate(ROUTES.CHANGE_PASSWORD)} className="rounded-lg px-2 py-2">
                    <KeyRound className="h-4 w-4 text-muted-foreground" />
                    <span>Đổi mật khẩu</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onClick={handleLogout} className="rounded-lg px-2 py-2">
                    <LogOut className="h-4 w-4" />
                    <span>Đăng xuất</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-auto p-4 sm:p-6">
          <Suspense fallback={<PageLoading overlay label="Đang tải trang…" />}>
            {children}
          </Suspense>
        </main>
      </div>
    </div>
  );
}
