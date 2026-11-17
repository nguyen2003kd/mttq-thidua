import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getGetApiV1UsersQueryKey } from '@/api/endpoints/users';
import { getGetApiV1ClustersQueryKey } from '@/api/endpoints/clusters';
import { dataQueryKey, invalidateQueryResources } from '@/api/mutator/query-keys';
import { toast } from 'sonner';
import { KeyRound } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { useQueryFilters } from '@/hooks/useQueryFilters';
import type { ColumnDef } from '@tanstack/react-table';
import { PageHeader, DataTable, Button, FilterSelect, ConfirmDialog } from '@/components/core';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { getApiV1Users } from '@/api/endpoints/users';
import { clustersApi } from '../api/clustersApi';
import { getUserApiError, usersApi } from '../api/usersApi';
import { useAuthStore } from '@/store/authStore';

interface LocalAccount {
  id: string;
  email: string;
  username: string | null;
  fullName: string | null;
  phone: string | null;
  wardCode: string | null;
  status: string;
  roles: string[];
  createdAt: string;
  updatedAt: string;
}

interface UsersEnvelope {
  success?: boolean;
  data?: { items?: LocalAccount[] | null; total?: number; page?: number; pageSize?: number } | null;
}

// Role địa phương theo cả tên lẫn biến thể — khớp danh sách LocalUnitRoleNames phía server.
const LOCAL_ROLE_NAMES = new Set(['LOCAL', 'LOCALITY', 'LOCAL_UNIT', 'LOCALUNIT']);

const STATUS_OPTIONS = [
  { value: 'Active', label: 'Hoạt động' },
  { value: 'Inactive', label: 'Ngừng hoạt động' },
  { value: 'Suspended', label: 'Tạm khóa' },
  { value: 'PendingVerification', label: 'Chờ xác thực' },
];

const statusLabels: Record<string, string> = Object.fromEntries(STATUS_OPTIONS.map((o) => [o.value, o.label]));

function formatDate(value: string | null): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground">{value || '—'}</p>
    </div>
  );
}

export default function LocalityAccountsPage({ embedded = false }: { embedded?: boolean }) {
  const queryClient = useQueryClient();
  // Khớp CanManageDepartments phía server: ADMIN/SYSTEM_ADMIN/SPECIALIST mới được reset mật khẩu.
  const currentRole = useAuthStore((s) => s.user?.role);
  const canResetPassword = ['ADMIN', 'SYSTEM_ADMIN', 'SPECIALIST'].includes(currentRole ?? '');
  const {
    filters: { localitySearch: search, localityStatus: statusFilter },
    setters: { localitySearch: setSearch, localityStatus: setStatusFilter },
  } = useQueryFilters({ localitySearch: '', localityStatus: '' });
  const debouncedSearch = useDebounce(search, 350);

  const usersQuery = useQuery({
    queryKey: dataQueryKey(getGetApiV1UsersQueryKey(), { search: debouncedSearch.trim(), status: statusFilter, role: 'Local', page: 1, pageSize: 100 }),
    queryFn: async () => {
      const raw = await getApiV1Users({
        Search: debouncedSearch.trim() || undefined,
        Status: statusFilter || undefined,
        Role: 'Local',
        Page: 1,
        PageSize: 100,
      });
      return (raw as unknown as UsersEnvelope)?.data ?? { items: [], total: 0 };
    },
  });
  const users = (usersQuery.data?.items ?? []).filter((user) =>
    (user.roles ?? []).some((role) => LOCAL_ROLE_NAMES.has(role.trim().toUpperCase())),
  );

  // wardCode → tên phường/xã: gộp phường đã gán cụm lẫn chưa gán.
  const wardNamesQuery = useQuery({
    queryKey: dataQueryKey(getGetApiV1ClustersQueryKey(), 'ward-names'),
    queryFn: async () => {
      const [clusters, available] = await Promise.all([clustersApi.list(), clustersApi.availableWards()]);
      const map = new Map<string, string>();
      for (const ward of available) {
        if (ward.code) map.set(ward.code, ward.fullName ?? ward.name ?? ward.code);
      }
      for (const cluster of clusters) {
        for (const ward of cluster.wards) {
          map.set(ward.wardCode, ward.wardFullName ?? ward.wardName ?? ward.wardCode);
        }
      }
      return map;
    },
  });
  const wardNameOf = (wardCode: string | null) =>
    !wardCode ? '—' : (wardNamesQuery.data?.get(wardCode) ?? wardCode);

  const resetMutation = useMutation({
    mutationFn: (userIds: string[]) => usersApi.resetPasswords(userIds),
    onSuccess: async (result) => {
      if (result.failedUserIds.length > 0 && result.resetUserIds.length === 0) {
        toast.error('Không đặt lại được mật khẩu cho tài khoản đã chọn.');
      } else {
        toast.success(`Đã đặt lại mật khẩu cho ${result.resetUserIds.length} tài khoản`, {
          description: 'Mật khẩu mới là "MTTQ@2026". Tài khoản bị đăng xuất khỏi mọi thiết bị.',
        });
      }
      setResetConfirmOpen(false);
      await invalidateQueryResources(queryClient, [getGetApiV1UsersQueryKey()]);
    },
    onError: (error) => toast.error(getUserApiError(error)),
  });

  const [selected, setSelected] = useState<LocalAccount | null>(null);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  const columns = useMemo<ColumnDef<LocalAccount>[]>(() => [
    {
      id: 'fullName',
      header: 'Họ và tên',
      meta: { className: 'font-medium', list: { width: 'minmax(180px, 1.4fr)' } },
      cell: ({ row }) => row.original.fullName?.trim() || '—',
    },
    {
      accessorKey: 'username',
      header: 'Tên đăng nhập',
      meta: { list: { width: 'minmax(130px, 1fr)' } },
      cell: ({ row }) => row.original.username ?? '—',
    },
    {
      accessorKey: 'phone',
      header: 'Số điện thoại',
      meta: { list: { width: 'minmax(120px, 1fr)' } },
      cell: ({ row }) => row.original.phone ?? '—',
    },
    {
      id: 'locality',
      header: 'Địa phương',
      meta: { list: { width: 'minmax(110px, 0.9fr)' } },
      cell: ({ row }) => {
        const code = row.original.wardCode;
        return !code ? '—' : (wardNamesQuery.data?.get(code) ?? code);
      },
    },
    {
      accessorKey: 'updatedAt',
      header: 'Cập nhật lần cuối',
      sortDescFirst: true,
      meta: { align: 'right', sortable: true, list: { width: 'minmax(150px, 0.6fr)', valueClassName: 'text-xs' } },
      cell: ({ row }) => <span className="whitespace-nowrap tabular-nums text-muted-foreground">{formatDate(row.original.updatedAt)}</span>,
    },
  ], [wardNamesQuery.data]);

  return (
    <div>
      {!embedded && <PageHeader
        title="Tài khoản địa phương"
        description="Xem thông tin và đặt lại mật khẩu cho các tài khoản địa phương."
        className="pb-3 border-b-0"
      />}

      <DataTable
        data={users}
        columns={columns}
        variant="list"
        getRowId={(row) => row.id}
        loading={usersQuery.isLoading}
        pageSize={10}
        onRowClick={(row) => setSelected(row)}
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
          </div>
        }
        activeFilters={[
          ...(search.trim() ? [{ label: 'Tìm kiếm', value: search.trim(), onClear: () => setSearch('') }] : []),
          ...(statusFilter ? [{ label: 'Trạng thái', value: statusLabels[statusFilter] ?? statusFilter, onClear: () => setStatusFilter('') }] : []),
        ]}
        onClearFilters={() => { setSearch(''); setStatusFilter(''); }}
        emptyState={{
          title: 'Chưa có tài khoản địa phương',
          description: 'Trang này chỉ hiển thị tài khoản vai trò Địa phương (Local).',
        }}
      />

      {/* Chi tiết tài khoản địa phương */}
      <Dialog open={Boolean(selected)} onOpenChange={(next) => { if (!next) setSelected(null); }}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Thông tin tài khoản địa phương</DialogTitle>
          </DialogHeader>

          {selected && (
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <InfoRow label="Họ và tên" value={selected.fullName?.trim() ?? ''} />
              <InfoRow label="Tên đăng nhập" value={selected.username ?? ''} />
              <InfoRow label="Email" value={selected.email} />
              <InfoRow label="Số điện thoại" value={selected.phone ?? ''} />
              <InfoRow label="Địa phương" value={wardNameOf(selected.wardCode)} />
              <InfoRow label="Mã phường/xã" value={selected.wardCode ?? ''} />
              <InfoRow label="Ngày tạo" value={formatDate(selected.createdAt)} />
            </div>
          )}

          {canResetPassword && (
            <DialogFooter>
              <Button variant="warning" size="sm" onClick={() => setResetConfirmOpen(true)}>
                <KeyRound className="mr-1.5 h-3.5 w-3.5" /> Đặt lại mật khẩu
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Xác nhận reset */}
      <ConfirmDialog
        open={resetConfirmOpen}
        onOpenChange={setResetConfirmOpen}
        title="Đặt lại mật khẩu?"
        description={<>Đặt lại mật khẩu cho {selected?.fullName?.trim() || selected?.username || selected?.email || ''} về mật khẩu mặc định <span className="font-semibold text-foreground">"MTTQ@2026"</span>? Tài khoản sẽ bị đăng xuất khỏi mọi thiết bị.</>}
        confirmLabel="Đặt lại mật khẩu"
        onConfirm={() => { if (selected) resetMutation.mutate([selected.id]); }}
      />
    </div>
  );
}
