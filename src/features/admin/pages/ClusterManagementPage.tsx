import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';
import { PageHeader, DataTable, Button, FormDialog, ConfirmDialog } from '@/components/core';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  clustersApi,
  getClusterApiError,
  type ClusterApi,
} from '../api/clustersApi';

export default function ClusterManagementPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<ClusterApi | null>(null);
  const [fName, setFName] = useState('');
  const [fDescription, setFDescription] = useState('');
  const [eName, setEName] = useState('');
  const [eDescription, setEDescription] = useState('');
  const [assignWardCode, setAssignWardCode] = useState('');
  const [fWardCodes, setFWardCodes] = useState<string[]>([]);
  const [fWardSearch, setFWardSearch] = useState('');

  const clustersQuery = useQuery({
    queryKey: ['admin-clusters'],
    queryFn: () => clustersApi.list(),
  });

  const clusters = useMemo(() => {
    const items = clustersQuery.data ?? [];
    const term = search.trim().toLowerCase();
    if (!term) return items;
    return items.filter((c) => c.name.toLowerCase().includes(term));
  }, [clustersQuery.data, search]);

  const availableWardsQuery = useQuery({
    queryKey: ['admin-cluster-available-wards'],
    queryFn: () => clustersApi.availableWards(),
    enabled: editOpen || createOpen,
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin-clusters'] });
    void queryClient.invalidateQueries({ queryKey: ['admin-cluster-available-wards'] });
  };

  const createMutation = useMutation({
    mutationFn: async (payload: { name: string; description?: string | null; wardCodes: string[] }) => {
      const created = await clustersApi.create({ name: payload.name, description: payload.description });
      const results = await Promise.allSettled(
        payload.wardCodes.map((code) => clustersApi.assignWard(created.id, code)),
      );
      const failed = results.filter((r) => r.status === 'rejected').length;
      return { created, failed };
    },
    onSuccess: ({ failed }) => {
      if (failed > 0) {
        toast.warning(`Đã tạo cụm, nhưng ${failed} phường/xã không gán được.`);
      } else {
        toast.success('Đã tạo cụm');
      }
      setCreateOpen(false);
      setFWardCodes([]);
      invalidate();
    },
    onError: (e) => toast.error(getClusterApiError(e)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { name: string; description?: string | null } }) =>
      clustersApi.update(id, payload),
    onSuccess: (updated) => {
      toast.success('Đã cập nhật cụm');
      setSelected(updated);
      invalidate();
    },
    onError: (e) => toast.error(getClusterApiError(e)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => clustersApi.remove(id),
    onSuccess: () => {
      toast.success('Đã xóa cụm');
      setDeleteOpen(false);
      setSelected(null);
      invalidate();
    },
    onError: (e) => toast.error(getClusterApiError(e)),
  });

  const assignMutation = useMutation({
    mutationFn: ({ clusterId, wardCode }: { clusterId: string; wardCode: string }) =>
      clustersApi.assignWard(clusterId, wardCode),
    onSuccess: (updated) => {
      toast.success('Đã thêm phường/xã vào cụm');
      setSelected(updated);
      setAssignWardCode('');
      invalidate();
    },
    onError: (e) => toast.error(getClusterApiError(e)),
  });

  const removeWardMutation = useMutation({
    mutationFn: ({ clusterId, wardCode }: { clusterId: string; wardCode: string }) =>
      clustersApi.removeWard(clusterId, wardCode),
    onSuccess: (_res, vars) => {
      toast.success('Đã gỡ phường/xã khỏi cụm');
      if (selected) {
        setSelected({
          ...selected,
          wardCount: selected.wards.filter((w) => w.wardCode !== vars.wardCode).length,
          wards: selected.wards.filter((w) => w.wardCode !== vars.wardCode),
        });
      }
      invalidate();
    },
    onError: (e) => toast.error(getClusterApiError(e)),
  });

  const availableWards = availableWardsQuery.data ?? [];
  const clusterWards = selected?.wards ?? [];

  const columns = useMemo<ColumnDef<ClusterApi>[]>(() => [
    {
      accessorKey: 'name',
      header: 'Tên cụm',
      meta: { className: 'font-medium', list: { width: 'minmax(200px, 1.4fr)' } },
    },
    {
      accessorKey: 'description',
      header: 'Mô tả',
      cell: ({ row }) => <span className="line-clamp-2 text-sm text-muted-foreground">{row.original.description ?? '—'}</span>,
      meta: { list: { width: 'minmax(220px, 1.6fr)' } },
    },
    {
      accessorKey: 'wardCount',
      header: 'Phường/xã',
      meta: { align: 'center', list: { width: '110px' } },
    },
  ], []);

  const openEdit = (cluster: ClusterApi) => {
    // Lấy lại detail mới nhất để có danh sách wards đầy đủ.
    setSelected(cluster);
    setEName(cluster.name);
    setEDescription(cluster.description ?? '');
    setAssignWardCode('');
    setEditOpen(true);
    void clustersApi.get(cluster.id).then((detail) => setSelected(detail)).catch(() => undefined);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fName.trim()) { toast.error('Vui lòng nhập tên cụm.'); return; }
    createMutation.mutate({ name: fName.trim(), description: fDescription.trim() || null, wardCodes: fWardCodes });
  };

  const toggleCreateWard = (code: string) => {
    setFWardCodes((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]));
  };

  const filteredAvailableWards = availableWards.filter((w) => {
    const term = fWardSearch.trim().toLowerCase();
    if (!term) return true;
    const label = (w.fullName ?? w.name ?? w.code).toLowerCase();
    return label.includes(term) || w.code.includes(term);
  });

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !eName.trim()) { toast.error('Vui lòng nhập tên cụm.'); return; }
    updateMutation.mutate({ id: selected.id, payload: { name: eName.trim(), description: eDescription.trim() || null } });
  };

  return (
    <div>
      <PageHeader
        title="Quản lý Cụm"
        description="Chia các phường/xã có tài khoản địa phương thành từng cụm để quản lý. Mỗi phường/xã chỉ thuộc một cụm."
        className="pb-3 border-b-0"
      />

      <DataTable
        data={clusters}
        columns={columns}
        variant="list"
        getRowId={(row) => row.id}
        loading={clustersQuery.isLoading}
        pageSize={10}
        onRowClick={openEdit}
        filters={
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm tên cụm…"
            className="h-9 w-64"
          />
        }
        emptyState={{ title: 'Chưa có cụm', description: 'Tạo cụm đầu tiên để bắt đầu nhóm phường/xã.' }}
        toolbar={
          <Button size="sm" className="h-9!" onClick={() => { setFName(''); setFDescription(''); setFWardCodes([]); setFWardSearch(''); setCreateOpen(true); }} action="create">
            <Plus className="h-4 w-4 ml-2" /> Thêm cụm
          </Button>
        }
      />

      <FormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Thêm cụm mới"
        onSubmit={handleCreate}
        submitLabel="Tạo cụm"
        submitAction="create"
        submitDisabled={createMutation.isPending}
      >
        <div className="space-y-1.5">
          <Label htmlFor="c-name">Tên cụm <span className="text-destructive">*</span></Label>
          <Input id="c-name" value={fName} onChange={(e) => setFName(e.target.value)} placeholder="VD: Cụm số 1" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="c-description">Mô tả</Label>
          <Input id="c-description" value={fDescription} onChange={(e) => setFDescription(e.target.value)} placeholder="Mô tả ngắn về cụm" />
        </div>

        <div className="space-y-2 rounded-md border border-border p-3">
          <p className="text-sm font-medium">
            Phường/xã trong cụm
            {fWardCodes.length > 0 && <span className="ml-1 text-muted-foreground">(đã chọn {fWardCodes.length})</span>}
          </p>
          <Input
            value={fWardSearch}
            onChange={(e) => setFWardSearch(e.target.value)}
            placeholder="Tìm phường/xã…"
            className="h-8"
          />
          {availableWardsQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Đang tải danh sách phường/xã…</p>
          ) : filteredAvailableWards.length === 0 ? (
            <p className="text-sm text-muted-foreground">Không còn phường/xã nào có tài khoản địa phương chưa gán cụm.</p>
          ) : (
            <ul className="max-h-48 space-y-1 overflow-y-auto pr-1">
              {filteredAvailableWards.map((w) => (
                <li key={w.code} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    id={`cw-${w.code}`}
                    checked={fWardCodes.includes(w.code)}
                    onCheckedChange={() => toggleCreateWard(w.code)}
                  />
                  <Label htmlFor={`cw-${w.code}`} className="cursor-pointer font-normal">
                    {w.fullName ?? w.name ?? w.code}
                  </Label>
                </li>
              ))}
            </ul>
          )}
        </div>
      </FormDialog>

      <FormDialog
        open={editOpen}
        onOpenChange={(open) => { setEditOpen(open); if (!open) setSelected(null); }}
        title={`Chỉnh sửa cụm: ${selected?.name ?? ''}`}
        onSubmit={handleEdit}
        submitLabel="Lưu thay đổi"
        submitAction="edit"
        submitDisabled={updateMutation.isPending}
      >
        <div className="space-y-1.5">
          <Label htmlFor="e-c-name">Tên cụm <span className="text-destructive">*</span></Label>
          <Input id="e-c-name" value={eName} onChange={(e) => setEName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="e-c-description">Mô tả</Label>
          <Input id="e-c-description" value={eDescription} onChange={(e) => setEDescription(e.target.value)} />
        </div>

        <div className="space-y-2 rounded-md border border-border p-3">
          <p className="text-sm font-medium">Phường/xã trong cụm</p>
          {clusterWards.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa có phường/xã nào trong cụm.</p>
          ) : (
            <ul className="space-y-1.5">
              {clusterWards.map((ward) => (
                <li key={ward.wardCode} className="flex items-center justify-between gap-2 text-sm">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                    {ward.wardFullName ?? ward.wardName ?? ward.wardCode}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="text-destructive hover:bg-destructive/10"
                    disabled={removeWardMutation.isPending}
                    onClick={() => selected && removeWardMutation.mutate({ clusterId: selected.id, wardCode: ward.wardCode })}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </li>
              ))}
            </ul>
          )}

          <div className="flex items-end gap-2 pt-1">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="c-assign-ward">Thêm phường/xã (đã có tài khoản địa phương)</Label>
              <Select value={assignWardCode} onValueChange={(v) => setAssignWardCode(v ?? '')}>
                <SelectTrigger id="c-assign-ward"><SelectValue placeholder="Chọn phường/xã" /></SelectTrigger>
                <SelectContent>
                  {availableWards.map((w) => (
                    <SelectItem key={w.code} value={w.code}>{w.fullName ?? w.name ?? w.code}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              type="button"
              size="sm"
              disabled={!assignWardCode || assignMutation.isPending}
              disabledReason="Chọn một phường/xã để thêm vào cụm."
              onClick={() => selected && assignWardCode && assignMutation.mutate({ clusterId: selected.id, wardCode: assignWardCode })}
            >
              <Plus className="h-4 w-4" /> Thêm
            </Button>
          </div>
        </div>
      </FormDialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Xóa cụm?"
        description={`Xóa cụm ${selected?.name ?? ''}? Các phường/xã trong cụm sẽ được gỡ và trở về trạng thái chưa gán. Hành động này không thể hoàn tác.`}
        confirmLabel="Xóa cụm"
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
