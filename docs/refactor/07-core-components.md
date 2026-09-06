# Phase 7 — Chuẩn hoá core components

**Thời lượng:** ~1 ngày. **Phụ thuộc:** Phase 1 (B1 đã fix badge). Chạy song song được với Phase 2–4.
**Nâng điểm:** UI nhất quán 7→10 (cùng [06-polish-docs.md](06-polish-docs.md)).

Mục tiêu: mọi pattern UI lặp ≥ 2 lần có 1 component ở `src/components/core/`. Xoá core chết. Không đổi giao diện hiển thị.

---

## 1. Inventory hiện tại

`src/components/core/` — 13 component, 14 file (13 module + `index.ts`). Tất cả export qua `index.ts`, không mồ côi.

| Component | Số file dùng | Việc |
|---|--:|---|
| PageHeader | 16 | giữ |
| EmptyState | 9 | **thêm biến thể error** (§4) |
| DataTable | 5 | giữ; 2 trang chấm điểm cố tình không dùng (§3) |
| StatCard | 4 | giữ |
| AuditTimeline | 3 | giữ |
| CountdownBanner | 3 | giữ |
| ConfirmDialog | 2 | giữ |
| FilterSelect | 2 | giữ |
| NavItem | 2 | giữ |
| ScoreStateBadge | 2 (+2 hand-roll) | **thay 2 chỗ hand-roll** (§2) |
| LocalityStatusBadge | 2 | giữ |
| DetailDialog | 1 | mới thêm, giữ |
| ListDialog | **0** | **xoá hoặc wire** (§5) |

---

## 2. Thay hand-roll badge bằng core

### 2.1 `ScoreStateBadge` (trùng B1 — nếu Phase 1 đã làm thì bỏ qua)
`src/features/cham-diem/pages/ScoreByCriteriaPage.tsx` (~dòng 176) và `ScoreByLocalityPage.tsx` (~dòng 142):
```tsx
// XOÁ:
<Badge variant={record.state === 'DA_CONG_BO' ? 'success' : record.state !== 'DRAFT' ? 'info' : 'secondary'}>
  {record.state}
</Badge>
// THAY:
<ScoreStateBadge state={record.state} />
```
Bỏ import `Badge` nếu file không còn dùng.

### 2.2 Gom variant map cục bộ vào `StatusBadge.tsx`
Hiện `CriteriaListPage.tsx` khai `statusVariant` cục bộ, `AuditLogPage.tsx` khai `actionVariant` cục bộ. Chuyển vào `src/components/core/StatusBadge.tsx`:
```tsx
import { CRITERIA_STATUS_LABELS, ACTION_LABELS } from '@/constants/enums';
import type { CriteriaTableStatus, ActionType } from '@/types/rbac';

const criteriaStatusVariant: Record<CriteriaTableStatus, BadgeVariant> = {
  DRAFT: 'secondary', ACTIVE: 'success', EXPIRED: 'outline',
};
export function CriteriaStatusBadge({ status }: { status: CriteriaTableStatus }) {
  return <Badge variant={criteriaStatusVariant[status]}>{CRITERIA_STATUS_LABELS[status]}</Badge>;
}

const actionVariant: Record<ActionType, BadgeVariant> = {
  SCORE: 'info', EDIT: 'warning', APPROVE: 'success', REJECT: 'destructive', PUBLISH: 'success',
};
export function ActionBadge({ action }: { action: ActionType }) {
  return <Badge variant={actionVariant[action]}>{ACTION_LABELS[action]}</Badge>;
}
```
> Giữ nguyên variant hiện hành của mỗi trang khi copy (đừng đổi màu). Export thêm ở `core/index.ts`.
> Dùng ở `CriteriaListPage` (2 chỗ: cell + DetailDialog), `AuditLogPage` (cell).

### 2.3 Badge để nguyên (KHÔNG cần core)
`LocalityListPage` mã đơn vị (`variant="outline"` chip), `MinhChungPage` đếm minh chứng (`variant="secondary"`). Là badge trang trí, không gắn enum trạng thái → giữ raw.

---

## 3. `ScoreGrid` — core mới (nếu 2 trang chấm điểm hội tụ)

`ScoreByCriteriaPage` và `ScoreByLocalityPage` cùng dựng `<Table>` thô từ `ui/table` với: hàng = địa phương (hoặc tiêu chí), ô `<ScoreInput>` editable theo `state === 'DRAFT'` + quyền, cột tổng, cột trạng thái (`ScoreStateBadge`), nút Nộp.

**Quyết định:**
- **(a) Tách `core/ScoreGrid.tsx`** nếu muốn 1 nguồn: props `rows`, `criteria`, `getRecord(rowId)`, `onScore(rowId, criteriaId, value)`, `onSubmit(rowId)`, `orientation: 'by-criteria' | 'by-locality'`, `readOnly`. Cả 2 trang chỉ còn wiring data.
- **(b) Giữ raw** nếu chấp nhận 2 bản. Khi đó **bắt buộc**: dùng `ScoreStateBadge`, `EmptyState` core, và `DataTable`-style loading skeleton — không tự chế.

Khuyến nghị (a) — 2 trang đã ~80% trùng khung.

Không đổi giao diện: `ScoreGrid` render đúng markup hiện tại (cùng class Tailwind).

---

## 4. `EmptyState` — thêm biến thể error + retry

`EmptyState` hiện chỉ có title/description/icon. Thêm prop cho trạng thái lỗi tải dữ liệu (React Query `isError`):
```tsx
interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  variant?: 'empty' | 'error';       // 'error' → icon cảnh báo mặc định + tông destructive nhẹ
  action?: { label: string; onClick: () => void }; // vd "Thử lại" → refetch()
}
```
- `variant='error'` mặc định icon `AlertTriangle`, `action.label='Thử lại'`.
- Mọi trang có `useQuery`: `isError` → `<EmptyState variant="error" title="Không tải được dữ liệu" action={{ label: 'Thử lại', onClick: refetch }} />`. (Trùng [06-polish-docs.md](06-polish-docs.md) §1 — làm ở đây, tick ở đó.)

---

## 5. Core thiếu — thêm mới

### 5.1 `core/RejectDialog.tsx`
Trùng ~25 dòng ở `ApprovalPage.tsx` **và** `StandingCommitteePage.tsx` ("Trả lại hồ sơ" + input lý do + validate `!reason.trim()` + Hủy/Trả lại).
```tsx
interface RejectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  localityName?: string;
  /** RBAC cho nút xác nhận */
  action?: 'reject';
  state?: ScoreState;
  scope?: Scope;
  onConfirm: (reason: string) => void;
  title?: string;          // mặc định "Trả lại hồ sơ"
  confirmLabel?: string;   // mặc định "Trả lại"
}
```
- Quản lý `reason` nội bộ, reset khi đóng.
- Nút xác nhận `disabled={!reason.trim()}`, `variant="destructive"`, truyền `action/state/scope` xuống `Button` core.
- `onConfirm(reason.trim())` rồi `onOpenChange(false)`.
- Thay cả 2 chỗ: `ApprovalPage` (`rejectRow`/`reason` state gộp lại), `StandingCommitteePage` (tương tự).

### 5.2 `core/AuditTimelineDialog.tsx`
Trùng block `<Dialog>` bọc `<AuditTimeline>` ("Lịch sử thay đổi — {tên}") ở `ApprovalPage.tsx` + `StandingCommitteePage.tsx`.
```tsx
interface AuditTimelineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  localityName?: string;
  entries: AuditEntry[];
}
```
- `DialogContent max-w-lg`, `max-h-[60vh] overflow-auto`, footer nút "Đóng".
- Thay 2 chỗ (`diffRow` state giữ nguyên, chỉ đổi phần render).

### 5.3 `core/FormDialog.tsx`
`CriteriaListPage.tsx` và `LocalityListPage.tsx` mỗi trang tự dựng `<Dialog>` tạo/sửa với form. Trừu xuất khung:
```tsx
interface FormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  onSubmit: (e: React.FormEvent) => void;   // caller lo validate + gọi mutation
  submitLabel?: string;                       // mặc định "Lưu"
  submitDisabled?: boolean;
  submitAction?: Action; submitState?: ScoreState;   // RBAC
  children: ReactNode;                        // các field form
  size?: string;                              // max-w-*
}
```
- `<form onSubmit>` bọc `children` + `DialogFooter` (Hủy / submit).
- Không ôm state field — caller quản lý (RHF hoặc useState).
- `CriteriaFormPage` là trang riêng (không dialog) → **không** đổi; chỉ dialog "tạo nhanh" ở `CriteriaListPage` và form ở `LocalityListPage`.

### 5.4 (tuỳ chọn) `core/ReasonField.tsx`
Input + Label + hint "bắt buộc" dùng chung trong `RejectDialog` và chỗ "sửa điểm cần lý do" (`LABELS.REASON_CHANGE_REQUIRED`). Nhỏ — làm nếu tiện.

---

## 6. `ListDialog` — xử lý code chết

0 usage. Chọn:
- **(a) Wire vào:** `CriteriaListPage` — popover "N địa phương đã gán" (`assignedLocalityCount`) mở `ListDialog` liệt kê tên + search. Hoặc `AssignLocalityPage` xem nhanh danh sách đã chọn.
- **(b) Xoá:** `ListDialog.tsx` + dòng export trong `index.ts` + type `ListDialogItem`/`ListDialogProps`.

Khuyến nghị (a) nếu tính năng "xem địa phương đã gán" có giá trị; nếu không → (b), đừng giữ code chết.

---

## 7. Bảng core sau Phase 7 (mục tiêu)

| Nhóm | Component |
|---|---|
| Layout/trang | PageHeader, EmptyState (empty+error), StatCard, CountdownBanner, NavItem |
| Bảng | DataTable, ScoreGrid* |
| Dialog | ConfirmDialog, DetailDialog, FormDialog*, RejectDialog*, AuditTimelineDialog*, ListDialog (nếu giữ) |
| Badge | ScoreStateBadge, LocalityStatusBadge, CriteriaStatusBadge*, ActionBadge* |
| Khác | Button, AuditTimeline, FilterSelect |

`*` = thêm/đổi ở phase này.

---

## 8. Nguyên tắc khi thêm core

- Chỉ tách khi lặp **≥ 2** nơi, hoặc chắc chắn sắp lặp.
- Component core **không** gọi store/service/query trực tiếp — nhận data + callback qua props. (Giữ testable, tái dùng.)
- Giữ nguyên markup + class Tailwind hiện có khi trừu xuất — diff phải là "di chuyển", không "đổi nhìn".
- Export qua `index.ts`. Có `type` export nếu props phức tạp.
- 1 component = 1 file, tên `PascalCase.tsx`.

---

## Nghiệm thu Phase 7

- [ ] `grep -rn "<Badge" src/features` — chỉ còn badge trang trí (mã đơn vị, đếm); 0 badge gắn enum trạng thái.
- [ ] `grep -rn "Trả lại hồ sơ" src/features` — xuất hiện 0 lần (đã vào `RejectDialog`); component core dùng ở ≥ 2 trang.
- [ ] `grep -rn "AuditTimeline" src/features` — chỉ qua `AuditTimelineDialog` hoặc trang audit chính.
- [ ] `ListDialog`: hoặc có ≥ 1 usage, hoặc đã xoá sạch (file + export + types).
- [ ] `EmptyState` có `variant='error'` + `action`; mọi `isError` của query dùng nó.
- [ ] Không core component nào import `useScoreStore`/`use*Query`/service.
- [ ] Ảnh chụp trước/sau mỗi trang bị đụng: giao diện **không đổi**.
- [ ] `pnpm lint` + `pnpm typecheck` sạch; test component ([04-testing.md](04-testing.md) §5) cập nhật cho `RejectDialog`, `FormDialog`.
