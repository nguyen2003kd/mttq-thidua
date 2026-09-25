import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';
import { PageHeader, DataTable, Button, FormDialog, ConfirmDialog } from '@/components/core';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  departmentsApi,
  getDepartmentApiError,
  type DepartmentApi,
  type DepartmentMemberApi,
} from '../api/departmentsApi';
import { getApiV1Users, putApiV1UsersId } from '@/api/endpoints/users';

interface ManagedUser {
  id: string;
  email: string;
  fullName: string | null;
  firstName: string | null;
  lastName: string | null;
  roles: string[];
  departmentId: string | null;
}

interface UsersEnvelope {
  success?: boolean;
  data?: { items?: ManagedUser[] | null } | null;
}

function roleLabel(raw: string): string {
  const map: Record<string, string> = {
    SPECIALIST: 'Chuyên viên',
    LEADER: 'Lãnh đạo ban',
    LOCAL: 'Địa phương',
    COUNCIL: 'Hội đồng',
    COMMITTEE: 'Ủy ban',
    ADMIN: 'Quản trị',
  };
  return map[raw.trim().toUpperCase()] ?? raw;
}

function userDisplayName(u: ManagedUser) {
  return u.fullName?.trim() || `${u.lastName ?? ''} ${u.firstName ?? ''}`.trim() || u.email;
}

export default function DepartmentManagementPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<DepartmentApi | null>(null);
  const [fName, setFName] = useState('');
  const [fDescription, setFDescription] = useState('');
  const [eName, setEName] = useState('');
  const [eDescription, setEDescription] = useState('');
  const [assignUserId, setAssignUserId] = useState('');

  const departmentsQuery = useQuery({
    queryKey: ['admin-departments', { search }],
    queryFn: () => departmentsApi.list({ search: search.trim() || undefined, page: 1, pageSize: 100 }),
  });
  const departments = departmentsQuery.data?.items ?? [];

  const membersQuery = useQuery({
    queryKey: ['admin-department-members', selected?.id],
    queryFn: () => departmentsApi.listMembers(selected!.id),
    enabled: Boolean(selected?.id) && editOpen,
  });

  const assignableUsersQuery = useQuery({
    queryKey: ['admin-department-assignable-users'],
    queryFn: async () => {
      const raw = await getApiV1Users({ Page: 1, PageSize: 200 });
      return ((raw as unknown as UsersEnvelope)?.data?.items ?? []).filter(
        (u) => u.roles?.some((r) => ['SPECIALIST', 'LEADER'].includes(r.trim().toUpperCase())),
      );
    },
    enabled: editOpen,
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin-departments'] });
    void queryClient.invalidateQueries({ queryKey: ['admin-department-members'] });
    void queryClient.invalidateQueries({ queryKey: ['admin-department-assignable-users'] });
    void queryClient.invalidateQueries({ queryKey: ['admin-users'] });
  };

  const createMutation = useMutation({
    mutationFn: (payload: { name: string; description?: string | null }) => departmentsApi.create(payload),
    onSuccess: () => {
      toast.success('Đã tạo ban');
      setCreateOpen(false);
      invalidate();
    },
    onError: (e) => toast.error(getDepartmentApiError(e)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { name: string; description?: string | null } }) => departmentsApi.update(id, payload),
    onSuccess: () => {
      toast.success('Đã cập nhật ban');
      invalidate();
    },
    onError: (e) => toast.error(getDepartmentApiError(e)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => departmentsApi.remove(id),
    onSuccess: () => {
      toast.success('Đã xóa ban');
      setDeleteOpen(false);
      invalidate();
    },
    onError: (e) => toast.error(getDepartmentApiError(e)),
  });

  const assignMutation = useMutation({
    mutationFn: ({ userId, departmentId }: { userId: string; departmentId: string }) =>
      putApiV1UsersId(userId, { departmentId } as never),
    onSuccess: () => {
      toast.success('Đã thêm thành viên vào ban');
      setAssignUserId('');
      invalidate();
    },
    onError: (e) => toast.error(getDepartmentApiError(e)),
  });

  const removeMemberMutation = useMutation({
    mutationFn: ({ departmentId, userId }: { departmentId: string; userId: string }) => departmentsApi.removeMember(departmentId, userId),
    onSuccess: () => {
      toast.success('Đã gỡ thành viên khỏi ban');
      invalidate();
    },
    onError: (e) => toast.error(getDepartmentApiError(e)),
  });

  const members = membersQuery.data ?? [];
  const memberIds = useMemo(() => new Set(members.map((m) => m.id)), [members]);
  const assignableUsers = (assignableUsersQuery.data ?? []).filter((u) => !memberIds.has(u.id));

  const columns = useMemo<ColumnDef<DepartmentApi>[]>(() => [
    {
      accessorKey: 'name',
      header: 'Tên ban',
      meta: { className: 'font-medium', list: { width: 'minmax(200px, 1.4fr)' } },
    },
    {
      accessorKey: 'description',
      header: 'Mô tả',
      cell: ({ row }) => <span className="line-clamp-2 text-sm text-muted-foreground">{row.original.description ?? '—'}</span>,
      meta: { list: { width: 'minmax(220px, 1.6fr)' } },
    },
    {
      accessorKey: 'memberCount',
      header: 'Thành viên',
      meta: { align: 'center', list: { width: '110px' } },
    },
    {
      accessorKey: 'criteriaGroupCount',
      header: 'Nhóm tiêu chí',
      meta: { align: 'center', list: { width: '120px' } },
    },
  ], []);

  const openEdit = (department: DepartmentApi) => {
    setSelected(department);
    setEName(department.name);
    setEDescription(department.description ?? '');
    setAssignUserId('');
    setEditOpen(true);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fName.trim()) { toast.error('Vui lòng nhập tên ban.'); return; }
    createMutation.mutate({ name: fName.trim(), description: fDescription.trim() || null });
  };

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !eName.trim()) { toast.error('Vui lòng nhập tên ban.'); return; }
    updateMutation.mutate({ id: selected.id, payload: { name: eName.trim(), description: eDescription.trim() || null } });
  };

  return (
    <div>
      <PageHeader
        title="Quản lý Ban"
        description="Tạo và quản lý các ban chuyên môn: chuyên viên xử lý và lãnh đạo ban."
        className="pb-3 border-b-0"
      />

      <DataTable
        data={departments}
        columns={columns}
        variant="list"
        getRowId={(row) => row.id}
        loading={departmentsQuery.isLoading}
        pageSize={10}
        onRowClick={openEdit}
        filters={
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm tên ban…"
            className="h-9 w-64"
          />
        }
        emptyState={{ title: 'Chưa có ban', description: 'Tạo ban đầu tiên để bắt đầu phân công.' }}
        toolbar={
          <Button size="sm" className="h-9!" onClick={() => { setFName(''); setFDescription(''); setCreateOpen(true); }} action="create">
            <Plus className="h-4 w-4 ml-2" /> Thêm ban
          </Button>
        }
      />

      <FormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Thêm ban mới"
        onSubmit={handleCreate}
        submitLabel="Tạo ban"
        submitAction="create"
        submitDisabled={createMutation.isPending}
      >
        <div className="space-y-1.5">
          <Label htmlFor="d-name">Tên ban <span className="text-destructive">*</span></Label>
          <Input id="d-name" value={fName} onChange={(e) => setFName(e.target.value)} placeholder="VD: Ban Văn hóa - Xã hội" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="d-description">Mô tả</Label>
          <Input id="d-description" value={fDescription} onChange={(e) => setFDescription(e.target.value)} placeholder="Mô tả ngắn về nhiệm vụ của ban" />
        </div>
      </FormDialog>

      <FormDialog
        open={editOpen}
        onOpenChange={(open) => { setEditOpen(open); if (!open) setSelected(null); }}
        title={`Chỉnh sửa ban: ${selected?.name ?? ''}`}
        onSubmit={handleEdit}
        submitLabel="Lưu thay đổi"
        submitAction="edit"
        submitDisabled={updateMutation.isPending}
      >
        <div className="space-y-1.5">
          <Label htmlFor="e-d-name">Tên ban <span className="text-destructive">*</span></Label>
          <Input id="e-d-name" value={eName} onChange={(e) => setEName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="e-d-description">Mô tả</Label>
          <Input id="e-d-description" value={eDescription} onChange={(e) => setEDescription(e.target.value)} />
        </div>

        <div className="space-y-2 rounded-md border border-border p-3">
          <p className="text-sm font-medium">Thành viên ban</p>
          {membersQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Đang tải thành viên…</p>
          ) : members.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa có thành viên nào.</p>
          ) : (
            <ul className="space-y-1.5">
              {members.map((member: DepartmentMemberApi) => (
                <li key={member.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="flex flex-wrap items-center gap-1.5">
                    {member.fullName ?? member.email}
                    {member.roles.map((r) => <Badge key={r} variant="outline">{roleLabel(r)}</Badge>)}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="text-destructive hover:bg-destructive/10"
                    disabled={removeMemberMutation.isPending}
                    onClick={() => selected && removeMemberMutation.mutate({ departmentId: selected.id, userId: member.id })}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </li>
              ))}
            </ul>
          )}

          <div className="flex items-end gap-2 pt-1">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="d-assign-user">Thêm thành viên (chuyên viên / lãnh đạo)</Label>
              <Select value={assignUserId} onValueChange={(v) => setAssignUserId(v ?? '')}>
                <SelectTrigger id="d-assign-user"><SelectValue placeholder="Chọn tài khoản" /></SelectTrigger>
                <SelectContent>
                  {assignableUsers.map((u) => (
                    <SelectItem key={u.id} value={u.id}>{userDisplayName(u)} ({u.email})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              type="button"
              size="sm"
              disabled={!assignUserId || assignMutation.isPending}
              disabledReason="Chọn một tài khoản để thêm vào ban."
              onClick={() => selected && assignUserId && assignMutation.mutate({ userId: assignUserId, departmentId: selected.id })}
            >
              <UserPlus className="h-4 w-4" /> Thêm
            </Button>
          </div>
        </div>
      </FormDialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Xóa ban?"
        description={`Xóa ban ${selected?.name ?? ''}? Chỉ có thể xóa ban không còn thành viên và nhóm tiêu chí. Hành động này không thể hoàn tác.`}
        confirmLabel="Xóa ban"
        variant="destructive"
        onConfirm={() => selected && deleteMutation.mutate(selected.id)}
      />

      {selected && !editOpen && !deleteOpen && (
        <div className="mt-3 flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => selected && openEdit(selected)}>
            Chỉnh sửa
          </Button>
          <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="h-3.5 w-3.5" /> Xóa
          </Button>
        </div>
      )}
    </div>
  );
}
