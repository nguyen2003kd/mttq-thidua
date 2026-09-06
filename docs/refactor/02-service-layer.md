# Phase 2 — Service layer + React Query + MSW

**Thời lượng:** ~2 ngày. **Phụ thuộc:** Phase 1.
**Nâng điểm:** data layer 3→10. Kết quả: FE nói chuyện với HTTP thật; MSW đóng vai BE; đổi sang BE thật = thay `src/mocks`, không đụng UI.

---

## Kiến trúc đích

```
Component
  └─ hook React Query  (src/api/hooks/*.ts)      ← useQuery / useMutation, cache, invalidation
       └─ service        (src/services/*.ts)      ← hàm thuần gọi apiClient, trả DTO typed, validate Zod
            └─ apiClient  (src/api/client.ts)     ← axios + interceptor auth
                 └─ HTTP
                      └─ MSW handlers (src/mocks/handlers/*)   ← DEV + TEST; enforce state-machine + RBAC
                           └─ in-memory db (src/mocks/db.ts) ← seed từ src/mocks/seed.ts
```

`scoreStore` **không còn** giữ dữ liệu nghiệp vụ. Chỉ còn: draft điểm chưa lưu (optional), filter UI, sidebar. `authStore` giữ (token + user), nhưng token/refresh đi qua `authService`.

---

## 1. Hợp đồng API (REST)

Base URL: `import.meta.env.VITE_API_BASE_URL` (mặc định `/api`). Tất cả trả JSON. Lỗi: `{ error: { code: string, message: string } }` + HTTP status.

| Method | Path | Mô tả | Body / Query | Response |
|---|---|---|---|---|
| POST | `/auth/login` | đăng nhập | `{ username, password, role? }` (role chỉ cho demo) | `{ user: AuthUser, token, refreshToken, expiresAt }` |
| POST | `/auth/refresh` | làm mới token | `{ refreshToken }` | `{ token, refreshToken, expiresAt }` |
| POST | `/auth/logout` | huỷ phiên | — | `204` |
| GET | `/criteria-tables` | danh sách bảng tiêu chí | `?status=ACTIVE` | `CriteriaTable[]` |
| GET | `/criteria-tables/:id` | chi tiết | — | `CriteriaTable` |
| POST | `/criteria-tables` | tạo | `CriteriaTableCreateDTO` | `CriteriaTable` `201` |
| PUT | `/criteria-tables/:id` | sửa | `CriteriaTable` | `CriteriaTable` |
| DELETE | `/criteria-tables/:id` | xoá | — | `204` |
| GET | `/criteria-tables/:id/assignments` | địa phương đã gán | — | `{ localityIds: string[] }` |
| PUT | `/criteria-tables/:id/assignments` | set gán | `{ localityIds: string[] }` | `{ localityIds: string[] }` |
| GET | `/localities` | danh sách địa phương | `?q=&region=` | `Locality[]` |
| POST/PUT/DELETE | `/localities/:id?` | CRUD | `Locality` | `Locality` / `204` |
| GET | `/scores` | bảng điểm | `?tableId=&localityId=` | `LocalityScoreResponse[]` |
| GET | `/scores/:tableId/:localityId` | 1 record | — | `ScoreRecord` |
| PUT | `/scores/:tableId/:localityId/criteria/:criteriaId` | chấm 1 tiêu chí | `{ value: number }` | `ScoreRecord` |
| POST | `/scores/:tableId/:localityId/transition` | submit/approve/reject/publish | `{ action: WorkflowAction, reason?: string }` | `ScoreRecord` hoặc `409 { error }` |
| GET | `/evidence` | minh chứng | `?tableId=&localityId=&criteriaId=` | `Evidence[]` |
| POST | `/evidence` | thêm | `{ criteriaId, localityId, fileName, fileUrl }` | `Evidence` `201` |
| DELETE | `/evidence/:id` | xoá | — | `204` |
| GET | `/audits` | nhật ký | `?localityId=&tableId=` | `AuditEntry[]` |
| GET | `/config/deadline` | hạn chót | — | `{ deadline: string }` |
| PUT | `/config/deadline` | set hạn | `{ deadline: string }` | `{ deadline: string }` |
| GET | `/dashboard/overview` | số liệu tổng quan | `?tableId=` | `{ ranking, statusCounts, daysLeft }` |

> **MSW handler PHẢI enforce**: RBAC (`can()` với user từ token) → `403`; state-machine (`applyTransition`) → `409` khi `!ok`. Đây là "server-side enforcement" thực tế tới khi có BE.

---

## 2. `src/services/` — modules

Mỗi file: hàm async, gọi `apiClient`, parse response bằng Zod schema (đặt cạnh, `*.schema.ts` hoặc trong `src/types/dto.ts`), trả kiểu domain.

```
src/services/
  authService.ts        login, refresh, logout
  criteriaService.ts    list, get, create, update, remove, getAssignments, setAssignments
  localityService.ts    list, get, create, update, remove
  scoreService.ts       list, get, scoreCriterion, transition
  evidenceService.ts    list, create, remove
  auditService.ts       list
  configService.ts      getDeadline, setDeadline
  dashboardService.ts   getOverview
  http.ts               (optional) unwrap + error normalize helper
```

Mẫu `scoreService.ts`:
```ts
import { apiClient } from '@/api/client';
import type { WorkflowAction } from '@/lib/state-machine';
import { scoreRecordSchema, type ScoreRecordDTO } from '@/types/dto';

export const scoreService = {
  async get(tableId: string, localityId: string): Promise<ScoreRecordDTO> {
    const { data } = await apiClient.get(`/scores/${tableId}/${localityId}`);
    return scoreRecordSchema.parse(data);
  },
  async scoreCriterion(tableId: string, localityId: string, criteriaId: string, value: number) {
    const { data } = await apiClient.put(
      `/scores/${tableId}/${localityId}/criteria/${criteriaId}`, { value },
    );
    return scoreRecordSchema.parse(data);
  },
  async transition(tableId: string, localityId: string, action: WorkflowAction, reason?: string) {
    const { data } = await apiClient.post(
      `/scores/${tableId}/${localityId}/transition`, { action, reason },
    );
    return scoreRecordSchema.parse(data);
  },
};
```

**Zod schemas** (`src/types/dto.ts`): 1 schema / entity, `z.infer` ra type. Domain types hiện ở `src/types/domain.ts` giữ làm nguồn; DTO schema phải khớp. Có thể `satisfies` để check lệch lúc compile.

---

## 3. `src/api/` — React Query

```
src/api/
  client.ts        (đã có — sửa interceptor 401 theo B8)
  queryClient.ts   (chuyển QueryClient config từ App.tsx ra đây)
  queryKeys.ts     factory key
  hooks/
    useAuth.ts            useLoginMutation, useLogoutMutation
    useCriteriaTables.ts  list/detail/create/update/delete/assignments
    useLocalities.ts
    useScores.ts          useScores, useScoreRecord, useScoreCriterionMutation, useTransitionMutation
    useEvidence.ts
    useAudits.ts
    useDeadline.ts
    useDashboard.ts
```

`queryKeys.ts`:
```ts
export const qk = {
  criteriaTables: (params?: { status?: string }) => ['criteria-tables', params ?? {}] as const,
  criteriaTable: (id: string) => ['criteria-tables', id] as const,
  assignments: (tableId: string) => ['criteria-tables', tableId, 'assignments'] as const,
  localities: (params?: object) => ['localities', params ?? {}] as const,
  scores: (params: { tableId?: string; localityId?: string }) => ['scores', params] as const,
  scoreRecord: (tableId: string, localityId: string) => ['scores', tableId, localityId] as const,
  evidence: (params: object) => ['evidence', params] as const,
  audits: (params: object) => ['audits', params] as const,
  deadline: () => ['config', 'deadline'] as const,
  dashboard: (tableId?: string) => ['dashboard', 'overview', tableId ?? null] as const,
};
```

Mẫu mutation với invalidation + optimistic:
```ts
export function useTransitionMutation(tableId: string, localityId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { action: WorkflowAction; reason?: string }) =>
      scoreService.transition(tableId, localityId, v.action, v.reason),
    onSuccess: (record) => {
      qc.setQueryData(qk.scoreRecord(tableId, localityId), record);
      qc.invalidateQueries({ queryKey: ['scores'] });
      qc.invalidateQueries({ queryKey: ['audits'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (e) => toast.error(mapApiError(e)), // 409 → "Không thể chuyển trạng thái ở bước này"
  });
}
```

`mapApiError(e)`: đọc `e.response?.data?.error?.code` → message tiếng Việt. Bảng code:
`INVALID_TRANSITION`, `REASON_REQUIRED`, `INCOMPLETE_SCORING`, `FORBIDDEN`, `NOT_FOUND`, `FINAL_STATE`.

---

## 4. MSW — mock backend

```
src/mocks/
  db.ts        in-memory state + CRUD thuần (không HTTP)
  seed.ts      dữ liệu khởi tạo (chuyển từ scoreStore.ts: initialTables/localities/scores/evidence/audits)
  auth.ts      giải mã "token" giả → AuthUser (token = base64(JSON) hoặc map tĩnh)
  handlers/
    auth.ts
    criteria.ts
    localities.ts
    scores.ts
    evidence.ts
    audits.ts
    config.ts
    dashboard.ts
    index.ts   gộp export `handlers`
  browser.ts   setupWorker(...handlers)  — dev
  server.ts    setupServer(...handlers)  — test
```

### 4.1 `db.ts`
- Object module-level `{ criteriaTables, localities, assignments, scores, evidence, audits, deadline }`.
- Hàm `resetDb()` gọi lại `seed()` — dùng ở `afterEach` test.
- `scores`: `Record<tableId, Record<localityId, ScoreRecord>>` (giữ cấu trúc cũ).

### 4.2 `handlers/scores.ts` — enforce logic
```ts
import { http, HttpResponse } from 'msw';
import { db } from '../db';
import { getUserFromRequest } from '../auth';
import { can } from '@/lib/rbac';
import { applyTransition, isRecordComplete } from '@/lib/state-machine';

export const scoreHandlers = [
  http.put('*/scores/:tableId/:localityId/criteria/:criteriaId', async ({ request, params }) => {
    const user = getUserFromRequest(request);
    if (!user) return HttpResponse.json({ error: { code: 'UNAUTHENTICATED', message: '' } }, { status: 401 });

    const { tableId, localityId, criteriaId } = params as Record<string, string>;
    const table = db.criteriaTables.find((t) => t.id === tableId);
    if (!table) return err('NOT_FOUND', 404);
    const record = db.scores[tableId]?.[localityId] ?? emptyRecord();

    if (!can(user, 'edit', { state: record.state, scope: { localityId } }))
      return err('FORBIDDEN', 403);
    if (record.state === 'DA_CONG_BO') return err('FINAL_STATE', 409);

    const { value } = await request.json() as { value: number };
    // clamp + upsert entry + recompute totalScore + audit (logic giống scoreStore.scoreCriterion cũ)
    const updated = writeCriterion(db, table, record, localityId, criteriaId, value, user);
    return HttpResponse.json(updated);
  }),

  http.post('*/scores/:tableId/:localityId/transition', async ({ request, params }) => {
    const user = getUserFromRequest(request);
    if (!user) return err('UNAUTHENTICATED', 401);
    const { tableId, localityId } = params as Record<string, string>;
    const table = db.criteriaTables.find((t) => t.id === tableId);
    if (!table) return err('NOT_FOUND', 404);
    const record = db.scores[tableId]?.[localityId] ?? emptyRecord();
    const { action, reason } = await request.json() as { action: WorkflowAction; reason?: string };

    // RBAC: map action → rbac Action
    const rbacAction = ({ submit: 'submit', approve: 'approve', reject: 'reject', publish: 'publish' } as const)[action];
    const scope = action === 'submit' ? { localityId } : user.banId ? { banId: user.banId } : undefined;
    if (!can(user, rbacAction, { state: record.state, scope })) return err('FORBIDDEN', 403);

    const res = applyTransition({
      from: record.state, action, actor: { name: user.name, role: user.role },
      localityId, reason, scoringComplete: action === 'submit' ? isRecordComplete(table, record) : undefined,
    });
    if (!res.ok) return err(res.error, 409);

    const updated = commitTransition(db, tableId, localityId, record, res, user);
    return HttpResponse.json(updated);
  }),
];
```
> `err(code, status)` helper trả `HttpResponse.json({ error: { code, message: MSG[code] } }, { status })`.

### 4.3 `auth.ts` (mock)
- `login`: chấp nhận mọi username/password không rỗng; `role` từ body (giữ demo role selector). Token = `btoa(JSON.stringify({ id, name, role, banId, localityId, exp }))`. `expiresAt` = now + 30 phút.
- `getUserFromRequest(request)`: đọc `Authorization: Bearer <token>`, `atob` + `JSON.parse`, check `exp > Date.now()` → trả `AuthUser | null`.
- `refresh`: cấp token mới +30 phút.

### 4.4 Bật/tắt
`src/main.tsx`:
```tsx
async function enableMocking() {
  if (import.meta.env.VITE_ENABLE_MOCK !== 'true') return;
  const { worker } = await import('./mocks/browser');
  await worker.start({ onUnhandledRequest: 'bypass' });
}
enableMocking().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
});
```
- `.env.development` → `VITE_ENABLE_MOCK=true`, `VITE_API_BASE_URL=/api`.
- `.env.production` → `VITE_ENABLE_MOCK=false` (khi có BE, set `VITE_API_BASE_URL` thật).
- `public/mockServiceWorker.js`: chạy `pnpm exec msw init public/` một lần, commit file.
- `src/test-setup.ts`: bỏ comment block `server.listen/resetHandlers/close`; thêm `afterEach(resetDb)`.

---

## 5. Chuyển components từ store → hooks

Thứ tự (mỗi cái 1 commit nhỏ, test kèm):

1. **Auth**: `LoginPage` dùng `useLoginMutation` (bỏ `setTimeout` giả). `authStore.setAuth` nhận thêm `expiresAt`. `AppLayout` logout dùng `useLogoutMutation`.
2. **Criteria**: `CriteriaListPage`, `CriteriaFormPage`, `AssignLocalityPage` → `useCriteriaTables*`. Bỏ `createCriteriaTable`/`updateCriteriaTable`/`assignLocality` khỏi store.
3. **Localities**: `LocalityListPage` → `useLocalities*`.
4. **Scores**: `ScoreByCriteriaPage`, `ScoreByLocalityPage` → `useScoreRecord` + `useScoreCriterionMutation` + `useTransitionMutation`. Bỏ `scoreCriterion`/`submit` khỏi store.
5. **Duyệt**: `ApprovalPage`, `StandingCommitteePage` → `useScores({ tableId })` lọc theo `targetState` + `useTransitionMutation`. Bỏ `approve`/`reject`/`publish` khỏi store.
6. **Địa phương**: `MinhChungPage` → `useEvidence*`; `TrangThaiPage`, `KetQuaPage` → `useScoreRecord`/`useDashboard`/`useAudits`.
7. **Dashboard**: `OverviewDashboardPage`, `AdminDashboardPage`, `DashboardContent` → `useDashboard`.
8. **Audit**: `AuditLogPage` → `useAudits`.
9. **Deadline**: `DeadlineConfigPage`, `CountdownBanner` → `useDeadline`.

Mọi trang: thêm trạng thái `isLoading` → skeleton (`DataTable loading` prop đã hỗ trợ; trang không dùng DataTable thì `<Skeleton />`), `isError` → `<EmptyState>` lỗi + nút "Thử lại" (`refetch`).

### 5.1 `scoreStore` sau khi xong
Còn lại:
```ts
interface ScoreUiStore {
  // draft điểm gõ dở chưa lưu, keyed tableId:localityId:criteriaId → number
  drafts: Record<string, number>;
  setDraft: (key: string, v: number) => void;
  clearDrafts: (prefix: string) => void;
}
```
Hoặc bỏ hẳn nếu chấp nhận mỗi lần blur input là 1 request (mutation debounced). Khuyến nghị: debounce 400ms trong `useScoreCriterionMutation` wrapper, bỏ `drafts`.

`persist` — bỏ khỏi `scoreStore`. `authStore` giữ `persist` (name `thidua-auth`).

---

## 6. `App.tsx`
- `QueryClient` chuyển ra `src/api/queryClient.ts`.
- Thêm `<ReactQueryDevtools />` (chỉ dev).
- `<AuthEvents />` cho `auth:logout` (B8).

---

## Nghiệm thu Phase 2

- [ ] `grep -rn "useScoreStore" src/features src/components` → chỉ còn (nếu giữ) draft UI; **0 hit** cho dữ liệu nghiệp vụ.
- [ ] `apiClient` được import ở mọi `src/services/*.ts`; services được gọi qua `src/api/hooks/*`.
- [ ] `pnpm dev` với `VITE_ENABLE_MOCK=true`: mọi trang load qua Network tab thấy request `/api/...` (200/403/409), không còn đọc localStorage nghiệp vụ.
- [ ] Tắt mock (`VITE_ENABLE_MOCK=false`, không có BE) → app hiện lỗi tải dữ liệu gọn gàng (không crash trắng trang).
- [ ] MSW handler enforce: gọi transition sai bước → 409; sai quyền → 403 (test ở [04-testing.md](04-testing.md) §4).
- [ ] `src/mocks/seed.ts` chứa toàn bộ fixture; `scoreStore.ts` không còn `initialTables/initialScores/...`.
- [ ] Coverage `src/services/**` ≥ 90%.
- [ ] `pnpm build` pass; bundle không tăng bất thường (react-query đã có sẵn trong deps).
