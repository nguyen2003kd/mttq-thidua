import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';
import { KeyRound, Plus, Trash2 } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import type { ColumnDef } from '@tanstack/react-table';
import { PageHeader, DataTable, Button, FilterSelect, FormDialog, ConfirmDialog } from '@/components/core';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  getApiV1Users,
  postApiV1Users,
  putApiV1UsersId,
  deleteApiV1UsersId,
  postApiV1UsersIdResetPassword,
} from '@/api/endpoints/users';
import type { CreateUserRequest, UpdateUserRequest } from '@/api/models';

// Swagger gen chưa cập nhật fullName — mở rộng local cho tới khi chạy lại gen:api.
type CreateUserBody = CreateUserRequest & { fullName?: string | null };
type UpdateUserBody = UpdateUserRequest & { fullName?: string | null };

interface ManagedUser {
  id: string;
  email: string;
  username: string | null;
  /** Họ tên người đại diện — tên hiển thị chính. */
  fullName: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  wardCode: string | null;
  status: string;
  roles: string[];
  createdAt: string;
  updatedAt: string;
}

interface UsersEnvelope {
  success?: boolean;
  data?: { items?: ManagedUser[] | null; total?: number; page?: number; pageSize?: number } | null;
  errors?: Array<{ messages?: { vi?: string | null; en?: string | null } | null } | null> | null;
}

const STATUS_OPTIONS = [
  { value: 'Active', label: 'Hoạt động' },
  { value: 'Inactive', label: 'Ngừng hoạt động' },
  { value: 'Suspended', label: 'Tạm khóa' },
  { value: 'PendingVerification', label: 'Chờ xác thực' },
];

const ROLE_OPTIONS = [
  { value: 'local', label: 'Địa phương' },
  { value: 'specialist', label: 'Chuyên viên' },
  { value: 'leader', label: 'Lãnh đạo' },
  { value: 'council', label: 'Hội đồng' },
  { value: 'committee', label: 'Ủy ban' },
  { value: 'admin', label: 'Quản trị' },
  { value: 'system_admin', label: 'Quản trị hệ thống' },
];

const statusLabels: Record<string, string> = Object.fromEntries(STATUS_OPTIONS.map((o) => [o.value, o.label]));
const roleLabels: Record<string, string> = Object.fromEntries(ROLE_OPTIONS.map((o) => [o.value, o.label]));

function roleLabel(raw: string): string {
  const normalized = raw.trim().toUpperCase().replace(/[-\s]/g, '_');
  const map: Record<string, string> = {
    LOCAL: 'Địa phương',
    SPECIALIST: 'Chuyên viên',
    LEADER: 'Lãnh đạo',
    COUNCIL: 'Hội đồng',
    COMMITTEE: 'Ủy ban',
    ADMIN: 'Quản trị',
    SYSTEM_ADMIN: 'Quản trị hệ thống',
    USER: 'Người dùng',
  };
  return map[normalized] ?? raw;
}

function statusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'Active': return 'default';
    case 'Suspended': return 'destructive';
    case 'PendingVerification': return 'secondary';
    default: return 'outline';
  }
}

function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as UsersEnvelope | undefined;
    return data?.errors?.[0]?.messages?.vi ?? 'Thao tác thất bại. Vui lòng thử lại.';
  }
  return error instanceof Error ? error.message : 'Thao tác thất bại. Vui lòng thử lại.';
}

function formatDate(value: string | null): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function UserManagementPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const debouncedSearch = useDebounce(search, 350);

  const usersQuery = useQuery({
    queryKey: ['admin-users', { search: debouncedSearch, statusFilter, roleFilter }],
    queryFn: async () => {
      const raw = await getApiV1Users({
        Search: debouncedSearch.trim() || undefined,
        Status: statusFilter || undefined,
        Role: roleFilter || undefined,
        Page: 1,
        PageSize: 100,
      });
      return (raw as unknown as UsersEnvelope)?.data ?? { items: [], total: 0 };
    },
  });

  const users = usersQuery.data?.items ?? [];

  const createMutation = useMutation({ mutationFn: (body: CreateUserBody) => postApiV1Users(body), onSuccess: () => { toast.success('Đã tạo tài khoản'); setCreateOpen(false); void queryClient.invalidateQueries({ queryKey: ['admin-users'] }); } });
  const updateMutation = useMutation({ mutationFn: ({ id, body }: { id: string; body: UpdateUserBody }) => putApiV1UsersId(id, body), onSuccess: () => { toast.success('Đã cập nhật tài khoản'); setEditOpen(false); void queryClient.invalidateQueries({ queryKey: ['admin-users'] }); } });
  const resetMutation = useMutation({ mutationFn: ({ id, password }: { id: string; password?: string }) => postApiV1UsersIdResetPassword(id, { password: password || undefined }), onSuccess: () => { toast.success('Đã đặt lại mật khẩu', { description: 'Tài khoản bị đăng xuất khỏi mọi thiết bị.' }); setResetOpen(false); void queryClient.invalidateQueries({ queryKey: ['admin-users'] }); } });
  const deleteMutation = useMutation({ mutationFn: (id: string) => deleteApiV1UsersId(id), onSuccess: () => { toast.success('Đã xóa tài khoản', { description: 'Tài khoản bị đăng xuất khỏi mọi thiết bị.' }); void queryClient.invalidateQueries({ queryKey: ['admin-users'] }); } });

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<ManagedUser | null>(null);

  const [fEmail, setFEmail] = useState('');
  const [fUsername, setFUsername] = useState('');
  const [fFullName, setFFullName] = useState('');
  const [fFirstName, setFFirstName] = useState('');
  const [fLastName, setFLastName] = useState('');
  const [fPhone, setFPhone] = useState('');
  const [fWardCode, setFWardCode] = useState('');
  const [fPassword, setFPassword] = useState('');
  const [fRole, setFRole] = useState('local');

  const [eFullName, setEFullName] = useState('');
  const [eFirstName, setEFirstName] = useState('');
  const [eLastName, setELastName] = useState('');
  const [ePhone, setEPhone] = useState('');
  const [eWardCode, setEWardCode] = useState('');
  const [eStatus, setEStatus] = useState('Active');

  const [resetPassword, setResetPassword] = useState('');

  const openEdit = (u: ManagedUser) => {
    setSelected(u);
    setEFullName(u.fullName ?? '');
    setEFirstName(u.firstName ?? '');
    setELastName(u.lastName ?? '');
    setEPhone(u.phone ?? '');
    setEWardCode(u.wardCode ?? '');
    setEStatus(u.status || 'Active');
    setEditOpen(true);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fEmail.trim()) { toast.error('Vui lòng nhập email.'); return; }
    if (fRole === 'local' && !fWardCode.trim()) { toast.error('Tài khoản địa phương cần nhập mã phường/xã.'); return; }
    createMutation.mutate({
      email: fEmail.trim(),
      username: fUsername.trim() || null,
      fullName: fFullName.trim() || null,
      firstName: fFirstName.trim() || null,
      lastName: fLastName.trim() || null,
      phone: fPhone.trim() || null,
      wardCode: fWardCode.trim() || null,
      password: fPassword || null,
      role: fRole,
    }, {
      onError: (err) => toast.error(extractErrorMessage(err)),
    });
  };

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    updateMutation.mutate({
      id: selected.id,
      body: {
        fullName: eFullName.trim() || null,
        firstName: eFirstName.trim() || null,
        lastName: eLastName.trim() || null,
        phone: ePhone.trim() || null,
        wardCode: eWardCode.trim() || null,
        status: eStatus,
      },
    }, {
      onError: (err) => toast.error(extractErrorMessage(err)),
    });
  };

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    resetMutation.mutate({ id: selected.id, password: resetPassword.trim() || undefined }, {
      onError: (err) => toast.error(extractErrorMessage(err)),
    });
  };

  const handleDelete = () => {
    if (!selected) return;
    deleteMutation.mutate(selected.id, {
      onError: (err) => toast.error(extractErrorMessage(err)),
    });
    setDeleteOpen(false);
  };

  const columns = useMemo<ColumnDef<ManagedUser>[]>(() => [
    {
      id: 'fullName',
      header: 'Họ và tên',
      meta: { className: 'font-medium', list: { width: 'minmax(180px, 1.4fr)' } },
      // Ưu tiên fullName (người đại diện) → fallback firstName + lastName.
      cell: ({ row }) => row.original.fullName?.trim() || `${row.original.lastName ?? ''} ${row.original.firstName ?? ''}`.trim() || '—',
    },
    {
      accessorKey: 'email',
      header: 'Email',
      meta: { list: { width: 'minmax(200px, 1.6fr)' } },
    },
    {
      accessorKey: 'username',
      header: 'Tên đăng nhập',
      meta: { list: { width: 'minmax(120px, 1fr)' } },
      cell: ({ row }) => row.original.username ?? '—',
    },
    {
      id: 'roles',
      header: 'Vai trò',
      meta: { align: 'center', list: { width: '140px' } },
      cell: ({ row }) => (
        <div className="flex flex-wrap justify-center gap-1">
          {(row.original.roles ?? []).map((r) => (
            <Badge key={r} variant="outline">{roleLabel(r)}</Badge>
          ))}
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Trạng thái',
      meta: { align: 'center', list: { width: '130px' } },
      cell: ({ row }) => (
        <Badge variant={statusVariant(row.original.status)}>{statusLabels[row.original.status] ?? row.original.status}</Badge>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Ngày tạo',
      meta: { align: 'right', list: { width: '150px' } },
      cell: ({ row }) => <span className="tabular-nums text-muted-foreground">{formatDate(row.original.createdAt)}</span>,
    },
  ], []);

  return (
    <div>
      <PageHeader
        title="Quản lý tài khoản"
        description="Quản lý người dùng hệ thống: tạo mới, cập nhật, đặt lại mật khẩu và xóa tài khoản."
        className="pb-3 border-b-0"
      />

      <DataTable
        data={users}
        columns={columns}
        variant="list"
        getRowId={(row) => row.id}
        loading={usersQuery.isLoading}
        pageSize={10}
        onRowClick={(row) => openEdit(row)}
        filters={
          <div className="flex flex-wrap items-center gap-2">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm email / tên đăng nhập / họ tên / SĐT…"
              className="h-9 w-64"
            />
            <FilterSelect
              label="Trạng thái"
              value={statusFilter}
              onChange={setStatusFilter}
              options={[{ value: '', label: 'Tất cả' }, ...STATUS_OPTIONS]}
            />
            <FilterSelect
              label="Vai trò"
              value={roleFilter}
              onChange={setRoleFilter}
              options={[{ value: '', label: 'Tất cả' }, ...ROLE_OPTIONS]}
            />
          </div>
        }
        activeFilters={[
          ...(statusFilter ? [{ label: 'Trạng thái', value: statusLabels[statusFilter] ?? statusFilter, onClear: () => setStatusFilter('') }] : []),
          ...(roleFilter ? [{ label: 'Vai trò', value: roleLabels[roleFilter] ?? roleFilter, onClear: () => setRoleFilter('') }] : []),
        ]}
        onClearFilters={() => { setStatusFilter(''); setRoleFilter(''); }}
        emptyState={{
          title: 'Chưa có tài khoản',
          description: 'Thêm tài khoản đầu tiên để bắt đầu.',
        }}
        toolbar={
          <Button size="sm" className="h-9!" onClick={() => { setFEmail(''); setFUsername(''); setFFullName(''); setFFirstName(''); setFLastName(''); setFPhone(''); setFWardCode(''); setFPassword(''); setFRole('local'); setCreateOpen(true); }} action="create">
            <Plus className="h-4 w-4 ml-2" /> Thêm tài khoản
          </Button>
        }
      />

      {/* Tạo tài khoản */}
      <FormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Thêm tài khoản mới"
        onSubmit={handleCreate}
        submitLabel="Tạo tài khoản"
        submitAction="create"
        submitDisabled={createMutation.isPending}
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="u-email">Email <span className="text-destructive">*</span></Label>
            <Input id="u-email" type="email" value={fEmail} onChange={(e) => setFEmail(e.target.value)} placeholder="nguyenvan@xa.gov.vn" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="u-username">Tên đăng nhập</Label>
            <Input id="u-username" value={fUsername} onChange={(e) => setFUsername(e.target.value)} placeholder="Bỏ trống tự sinh từ email" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="u-full-name">Họ tên người đại diện</Label>
          <Input id="u-full-name" value={fFullName} onChange={(e) => setFFullName(e.target.value)} placeholder="VD: Nguyễn Văn A — tên hiển thị chính" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="u-last-name">Họ</Label>
            <Input id="u-last-name" value={fLastName} onChange={(e) => setFLastName(e.target.value)} placeholder="Nguyễn" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="u-first-name">Tên</Label>
            <Input id="u-first-name" value={fFirstName} onChange={(e) => setFFirstName(e.target.value)} placeholder="Văn" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="u-phone">Số điện thoại</Label>
            <Input id="u-phone" value={fPhone} onChange={(e) => setFPhone(e.target.value)} placeholder="0901234567" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="u-ward">Mã phường/xã {fRole === 'local' && <span className="text-destructive">*</span>}</Label>
            <Input id="u-ward" value={fWardCode} onChange={(e) => setFWardCode(e.target.value)} placeholder="VD: 12345" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="u-role">Vai trò</Label>
            <Select value={fRole} onValueChange={(v) => setFRole(v ?? 'local')}>
              <SelectTrigger id="u-role"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="u-password">Mật khẩu</Label>
            <Input id="u-password" type="password" value={fPassword} onChange={(e) => setFPassword(e.target.value)} placeholder="Bỏ trống dùng mật khẩu mặc định" autoComplete="new-password" />
          </div>
        </div>
      </FormDialog>

      {/* Sửa tài khoản */}
      <FormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        title="Chỉnh sửa tài khoản"
        onSubmit={handleEdit}
        submitLabel="Lưu thay đổi"
        submitAction="edit"
        submitDisabled={updateMutation.isPending}
      >
        <div className="space-y-1.5">
          <Label htmlFor="e-full-name">Họ tên người đại diện</Label>
          <Input id="e-full-name" value={eFullName} onChange={(e) => setEFullName(e.target.value)} placeholder="Tên hiển thị chính trong hệ thống" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="e-last-name">Họ</Label>
            <Input id="e-last-name" value={eLastName} onChange={(e) => setELastName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="e-first-name">Tên</Label>
            <Input id="e-first-name" value={eFirstName} onChange={(e) => setEFirstName(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="e-phone">Số điện thoại</Label>
            <Input id="e-phone" value={ePhone} onChange={(e) => setEPhone(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="e-ward">Mã phường/xã</Label>
            <Input id="e-ward" value={eWardCode} onChange={(e) => setEWardCode(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="e-status">Trạng thái</Label>
          <Select value={eStatus} onValueChange={(v) => setEStatus(v ?? 'Active')}>
            <SelectTrigger id="e-status"><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <p className="text-xs text-muted-foreground">Không thể đổi vai trò sau khi tạo. Email không thể thay đổi.</p>
      </FormDialog>

      {/* Reset mật khẩu */}
      <FormDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        title="Đặt lại mật khẩu"
        onSubmit={handleReset}
        submitLabel="Đặt lại mật khẩu"
        submitAction="edit"
        submitDisabled={resetMutation.isPending}
      >
        <p className="text-sm text-muted-foreground">
          Đặt lại mật khẩu cho <span className="font-semibold text-foreground">{selected?.email}</span>. Tài khoản sẽ bị đăng xuất khỏi mọi thiết bị.
        </p>
        <div className="space-y-1.5">
          <Label htmlFor="reset-password">Mật khẩu mới</Label>
          <Input id="reset-password" type="password" value={resetPassword} onChange={(e) => setResetPassword(e.target.value)} placeholder="Để trống dùng mật khẩu mặc định" autoComplete="new-password" />
        </div>
      </FormDialog>

      {/* Xóa tài khoản */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Xóa tài khoản?"
        description={`Xóa tài khoản ${selected?.email ?? ''}? Tài khoản sẽ bị vô hiệu hóa và đăng xuất khỏi mọi thiết bị. Hành động này không thể hoàn tác.`}
        confirmLabel="Xóa tài khoản"
        variant="destructive"
        onConfirm={handleDelete}
      />

      {/* Actions row cho dòng được chọn */}
      {selected && !deleteOpen && !resetOpen && !editOpen && !createOpen && (
        <div className="mt-3 flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => { setResetPassword(''); setResetOpen(true); }}>
            <KeyRound className="h-3.5 w-3.5" /> Đặt lại mật khẩu
          </Button>
          <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="h-3.5 w-3.5" /> Xóa
          </Button>
        </div>
      )}
    </div>
  );
}
