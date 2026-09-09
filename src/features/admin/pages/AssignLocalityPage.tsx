import { type ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useScoreStore } from '@/store/scoreStore';
import type { CriteriaTableAttachment } from '@/types/domain';
import { Button, EmptyState, PageHeader } from '@/components/core';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { ArrowLeft, Building2, Check, FileText, MapPinned, Paperclip, Search, Trash2 } from 'lucide-react';

export default function AssignLocalityPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const criteriaTables = useScoreStore((s) => s.criteriaTables);
  const localities = useScoreStore((s) => s.localities);
  const assignments = useScoreStore((s) => s.assignments);
  const setLocalityAssignments = useScoreStore((s) => s.setLocalityAssignments);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [attachments, setAttachments] = useState<CriteriaTableAttachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const table = useMemo(() => criteriaTables.find((t) => t.id === id), [criteriaTables, id]);
  const assignedIds = useMemo(() => (id ? assignments[id] ?? [] : []), [assignments, id]);
  const selected = useMemo(() => new Set(selectedIds), [selectedIds]);
  const filteredLocalities = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('vi-VN');
    if (!normalizedQuery) return localities;
    return localities.filter((locality) =>
      `${locality.name} ${locality.code} ${locality.region}`.toLocaleLowerCase('vi-VN').includes(normalizedQuery),
    );
  }, [localities, query]);

  useEffect(() => {
    setSelectedIds(assignedIds);
  }, [id, assignedIds]);

  useEffect(() => {
    setAttachments(table?.assignmentAttachments ?? []);
  }, [id, table?.assignmentAttachments]);

  if (!table) {
    return (
      <EmptyState
        title="Không tìm thấy bảng tiêu chí"
        description="Bảng tiêu chí không tồn tại hoặc đã bị xóa."
        icon={<Building2 className="h-8 w-8" />}
      />
    );
  }

  const toggle = (localityId: string) => {
    setSelectedIds((current) =>
      current.includes(localityId) ? current.filter((item) => item !== localityId) : [...current, localityId],
    );
  };

  const selectAll = () => setSelectedIds(localities.map((locality) => locality.id));

  const handleFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    setAttachments((current) => {
      const existing = new Set(current.map((file) => file.id));
      const newFiles = files
        .map((file) => ({
          id: `${file.name}-${file.size}-${file.lastModified}`,
          fileName: file.name,
          fileSize: file.size,
        }))
        .filter((file) => !existing.has(file.id));
      return [...current, ...newFiles];
    });
    event.target.value = '';
  };

  const applyAssignments = () => {
    if (selectedIds.length === 0) {
      toast.error('Hãy chọn ít nhất một địa phương để áp dụng tiêu chí.');
      return;
    }

    setLocalityAssignments(table.id, selectedIds, attachments);
    toast.success(`Đã áp dụng tiêu chí cho ${selectedIds.length} địa phương.`, {
      description: attachments.length ? `Đã chọn kèm ${attachments.length} tệp đính kèm.` : undefined,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Gán địa phương — ${table.name}`}
        description="Chọn từng địa phương hoặc áp dụng đồng loạt cho toàn bộ địa phương. Tệp đính kèm là không bắt buộc."
        actions={
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft /> Quay lại
          </Button>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <MapPinned className="size-4 text-primary" /> Địa phương áp dụng
            </CardTitle>
            <CardDescription>
              Đã chọn {selectedIds.length}/{localities.length} địa phương. Các thay đổi chỉ được lưu khi bấm “Áp dụng tiêu chí”.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full sm:max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Tìm theo tên hoặc mã địa phương"
                  className="pl-9"
                />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="select-all-localities"
                  checked={localities.length > 0 && selectedIds.length === localities.length}
                  onCheckedChange={(checked) => (checked ? selectAll() : setSelectedIds([]))}
                />
                <label htmlFor="select-all-localities" className="cursor-pointer text-sm font-medium">
                  Chọn tất cả địa phương
                </label>
              </div>
            </div>

            {localities.length > 0 ? (
              <div className="max-h-[30rem] overflow-y-auto rounded-md border">
                {filteredLocalities.map((locality) => {
                  const isSelected = selected.has(locality.id);
                  return (
                    <label
                      key={locality.id}
                      htmlFor={`loc-${locality.id}`}
                      className={`flex cursor-pointer items-center justify-between gap-4 border-b px-4 py-3 last:border-b-0 transition-colors hover:bg-muted/45 ${
                        isSelected ? 'bg-primary/[0.045]' : ''
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{locality.name}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Mã {locality.code} · {locality.region}
                        </p>
                      </div>
                      <Checkbox
                        id={`loc-${locality.id}`}
                        checked={isSelected}
                        onCheckedChange={() => toggle(locality.id)}
                      />
                    </label>
                  );
                })}
                {filteredLocalities.length === 0 && (
                  <p className="p-8 text-center text-sm text-muted-foreground">Không tìm thấy địa phương phù hợp.</p>
                )}
              </div>
            ) : (
              <p className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
                Chưa có địa phương nào trong hệ thống.
              </p>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <Paperclip className="size-4 text-primary" /> Tệp đính kèm
              </CardTitle>
              <CardDescription>Không bắt buộc. Có thể chọn nhiều tệp.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFiles}
              />
              <Button variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>
                <Paperclip /> Chọn tệp đính kèm
              </Button>
              {attachments.length === 0 ? (
                <p className="rounded-md border border-dashed px-3 py-5 text-center text-xs leading-5 text-muted-foreground">
                  Chưa chọn tệp nào. Bạn có thể tiếp tục áp dụng mà không cần đính kèm tệp.
                </p>
              ) : (
                <ul className="space-y-2">
                  {attachments.map((file) => (
                    <li key={file.id} className="flex items-center gap-2 rounded-md border bg-muted/30 p-2">
                      <FileText className="size-4 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 flex-1 truncate text-xs font-medium" title={file.fileName}>{file.fileName}</span>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        aria-label={`Bỏ tệp ${file.fileName}`}
                        onClick={() => setAttachments((current) => current.filter((item) => item.id !== file.id))}
                      >
                        <Trash2 />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-primary/[0.025]">
            <CardContent className="space-y-3 pt-4">
              <div className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 size-4 shrink-0 text-success" />
                <span><strong>{selectedIds.length} địa phương</strong> sẽ nhận bảng tiêu chí này.</span>
              </div>
              <Button className="w-full" onClick={applyAssignments} disabled={localities.length === 0}>
                <Check /> Áp dụng tiêu chí
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
