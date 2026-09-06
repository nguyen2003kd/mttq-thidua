import { useMemo, useState } from 'react';
import { useScoreStore } from '@/store/scoreStore';
import { PageHeader, DataTable, Button, FilterSelect, DetailDialog, FormDialog } from '@/components/core';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Plus, Eye } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import type { Locality } from '@/types/domain';

const unitTypeLabels: Record<Locality['unitType'], string> = {
  thanh_pho: 'Thành phố',
  tinh: 'Tỉnh',
  phuong: 'Phường',
  xa: 'Xã',
};


export default function LocalityListPage() {
  const localities = useScoreStore((s) => s.localities);
  const createLocality = useScoreStore((s) => s.createLocality);
  const updateLocality = useScoreStore((s) => s.updateLocality);
  const deleteLocality = useScoreStore((s) => s.deleteLocality);

  const [unitFilter, setUnitFilter] = useState<string>('');

  const [selectedLocality, setSelectedLocality] = useState<Locality | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const [viewOpen, setViewOpen] = useState(false);

  // Create form state
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formFullName, setFormFullName] = useState('');
  const [formUnitType, setFormUnitType] = useState<Locality['unitType']>('phuong');
  const [formRegion, setFormRegion] = useState('');

  // Edit form state
  const [editCode, setEditCode] = useState('');
  const [editName, setEditName] = useState('');
  const [editFullName, setEditFullName] = useState('');
  const [editUnitType, setEditUnitType] = useState<Locality['unitType']>('phuong');
  const [editRegion, setEditRegion] = useState('');

  const filteredLocalities = useMemo(() => {
    return localities.filter((l) => {
      const unitMatch = !unitFilter || l.unitType === unitFilter;
      return unitMatch;
    });
  }, [localities, unitFilter]);

  const columns = useMemo<ColumnDef<Locality>[]>(
    () => [
      {
        accessorKey: 'fullName',
        header: 'Tên đầy đủ',
        meta: {
          className: 'font-medium',
          list: { width: 'minmax(260px, 1.8fr)' },
        },
      },
      {
        accessorKey: 'code',
        header: 'Mã',
        meta: {
          align: 'center',
          list: { width: '110px' },
        },
        cell: ({ row }) => (
          <Badge variant="outline" className="tabular-nums">{row.original.code}</Badge>
        ),
      },
      {
        accessorKey: 'unitType',
        header: 'Loại',
        meta: {
          align: 'center',
          list: { width: '1fr' },
        },
        cell: ({ row }) => (
          <span className="text-sm font-medium">{unitTypeLabels[row.original.unitType]}</span>
        ),
      },
    ],
    [],
  );

  const resetCreateForm = () => {
    setFormCode('');
    setFormName('');
    setFormFullName('');
    setFormUnitType('phuong');
    setFormRegion('Đông Nam Bộ');
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCode.trim() || !formName.trim() || !formFullName.trim() || !formRegion.trim()) {
      toast.error('Vui lòng nhập đầy đủ thông tin.');
      return;
    }
    if (localities.some((l) => l.code === formCode.trim())) {
      toast.error(`Mã "${formCode.trim()}" đã tồn tại.`);
      return;
    }
    createLocality({
      code: formCode.trim(),
      name: formName.trim(),
      fullName: formFullName.trim(),
      unitType: formUnitType,
      region: formRegion,
    });
    toast.success('Đã thêm địa phương mới');
    setCreateOpen(false);
    resetCreateForm();
  };

  const openEdit = (loc: Locality) => {
    setEditCode(loc.code);
    setEditName(loc.name);
    setEditFullName(loc.fullName);
    setEditUnitType(loc.unitType);
    setEditRegion(loc.region);
    setEditOpen(true);
  };

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLocality) return;
    if (!editName.trim() || !editFullName.trim() || !editRegion.trim()) {
      toast.error('Vui lòng nhập đầy đủ thông tin.');
      return;
    }
    updateLocality({
      ...selectedLocality,
      code: editCode.trim(),
      name: editName.trim(),
      fullName: editFullName.trim(),
      unitType: editUnitType,
      region: editRegion,
    });
    toast.success('Đã cập nhật địa phương');
    setEditOpen(false);
  };

  const handleDelete = () => {
    if (!selectedLocality) return;
    if (window.confirm(`Xóa địa phương "${selectedLocality.fullName}"?`)) {
      deleteLocality(selectedLocality.id);
      toast.success('Đã xóa địa phương');
      setSelectedLocality(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Địa phương"
        description="Quản lý danh sách các phường/xã thuộc Thành phố Đồng Nai."
        className="pb-3 border-b-0"
      />

      <DataTable
        data={filteredLocalities}
        columns={columns}
        variant="list"
        getRowId={(row) => row.id}
        searchable
        searchKey="fullName"
        searchPlaceholder="Tìm theo tên phường/xã..."
        stickyTitle="Địa phương Đồng Nai"
        stickyDescription="Quản lý danh sách các phường/xã thuộc Thành phố Đồng Nai."
        pageSize={10}
        onRowClick={(row) => setSelectedLocality(row)}
        filters={
          <FilterSelect
            label="Loại"
            value={unitFilter}
            onChange={setUnitFilter}
            options={[
              { value: 'phuong', label: unitTypeLabels.phuong },
              { value: 'xa', label: unitTypeLabels.xa },
            ]}
          />
        }
        activeFilters={
          unitFilter
            ? [{ label: 'Loại', value: unitTypeLabels[unitFilter as Locality['unitType']], onClear: () => setUnitFilter('') }]
            : []
        }
        onClearFilters={
          unitFilter
            ? () => setUnitFilter('')
            : undefined
        }
        emptyState={{
          title: 'Chưa có địa phương',
          description: 'Thêm phường/xã đầu tiên để bắt đầu.',
        }}
        toolbar={
          <div className="flex items-center gap-2">
            {selectedLocality && (
              <Button variant="warning" size="sm" className="!h-9" onClick={() => setViewOpen(true)}>
                <Eye className="h-3.5 w-3.5" /> Xem
              </Button>
            )}
            <Button size="sm" className="!h-9" onClick={() => { resetCreateForm(); setCreateOpen(true); }} action="create">
              <Plus className="h-4 w-4 ml-2" /> Thêm phường/xã
            </Button>
          </div>
        }
      />

      {/* View modal */}
      <DetailDialog
        open={viewOpen}
        onOpenChange={setViewOpen}
        title="Thông tin địa phương"
        subtitle={selectedLocality?.fullName}
        items={selectedLocality ? [
          { label: 'Tên đầy đủ', value: selectedLocality.fullName },
          { label: 'Tên ngắn', value: selectedLocality.name },
          { label: 'Mã', value: <span className="tabular-nums">{selectedLocality.code}</span> },
          { label: 'Loại', value: unitTypeLabels[selectedLocality.unitType] },
          { label: 'Vùng', value: selectedLocality.region },
        ] : []}
        onDelete={selectedLocality ? handleDelete : undefined}
        onEdit={selectedLocality ? () => { setViewOpen(false); openEdit(selectedLocality); } : undefined}
      />

      {/* Create modal */}
      <FormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Thêm phường/xã mới"
        onSubmit={handleCreate}
        submitLabel="Tạo mới"
        submitAction="create"
      >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="loc-code">Mã</Label>
                <Input id="loc-code" value={formCode} onChange={(e) => setFormCode(e.target.value)} placeholder="VD: 01" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="loc-unit-type">Loại đơn vị</Label>
                <Select
                  value={formUnitType}
                  onValueChange={(val) => setFormUnitType(val as Locality['unitType'])}
                >
                  <SelectTrigger id="loc-unit-type">
                    <SelectValue>
                      {formUnitType === 'phuong' ? 'Phường' : 'Xã'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="phuong">Phường</SelectItem>
                    <SelectItem value="xa">Xã</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="loc-name">Tên ngắn</Label>
              <Input id="loc-name" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="VD: Phường Biên Hòa" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="loc-full-name">Tên đầy đủ</Label>
              <Input id="loc-full-name" value={formFullName} onChange={(e) => setFormFullName(e.target.value)} placeholder="VD: Phường Biên Hòa" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="loc-region">Vùng</Label>
              <Input id="loc-region" value={formRegion} onChange={(e) => setFormRegion(e.target.value)} placeholder="VD: Đông Nam Bộ" />
            </div>
      </FormDialog>

      {/* Edit modal */}
      <FormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        title="Chỉnh sửa địa phương"
        onSubmit={handleEdit}
        submitLabel="Lưu thay đổi"
        submitAction="edit"
      >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="edit-code">Mã</Label>
                <Input id="edit-code" value={editCode} onChange={(e) => setEditCode(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-unit-type">Loại đơn vị</Label>
                <Select
                  value={editUnitType}
                  onValueChange={(val) => setEditUnitType(val as Locality['unitType'])}
                >
                  <SelectTrigger id="edit-unit-type">
                    <SelectValue>
                      {editUnitType === 'phuong' ? 'Phường' : 'Xã'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="phuong">Phường</SelectItem>
                    <SelectItem value="xa">Xã</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-name">Tên ngắn</Label>
              <Input id="edit-name" value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-full-name">Tên đầy đủ</Label>
              <Input id="edit-full-name" value={editFullName} onChange={(e) => setEditFullName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-region">Vùng</Label>
              <Input id="edit-region" value={editRegion} onChange={(e) => setEditRegion(e.target.value)} placeholder="VD: Đông Nam Bộ" />
            </div>
      </FormDialog>
    </div>
  );
}
