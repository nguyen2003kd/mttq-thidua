# Phase 1 — Tách domain logic + fix bug correctness

**Thời lượng:** ~1.5 ngày. **Phụ thuộc:** Phase 0.
**Nâng điểm:** kiến trúc 8→10, state-machine 5→10, +fix B1–B9.

Nguyên tắc: `src/lib/` chứa **toàn bộ** business rule dạng pure function. Store chỉ orchestrate. Không đổi UI/layout.

---

## 1. `src/lib/state-machine.ts` — viết lại là nguồn chân lý duy nhất

### 1.1 Kiểu & bảng transition đầy đủ

```ts
import type { ScoreState, LocalityStatus, Role, ActionType } from '@/types/rbac';
import type { AuditEntry } from '@/types/domain';

export type WorkflowAction = 'submit' | 'approve' | 'reject' | 'publish';

interface TransitionDef {
  from: ScoreState;
  action: WorkflowAction;
  to: ScoreState;
}

/** Bảng chuyển trạng thái — DUY NHẤT một nơi định nghĩa luồng duyệt. */
export const TRANSITIONS: readonly TransitionDef[] = [
  { from: 'DRAFT',              action: 'submit',  to: 'CHO_DUYET_BAN' },

  { from: 'CHO_DUYET_BAN',      action: 'approve', to: 'CHO_DUYET_HOI_DONG' },
  { from: 'CHO_DUYET_BAN',      action: 'reject',  to: 'DRAFT' },

  { from: 'CHO_DUYET_HOI_DONG', action: 'approve', to: 'CHO_DUYET_BTT' },
  { from: 'CHO_DUYET_HOI_DONG', action: 'reject',  to: 'CHO_DUYET_BAN' },

  { from: 'CHO_DUYET_BTT',      action: 'publish', to: 'DA_CONG_BO' },
  { from: 'CHO_DUYET_BTT',      action: 'reject',  to: 'CHO_DUYET_HOI_DONG' }, // B4: bổ sung
] as const;
```

### 1.2 API truy vấn

```ts
export function canTransition(from: ScoreState, action: WorkflowAction): boolean {
  return TRANSITIONS.some((t) => t.from === from && t.action === action);
}

export function getNextState(from: ScoreState, action: WorkflowAction): ScoreState | null {
  return TRANSITIONS.find((t) => t.from === from && t.action === action)?.to ?? null;
}

export function availableActions(from: ScoreState): WorkflowAction[] {
  return TRANSITIONS.filter((t) => t.from === from).map((t) => t.action);
}

export function isFinalState(state: ScoreState): boolean {
  return state === 'DA_CONG_BO';
}

export function isEditable(state: ScoreState): boolean {
  return state !== 'DA_CONG_BO';
}
```

### 1.3 `applyTransition` — pure, trả kết quả có audit

```ts
export interface TransitionActor { name: string; role: Role }

export interface TransitionOk {
  ok: true;
  nextState: ScoreState;
  audit: Omit<AuditEntry, 'id' | 'timestamp'>;
}
export interface TransitionErr {
  ok: false;
  error: 'INVALID_TRANSITION' | 'REASON_REQUIRED' | 'INCOMPLETE_SCORING' | 'FINAL_STATE';
}
export type TransitionResult = TransitionOk | TransitionErr;

const ACTION_TO_AUDIT: Record<WorkflowAction, ActionType> = {
  submit: 'SCORE', approve: 'APPROVE', reject: 'REJECT', publish: 'PUBLISH',
};

export function applyTransition(params: {
  from: ScoreState;
  action: WorkflowAction;
  actor: TransitionActor;
  localityId: string;
  reason?: string | null;
  /** cho action 'submit': đã chấm đủ mọi tiêu chí chưa (B5) */
  scoringComplete?: boolean;
}): TransitionResult {
  const { from, action, actor, localityId, reason, scoringComplete } = params;

  if (isFinalState(from)) return { ok: false, error: 'FINAL_STATE' };
  if (action === 'reject' && !reason?.trim()) return { ok: false, error: 'REASON_REQUIRED' };
  if (action === 'submit' && scoringComplete === false) return { ok: false, error: 'INCOMPLETE_SCORING' };

  const to = getNextState(from, action);
  if (!to) return { ok: false, error: 'INVALID_TRANSITION' };

  return {
    ok: true,
    nextState: to,
    audit: {
      actorName: actor.name,
      actorRole: actor.role,
      action: ACTION_TO_AUDIT[action],
      fieldName: `state - ${localityId}`,
      oldValue: from,
      newValue: to,
      reason: reason ?? null,
    },
  };
}
```

### 1.4 `isRecordComplete` helper (B5)

```ts
import type { CriteriaTable } from '@/types/domain';
import type { ScoreRecord } from '@/store/scoreStore'; // hoặc chuyển ScoreRecord vào types/domain

export function isRecordComplete(table: CriteriaTable, record: Pick<ScoreRecord, 'entries'>): boolean {
  const scored = new Set(record.entries.map((e) => e.criteriaId));
  return table.criteria.length > 0 && table.criteria.every((c) => scored.has(c.id));
}
```
> Khuyến nghị: chuyển `ScoreRecord` interface từ `scoreStore.ts` sang `src/types/domain.ts` để `lib/` không phụ thuộc ngược vào `store/`.

### 1.5 `toLocalityStatus` — bỏ union lai (B9)

```ts
export function toLocalityStatus(record: Pick<ScoreRecord, 'state' | 'submittedAt'>): LocalityStatus {
  if (record.state === 'DA_CONG_BO') return 'published';
  if (record.state !== 'DRAFT') return 'processing';
  return record.submittedAt ? 'submitted' : 'processing';
}
```
Grep `toLocalityStatus(` → cập nhật mọi caller truyền `record` thay vì string.

---

## 2. `src/store/scoreStore.ts` — co lại, dùng `applyTransition`

### 2.1 `submit` / `approve` / `reject` / `publish` — bản mới

Mọi hàm theo cùng khuôn:
```ts
function runTransition(
  state: ScoreStore,
  tableId: string, localityId: string,
  action: WorkflowAction,
  actor: TransitionActor,
  reason?: string | null,
): Partial<ScoreStore> | null {
  const table = state.criteriaTables.find((t) => t.id === tableId);
  const record = state.scores[tableId]?.[localityId] ?? state.emptyRecord;
  if (!table) return null;

  const res = applyTransition({
    from: record.state,
    action,
    actor,
    localityId,
    reason,
    scoringComplete: action === 'submit' ? isRecordComplete(table, record) : undefined,
  });
  if (!res.ok) return null; // store no-op; UI đã validate trước, toast lỗi ở caller nếu muốn

  const updated: ScoreRecord = {
    ...record,
    state: res.nextState,
    submittedAt: action === 'submit' ? now() : record.submittedAt,
    publishedAt: res.nextState === 'DA_CONG_BO' ? now() : record.publishedAt,
  };
  return {
    scores: { ...state.scores, [tableId]: { ...state.scores[tableId], [localityId]: updated } },
    audits: [...state.audits, { ...res.audit, id: uid(), timestamp: now() }],
  };
}

// dùng lại:
submit:  (tableId, localityId, name, role) => set((s) => runTransition(s, tableId, localityId, 'submit',  { name, role }) ?? s),
approve: (tableId, localityId, name, role) => set((s) => runTransition(s, tableId, localityId, 'approve', { name, role }) ?? s),
reject:  (tableId, localityId, reason, name, role) => set((s) => runTransition(s, tableId, localityId, 'reject', { name, role }, reason) ?? s),
publish: (tableId, localityId, name, role) => set((s) => runTransition(s, tableId, localityId, 'publish', { name, role }) ?? s),
```
Xoá toàn bộ if-else `if (record.state === 'CHO_DUYET_BAN') next = ...` cũ.

### 2.2 Selector nhận `tableId` (B6)

```ts
getActiveTableForLocality: (localityId) => {
  const s = get();
  const assignedTableIds = Object.entries(s.assignments)
    .filter(([, ids]) => ids.includes(localityId))
    .map(([tid]) => tid);
  const tables = s.criteriaTables.filter((t) => assignedTableIds.includes(t.id));
  return tables.find((t) => t.status === 'ACTIVE') ?? tables[0] ?? null;
},

getScoreForLocality: (localityId, tableId) => {
  const s = get();
  const table = tableId
    ? s.criteriaTables.find((t) => t.id === tableId) ?? null
    : s.getActiveTableForLocality(localityId);
  if (!table) return null;
  return { table, record: s.getScore(table.id, localityId) };
},

getRanking: (tableId) => {
  const s = get();
  const table = tableId ? s.criteriaTables.find((t) => t.id === tableId) : s.criteriaTables.find((t) => t.status === 'ACTIVE');
  if (!table) return [];
  const assigned = new Set(s.assignments[table.id] ?? []);
  return s.localities
    .filter((l) => assigned.has(l.id))
    .map((locality) => ({ locality, totalScore: s.getScore(table.id, locality.id).totalScore }))
    .sort((a, b) => b.totalScore - a.totalScore);
},
```
> `getRanking` giờ chỉ xếp địa phương **được gán** bảng đó (đúng nghiệp vụ hơn). Cập nhật `AdminDashboardPage`, `OverviewDashboardPage`, `DashboardContent`, `KetQuaPage` truyền `tableId` hoặc dựa selector mới.

### 2.3 `scoreCriterion` — không đổi logic clamp, chỉ giữ

Đã đúng (`Math.max(0, Math.min(value, maxScore))`, chặn `DA_CONG_BO`). Giữ nguyên. Chỉ đảm bảo audit `fieldName` format `\`${criteriaId} - ${localityId}\`` **nhất quán** với `getAuditsForLocality` (đang match `endsWith(\` - ${localityId}\`)` — OK, nhưng `scoreCriterion` hiện dùng `\`${criteria.name} - ${localityId}\``. Đổi sang `criteria.id` để ổn định + không lộ tên dài; hiển thị tên ở tầng view qua lookup).

---

## 3. Fix bug UI (B1, B2, B3, B7, B8)

| Bug | File | Thay đổi |
|---|---|---|
| B1 | `ScoreByCriteriaPage.tsx`, `ScoreByLocalityPage.tsx` | `<Badge>{record.state}</Badge>` → `<ScoreStateBadge state={record.state} />`; bỏ import `Badge` nếu thừa |
| B2 | `src/hooks/useCountdown.ts` | viết lại theo [bug-list.md#B2](bug-list.md) |
| B3 | `src/lib/utils.ts` | `daysBetween` theo mốc 00:00 + `Math.round`; nhận `number\|string\|Date` |
| B7 | `src/lib/rbac.ts` | scope check: deny khi user thiếu scope field (trừ ADMIN) |
| B8 | `src/api/client.ts` | 401 interceptor: chỉ `clearAuth()` + reject; phát `auth:logout` event; `App` lắng nghe `navigate(ROUTES.LOGIN)` |

### B8 chi tiết — `App.tsx`
```tsx
useEffect(() => {
  const onLogout = () => { queryClient.clear(); navigate(ROUTES.LOGIN, { replace: true }); };
  window.addEventListener('auth:logout', onLogout);
  return () => window.removeEventListener('auth:logout', onLogout);
}, [navigate]);
```
> Đặt trong 1 component con của `<BrowserRouter>` (vì cần `useNavigate`). Tạo `<AuthEvents />` nhỏ render `null`.

---

## 4. Dọn code chết

- `src/lib/rbac.ts` — `canAccessRoute` hiện không ai gọi. Chọn 1:
  - **(a)** Dùng nó trong `RequireRole` thay cho map lặp trong `getDefaultRoute` + prop `roles`. Nguồn route→role duy nhất.
  - **(b)** Xoá hẳn.
  - Khuyến nghị (a): xem [03-rbac.md](03-rbac.md) §3.
- `ScoreRedirect` trong `App.tsx` — giữ, nhưng đổi `criteriaTables[0]` → bảng ACTIVE đầu tiên.

---

## 5. Di chuyển kiểu dùng chung

- `ScoreRecord` → `src/types/domain.ts` (đang ở `scoreStore.ts`). `store` và `lib` cùng import từ `types`.
- Cân nhắc gom `now()`, `uid()` (đang trùng ở `scoreStore.ts` và `CriteriaFormPage.tsx`) vào `src/lib/id.ts`:
  ```ts
  export const uid = () => (crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`);
  export const nowIso = () => new Date().toISOString();
  ```
  Thay 2 bản copy.

---

## 6. Dọn route (B11, B12, B13)

`src/App.tsx` block `/thi-dua/admin` — sắp lại + bỏ route chết:
```jsx
<Route path="/thi-dua/admin" element={ /* RequireAuth > RequireRole ADMIN > AppLayout > Outlet */ }>
  <Route index element={<Navigate to={ROUTES.ADMIN_CRITERIA_LIST} replace />} />
  <Route path="bang-tieu-chi" element={<CriteriaListPage />} />
  <Route path="bang-tieu-chi/:id" element={<CriteriaFormPage />} />          {/* bắt luôn id="new" */}
  <Route path="bang-tieu-chi/:id/gan-dia-phuong" element={<AssignLocalityPage />} />
  <Route path="cau-hinh-thoi-han" element={<DeadlineConfigPage />} />
  <Route path="dia-phuong" element={<LocalityListPage />} />
  <Route path="dashboard" element={<AdminDashboardPage />} />
</Route>
```
- **B11:** xoá `<Route path="bang-tieu-chi/new">` + `ROUTES.ADMIN_CRITERIA_NEW`. `CriteriaFormPage` đã xử `id === 'new'`. Nếu `CriteriaListPage` (tạo qua Dialog) là cách chính thức → giữ vậy, route `:id` chỉ dùng cho sửa; `new` không cần. Nếu muốn có trang tạo riêng → link tới `bang-tieu-chi/new`, route `:id` bắt (`id="new"`).
- **B12:** thứ tự như trên (index đầu, tĩnh → động → lồng sâu).
- **B13 (tùy chọn):** đổi `ROUTES.ADMIN_LOCALITY` slug `dia-phuong` → `danh-muc-dia-phuong` để phân biệt với cổng địa phương `/thi-dua/dia-phuong/*`. Cập nhật `AppLayout` nav + `ROUTE_ROLES` ([03-rbac.md](03-rbac.md) §1.2).

**B14** (route Audit lệch role App.tsx vs rbac.ts) — cần chốt nghiệp vụ, xử ở [03-rbac.md](03-rbac.md) §1.2 + §3. Không làm trong Phase 1.

`ScoreRedirect` (`App.tsx`) — đổi `criteriaTables[0]` → bảng `status === 'ACTIVE'` đầu tiên (B6).

---

## Nghiệm thu Phase 1

- [ ] `src/lib/state-machine.ts`: `TRANSITIONS` đủ 7 entry; `applyTransition` pure, không import `store`.
- [ ] `scoreStore` `approve/reject/publish/submit` không còn if-else transition; tất cả gọi `runTransition` → `applyTransition`.
- [ ] Grep `next = 'CHO_DUYET` trong `scoreStore.ts` = 0 hit.
- [ ] Grep `{record.state}` trong `src/**/*.tsx` (không phải prop `state=`) = 0 hit.
- [ ] `criteriaTables[0]` chỉ còn ở `ScoreRedirect` fallback (hoặc 0 hit).
- [ ] B1–B9, B11, B12 có test regression tương ứng (xem [04-testing.md](04-testing.md) §2).
- [ ] `grep -rn "ADMIN_CRITERIA_NEW\|bang-tieu-chi/new" src` = 0 hit.
- [ ] Block route `/thi-dua/admin`: `index` ở đầu; điều hướng `/thi-dua/admin/bang-tieu-chi/new` không ra EmptyState "không tìm thấy".
- [ ] `pnpm typecheck` + `pnpm lint` sạch.
- [ ] Chạy app tay: login SPECIALIST → chấm 0 điểm mọi tiêu chí → nộp được; login BAN_LEADER → reject có lý do → về DRAFT; đi hết 4 tầng → công bố; badge hiển thị tiếng Việt.
