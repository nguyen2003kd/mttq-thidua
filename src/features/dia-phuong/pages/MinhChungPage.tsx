import { useMemo, useRef, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useScoreStore } from '@/store/scoreStore';
import { PageHeader, EmptyState } from '@/components/core';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/core';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils';
import { Upload, Trash2, FileText, MapPin, FileCheck, Paperclip } from 'lucide-react';
import type { Evidence } from '@/types/domain';

export default function MinhChungPage() {
  const user = useAuthStore((s) => s.user);
  const criteriaTables = useScoreStore((s) => s.criteriaTables);
  const evidence = useScoreStore((s) => s.evidence);
  const uploadEvidence = useScoreStore((s) => s.uploadEvidence);
  const deleteEvidence = useScoreStore((s) => s.deleteEvidence);

  const [selectedCriteriaId, setSelectedCriteriaId] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const table = criteriaTables[0];

  const localityEvidence = useMemo(
    () => evidence.filter((e) => e.localityId === user?.localityId).sort((a, b) => +new Date(b.uploadedAt) - +new Date(a.uploadedAt)),
    [evidence, user?.localityId],
  );

  if (!user?.localityId) {
    return (
      <EmptyState
        title="Chưa gán địa phương"
        description="Tài khoản hiện tại chưa được gán địa phương nào."
        icon={<MapPin className="h-8 w-8" />}
      />
    );
  }

  if (!table) {
    return (
      <EmptyState
        title="Chưa có bảng tiêu chí"
        description="Hiện chưa có bảng tiêu chí nào được mở."
        icon={<FileCheck className="h-8 w-8" />}
      />
    );
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedCriteriaId || !user.localityId) return;
    const fileUrl = URL.createObjectURL(file);
    uploadEvidence({
      criteriaId: selectedCriteriaId,
      localityId: user.localityId,
      fileName: file.name,
      fileUrl,
    });
    toast.success('Đã tải lên minh chứng', { description: file.name });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDelete = (ev: Evidence) => {
    if (window.confirm(`Xóa minh chứng ${ev.fileName}?`)) {
      URL.revokeObjectURL(ev.fileUrl);
      deleteEvidence(ev.id);
      toast.success('Đã xóa minh chứng');
    }
  };

  const evidenceByCriteria = (criteriaId: string) =>
    localityEvidence.filter((e) => e.criteriaId === criteriaId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nộp minh chứng"
        description="Tải lên tài liệu minh chứng cho từng tiêu chí. Các tệp sẽ được liên kết với bảng điểm của địa phương."
      />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Upload className="h-4 w-4 text-primary" />
            Tải lên mới
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="criteria-select">Tiêu chí</Label>
              <Select
                value={selectedCriteriaId}
                onValueChange={(val) => setSelectedCriteriaId(val as string)}
              >
                <SelectTrigger id="criteria-select">
                  <SelectValue placeholder="Chọn tiêu chí...">
                    {selectedCriteriaId
                      ? table.criteria.find((c) => c.id === selectedCriteriaId)?.name + ` (tối đa ${table.criteria.find((c) => c.id === selectedCriteriaId)?.maxScore} điểm)`
                      : 'Chọn tiêu chí...'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {table.criteria.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} (tối đa {c.maxScore} điểm)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="evidence-file">Tệp đính kèm</Label>
              <Input
                id="evidence-file"
                ref={fileInputRef}
                type="file"
                disabled={!selectedCriteriaId}
                onChange={handleFileChange}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Hỗ trợ tải lên một tệp cho mỗi lần. Có thể nộp nhiều minh chứng cho cùng một tiêu chí.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {table.criteria.map((criteria) => {
          const files = evidenceByCriteria(criteria.id);
          return (
            <Card key={criteria.id}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold leading-tight">{criteria.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {files.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Chưa có minh chứng.</p>
                ) : (
                  <ul className="space-y-2">
                    {files.map((ev) => (
                      <li key={ev.id} className="flex items-center justify-between gap-2 rounded-md border bg-muted/30 px-3 py-2">
                        <a
                          href={ev.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 text-sm hover:underline truncate"
                          title={ev.fileName}
                        >
                          <Paperclip className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          <span className="truncate">{ev.fileName}</span>
                        </a>
                        <Button
                          size="icon-xs"
                          variant="ghost"
                          action="delete"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(ev)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {files.length} tệp
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {localityEvidence.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Lịch sử tải lên</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {localityEvidence.slice(0, 10).map((ev) => (
                <li key={ev.id} className="flex items-center justify-between py-3 text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <a href={ev.fileUrl} target="_blank" rel="noreferrer" className="truncate hover:underline">
                      {ev.fileName}
                    </a>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDate(ev.uploadedAt)}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
