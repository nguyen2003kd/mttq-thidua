# Phase 4 — Test unit + component

**Thời lượng:** ~2.5 ngày. **Phụ thuộc:** Phase 1, 2, 3.
**Nâng điểm:** testing 2→10.

Stack: Vitest + @testing-library/react + @testing-library/user-event + MSW (`server.ts`). Coverage gate ở [00-foundation.md](00-foundation.md) §0.2.

Quy ước: file test cạnh file nguồn, `*.test.ts(x)`. AAA (Arrange-Act-Assert). Không test implementation detail; test hành vi quan sát được.

---

## 1. `src/lib/` — pure unit (mục tiêu ≥ 90%)

### 1.1 `state-machine.test.ts`
- **Bảng transition hợp lệ**: `it.each(TRANSITIONS)` → `getNextState(from, action) === to`, `canTransition(from, action) === true`.
- **Không hợp lệ**: mọi cặp `(state, action)` ngoài bảng → `canTransition` false, `getNextState` null. Sinh bằng tích Descartes `SCORE_STATES × ['submit','approve','reject','publish']` trừ đi `TRANSITIONS`.
- `isFinalState`: `DA_CONG_BO` → true; còn lại false.
- `isEditable`: ngược lại `isFinalState`.
- `availableActions('CHO_DUYET_BTT')` → `['publish','reject']` (thứ tự theo TRANSITIONS).
- `applyTransition`:
  - `DRAFT + submit + scoringComplete:true` → `ok`, `nextState: 'CHO_DUYET_BAN'`, `audit.action: 'SCORE'`, `audit.oldValue:'DRAFT'`, `newValue:'CHO_DUYET_BAN'`.
  - `DRAFT + submit + scoringComplete:false` → `{ ok:false, error:'INCOMPLETE_SCORING' }`.
  - `CHO_DUYET_BAN + reject` không `reason` → `{ ok:false, error:'REASON_REQUIRED' }`.
  - `CHO_DUYET_BAN + reject` có `reason` → `ok`, `nextState:'DRAFT'`, `audit.reason` giữ nguyên.
  - `DA_CONG_BO + <bất kỳ>` → `{ ok:false, error:'FINAL_STATE' }`.
  - `DRAFT + approve` → `{ ok:false, error:'INVALID_TRANSITION' }`.
  - `audit` KHÔNG chứa `id`/`timestamp` (do store gắn).
- `toLocalityStatus`:
  - `{state:'DA_CONG_BO'}` → `'published'`.
  - `{state:'CHO_DUYET_BAN'}` → `'processing'`.
  - `{state:'DRAFT', submittedAt:null}` → `'processing'`.
  - `{state:'DRAFT', submittedAt:'2026-01-01'}` → `'submitted'`.
- `isRecordComplete`:
  - table 3 tiêu chí, record 3 entry → true (kể cả value 0).
  - record 2 entry → false.
  - table 0 tiêu chí → false.

### 1.2 `rbac.test.ts` — xem §3 dưới (ma trận).

### 1.3 `utils.test.ts`
- `daysBetween` — các case ở [bug-list.md#B3](bug-list.md).
- `formatDate` / `formatDateTime` — locale `vi-VN`, chuỗi `'2026-03-09'` → `'09/03/2026'`. (Mock TZ nếu cần: set `process.env.TZ='Asia/Ho_Chi_Minh'` trong test-setup hoặc vitest env.)
- `cn('a', false && 'b', 'c')` → `'a c'`; merge tailwind `cn('p-2','p-4')` → `'p-4'`.

### 1.4 `id.test.ts` (nếu tạo `lib/id.ts`)
- `uid()` unique 1000 lần; format string.

---

## 2. Regression test cho từng bug B1–B9

Bắt buộc, 1 test/bug tối thiểu (chi tiết assertion ở [bug-list.md](bug-list.md)):

| Bug | File test | Loại |
|---|---|---|
| B1 | `ScoreByCriteriaPage.test.tsx` | component: label tiếng Việt, không enum |
| B2 | `useCountdown.test.tsx` | hook + fake timers: dep ổn định, tick đều |
| B3 | `utils.test.ts` | unit: mốc nửa đêm, năm nhuận, âm |
| B4 | `state-machine.test.ts` | unit: nhánh reject CHO_DUYET_BTT tồn tại; store dùng applyTransition |
| B5 | `scoreStore.test.ts` (hoặc `scoreService.test.ts` sau Phase 2) | submit tổng 0 nhưng đủ tiêu chí → OK; thiếu tiêu chí → no-op/409 |
| B6 | `scoreStore.test.ts` / `dashboardService.test.ts` | 2 bảng, ranking theo bảng đúng |
| B7 | `rbac.test.ts` | scope bypass bị chặn |
| B8 | `apiClient.test.ts` | 401 → clearAuth, không `window.location` |
| B9 | `state-machine.test.ts` | `toLocalityStatus` 3 nhánh |

---

## 3. Ma trận RBAC — sinh test từ [reference-rbac-matrix.md](reference-rbac-matrix.md)

`rbac.test.ts`:
```ts
import { can } from '@/lib/rbac';
import type { AuthUser, Role, ScoreState } from '@/types/rbac';

const mk = (role: Role, extra: Partial<AuthUser> = {}): AuthUser =>
  ({ id: 'u', name: 'x', role, ...extra });

describe('can() — role × action', () => {
  // Bảng CASES lấy verbatim từ reference-rbac-matrix.md §2
  it.each(CASES)('%s %s state=%s scope=%s → %s', (role, action, state, scope, expected) => {
    expect(can(mk(role, scope), action, { state, scope })).toBe(expected);
  });
});
```
Phải phủ tối thiểu:
- Mỗi `Role` × mỗi `Action` (không state) → khớp `ROLE_ACTIONS`.
- Mỗi `ScoreState` × mỗi `Action` → khớp `STATE_ACTIONS` (khi role cho phép).
- Scope: `BAN_LEADER` banId khớp/lệch/thiếu; `LOCALITY` localityId khớp/lệch/thiếu; `ADMIN` bỏ qua scope.
- `user === null` → luôn false.
- Cross-check: `can(user, action, {state})` ⟺ `ROLE_ACTIONS[role].includes(action) && STATE_ACTIONS[state].includes(action)`.

Thêm `canAccessRoute` / `rolesForPath`:
- `rolesForPath('/thi-dua/admin/bang-tieu-chi')` → `['ADMIN']` (prefix match).
- `rolesForPath('/thi-dua/duyet/lanh-dao-ban/ban1')` → `['BAN_LEADER']` (không nhầm sang `/thi-dua/duyet/hoi-dong-tdkt`).
- `rolesForPath('/khong-ton-tai')` → `null`.
- `defaultRouteForRole` mỗi role → route đúng.

---

## 4. Service + MSW handler test (mục tiêu ≥ 90% `src/services`)

`src/services/*.test.ts` — chạy với `server.ts` (MSW), `resetDb()` ở `afterEach`. Set token hợp lệ vào `authStore` trước mỗi test (helper `loginAs(role)`).

### `scoreService.test.ts`
- `get(tableId, localityId)` → trả record khớp seed.
- `scoreCriterion` value vượt max → server clamp → record.entries[x].value === maxScore.
- `scoreCriterion` khi state `DA_CONG_BO` → reject 409 `FINAL_STATE`.
- `transition('submit')` khi chưa đủ tiêu chí → 409 `INCOMPLETE_SCORING`.
- `transition('submit')` đủ tiêu chí → record.state `CHO_DUYET_BAN`, có audit mới.
- `transition('approve')` role SPECIALIST → 403 `FORBIDDEN`.
- `transition('approve')` role BAN_LEADER đúng ban → `CHO_DUYET_HOI_DONG`.
- `transition('reject')` không reason → 409 `REASON_REQUIRED`.
- `transition('publish')` từ `CHO_DUYET_HOI_DONG` (sai bước) → 409 `INVALID_TRANSITION`.
- luồng đầy đủ: submit→approve→approve→publish → `DA_CONG_BO`, `publishedAt` set, 4 audit.

### `criteriaService.test.ts`
- create → GET list chứa bảng mới; `totalScore` = tổng maxScore.
- update criteria → assignments giữ nguyên.
- delete → scores + assignments của bảng đó biến mất.
- `setAssignments` → `assignedLocalityCount` cập nhật.

### `scopeGuard.test.ts` (MSW — B14 cô lập địa phương)
- `loginAs('LOCALITY', { localityId: 'dp1' })`:
  - `scoreService.get(tableId, 'dp2')` → 403 `FORBIDDEN`.
  - `evidenceService.list({ tableId, localityId: 'dp2' })` → 403.
  - `evidenceService.list({ tableId, localityId: 'dp1' })` → 200.
  - `evidenceService.list({ tableId })` (không localityId) → server ép filter về `dp1`, không lộ địa phương khác.
  - `auditService.list({ localityId: 'dp1' })` → 403 (LOCALITY không xem audit).
- `loginAs('SPECIALIST')`: `auditService.list(...)` → 200.
- `loginAs('LOCALITY')` không `localityId` → mọi query cổng địa phương ném lỗi có kiểm soát (hook `useMyLocalityId` throw) → boundary hiển thị EmptyState, không crash trắng.

### `authService.test.ts`
- `login` username rỗng → 400.
- `login` OK → token giải mã ra đúng role/scope; `expiresAt` ~ now+30′.
- `refresh` → token mới, `expiresAt` mới.
- request không `Authorization` tới endpoint bảo vệ → 401.
- token hết hạn (seed `exp` quá khứ) → 401.

### `apiClient.test.ts`
- 401 từ server → `authStore.token === null`, `dispatchEvent` `auth:logout` gọi (spy), `window.location.href` KHÔNG đổi (spy/getter).
- request khi `expiresAt` sắp hết → interceptor gọi `/auth/refresh` một lần (đếm request).

---

## 5. Component test (React Testing Library + MSW)

Helper `renderApp(ui, { route, role })`: bọc `QueryClientProvider` (client mới mỗi test, `retry:false`), `MemoryRouter` với `initialEntries=[route]`, set `authStore` qua `loginAs(role)`.

### `ScoreByCriteriaPage.test.tsx`
- render bảng, chấm 3 ô = `0` → nút "Nộp" **hiện** (B5) → click → toast "Đã nộp", record chuyển `CHO_DUYET_BAN` (mock server), hàng hiện badge "Chờ duyệt Ban" (B1).
- chấm 2/3 ô → nút "Nộp" ẩn/disabled.
- role không phải SPECIALIST vào route → redirect (RequireRole) — test ở `guards.test.tsx`.
- ô nhập disabled khi record state ≠ DRAFT.

### `ApprovalPage` (dùng `BanLeaderApprovalPage.test.tsx`)
- seed 1 record `CHO_DUYET_BAN` → hiện 1 hàng.
- click "Duyệt" → mutation → hàng biến mất (state đổi), toast.
- click "Trả lại" → dialog; submit không lý do → nút disabled; nhập lý do → gọi reject → toast.
- role BAN_LEADER ban khác (`banId:'ban2'`) → nút Duyệt disabled (B7 + Phase 3).
- "Lịch sử" mở dialog `AuditTimeline` có entry.

### `CouncilApprovalPage.test.tsx`
- role `COUNCIL_VICE` → nút "Duyệt" disabled (chỉ `requireChair`/CHAIR); "Trả lại" vẫn được (theo `ROLE_ACTIONS.COUNCIL_VICE` = `['view']` → thực ra cả reject cũng bị chặn → assert theo matrix, cập nhật nếu nghiệp vụ khác).

### `StandingCommitteePage.test.tsx`
- "Công bố" mở `ConfirmDialog` keyword → nhập sai `CÔNG BỐ` → nút disabled; nhập đúng → `publish` gọi → toast "Đã công bố", record `DA_CONG_BO`.

### `CriteriaFormPage.test.tsx`
- submit trống → toast lỗi validate, không gọi create.
- điền hợp lệ + 2 tiêu chí → create gọi với `totalScore` = tổng, điều hướng về list.
- xoá tiêu chí cuối → nút xoá disabled khi còn 1.

### `guards.test.tsx`
- `RequireAuth`: không token → redirect `/login`, giữ `state.from`.
- `RequireAuth`: token hết hạn → redirect `/login`.
- `RequireRole`: role sai → redirect `defaultRouteForRole(role)`.
- `RequireRole`: role đúng → render children.
- `LOCALITY` vào `/thi-dua/lich-su-thay-doi/...` → redirect `/thi-dua/dia-phuong/trang-thai` (B14).
- `LOCALITY` vào `/thi-dua/admin/...` hoặc route duyệt → redirect cổng địa phương.
- `SPECIALIST` vào `/thi-dua/admin/bang-tieu-chi/new` → render form tạo (không EmptyState "không tìm thấy") — B11; nếu route `new` đã xoá thì → redirect dashboard.

### `Button.test.tsx` (core)
- `action='approve' state='DRAFT'` + role BAN_LEADER → `disabled`, có `title`.
- `action='approve' state='CHO_DUYET_BAN'` + role BAN_LEADER ban khớp → enabled.
- `hideWhenDenied` → không render.
- không `action` → render bình thường.

### `Can.test.tsx`
- cho phép → render children; từ chối → render `fallback`.

### `useCountdown.test.tsx` — B2 (fake timers).

### `DataTable.test.tsx` (nhẹ)
- render rows, sort cột, phân trang, search debounce (advance timers 250ms), empty state.
- `loading` → skeleton.

---

## 6. Không cần test
- `src/components/ui/**` (wrapper shadcn) — test gián tiếp qua component test.
- `src/data/vn-*.ts` — dữ liệu tĩnh.
- `src/main.tsx`.

---

## Nghiệm thu Phase 4

- [ ] `pnpm test:cov` pass, ngưỡng: `src/lib` ≥ 90/85/90/90, `src/store` ≥ 90/80, `src/services` ≥ 90/80, global ≥ 75/70.
- [ ] Mỗi bug B1–B9 có ≥ 1 test đỏ-trước-xanh-sau (ghi commit "test: B_ regression" trước "fix:").
- [ ] Ma trận RBAC: mọi ô trong [reference-rbac-matrix.md](reference-rbac-matrix.md) có case.
- [ ] Luồng duyệt 4 tầng có test service end-to-end (§4).
- [ ] `pnpm test` chạy < 60s trên CI.
- [ ] 0 test `.skip` / `.only` còn lại.
