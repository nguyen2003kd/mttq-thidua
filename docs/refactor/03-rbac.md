# Phase 3 — RBAC enforce đầy đủ

**Thời lượng:** ~1 ngày. **Phụ thuộc:** Phase 1. Chạy song song được với Phase 4.
**Nâng điểm:** bảo mật 4→9 (trần của client-only; 10 chỉ đạt khi BE thật enforce).

Hiện trạng: `Button` core (`src/components/core/Button.tsx`) và `<Can>` (`src/components/shared/Can.tsx`) đã gọi `useCan()`; nhiều nút đã truyền `action`/`state`. Thiếu: nhất quán, scope, token expiry, disable-vs-hide, và enforce ở tầng service/MSW (Phase 2 đã làm ở MSW).

---

## 1. `src/lib/rbac.ts` — hoàn thiện

### 1.1 Fix scope bypass (B7) — xem [bug-list.md#B7](bug-list.md)
```ts
if (context?.scope && user.role !== 'ADMIN') {
  if (context.scope.banId !== undefined &&
      (user.banId === undefined || user.banId !== context.scope.banId)) return false;
  if (context.scope.localityId !== undefined &&
      (user.localityId === undefined || user.localityId !== context.scope.localityId)) return false;
}
```

### 1.2 `canAccessRoute` thành nguồn route→role duy nhất
Giữ map `routeRoleMap`, export thêm:
```ts
export const ROUTE_ROLES: Record<string, Role[]> = { /* như routeRoleMap hiện tại, thêm cham-diem & duyet đủ */
  '/thi-dua/admin': ['ADMIN'],
  '/thi-dua/dia-phuong': ['LOCALITY'],
  '/thi-dua/cham-diem': ['SPECIALIST'],
  '/thi-dua/duyet/lanh-dao-ban': ['BAN_LEADER'],
  '/thi-dua/duyet/hoi-dong-tdkt': ['COUNCIL_CHAIR', 'COUNCIL_VICE'],
  '/thi-dua/duyet/ban-thuong-truc': ['STANDING_COMMITTEE'],
  '/thi-dua/dashboard-tong-quan': ['ADMIN','SPECIALIST','BAN_LEADER','COUNCIL_CHAIR','COUNCIL_VICE','STANDING_COMMITTEE'],
  '/thi-dua/lich-su-thay-doi': ['ADMIN','SPECIALIST','BAN_LEADER','COUNCIL_CHAIR','COUNCIL_VICE','STANDING_COMMITTEE','LOCALITY'],
};
export function rolesForPath(pathname: string): Role[] | null {
  const hit = Object.entries(ROUTE_ROLES)
    .filter(([p]) => pathname.startsWith(p))
    .sort((a, b) => b[0].length - a[0].length)[0]; // prefix dài nhất thắng
  return hit ? hit[1] : null;
}
```

### 1.3 `defaultRouteForRole(role)` — chuyển từ `RequireRole.getDefaultRoute` vào `rbac.ts`
Một nơi. `RequireRole` và `LoginPage` cùng import (LoginPage hiện tự tính lại — B: trùng logic).

---

## 2. Enforce ở UI — quy tắc

### 2.1 Nút hành động: **disable + tooltip**, không ẩn
`Button` core hiện ẩn (`return fallback ?? null`) khi thiếu quyền. Đổi hành vi:
```tsx
export function Button({ action, state, scope, fallback, hideWhenDenied = false, disabled, ...props }: ButtonProps) {
  const can = useCan();
  const denied = !!action && !can(action, { state, scope });
  if (denied && hideWhenDenied) return fallback ? <>{fallback}</> : null;
  return (
    <BaseButton
      {...props}
      disabled={disabled || denied}
      title={denied ? 'Bạn không có quyền thực hiện thao tác này ở bước hiện tại' : props.title}
      aria-disabled={disabled || denied || undefined}
    />
  );
}
```
- Mặc định: disable (người dùng thấy nút, hiểu vì sao mờ).
- `hideWhenDenied` cho chỗ cần ẩn hẳn (vd nav item, nút "Tạo bảng" với role không phải ADMIN).
- Cập nhật callers: nav/menu dùng `hideWhenDenied`; nút trong bảng/dialog để mặc định.

### 2.2 Mọi mutation phải qua gate
Rà từng `onClick` gọi service/mutation. Bọc điều kiện `can(...)` hoặc để `<Button action= state= scope=>` lo. Danh sách điểm cần kiểm:

| File | Hành động | `action` | `state` (từ record) | `scope` |
|---|---|---|---|---|
| `ScoreByCriteriaPage` / `ScoreByLocalityPage` | ô nhập điểm | `edit` | `record.state` | `{ localityId }` |
| ″ | nút Nộp | `submit` | `DRAFT` | `{ localityId }` |
| `ApprovalPage` (BanLeader) | Duyệt | `approve` | `CHO_DUYET_BAN` | `{ banId }` |
| ″ | Trả lại | `reject` | `CHO_DUYET_BAN` | `{ banId }` |
| `ApprovalPage` (Council) | Duyệt | `approve` | `CHO_DUYET_HOI_DONG` | — (chỉ CHAIR: `requireChair`) |
| `StandingCommitteePage` | Công bố | `publish` | `CHO_DUYET_BTT` | — |
| ″ | Trả lại | `reject` | `CHO_DUYET_BTT` | — |
| `CriteriaListPage` | Tạo / Sửa / Xoá / Gán | `create`/`edit`/`delete`/`assign` | — | — |
| `CriteriaFormPage` | Lưu | `create` hoặc `edit` | — | — |
| `LocalityListPage` | CRUD địa phương | tương ứng | — | — |
| `MinhChungPage` | Nộp/Xoá minh chứng | `create` / `delete` | `record.state` (chỉ khi editable) | `{ localityId }` |
| `DeadlineConfigPage` | Lưu hạn | `edit` | — | — |

> `ScoreInput` (ô nhập) cần prop `disabled` được set từ `!can('edit', { state, scope })` **ngoài** điều kiện `editable` hiện tại (`state === 'DRAFT'`). Thêm ở `ScoreRow`.

### 2.3 `<Can>` cho khối lớn (section/tab/card)
Dùng `<Can action= state= scope= fallback={<EmptyState .../>}>` để bọc panel toàn trang khi cần (vd tab "Chấm điểm" của SPECIALIST). Không lạm dụng cho từng nút — nút đã tự gate.

---

## 3. `RequireRole` / `RequireAuth` — dùng nguồn chung

`RequireRole.tsx`:
```tsx
import { rolesForPath, defaultRouteForRole } from '@/lib/rbac';

export function RequireRole({ roles, children }: RequireRoleProps) {
  const user = useAuthStore((s) => s.user);
  const location = useLocation();
  if (!user) return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;

  // roles truyền vào PHẢI khớp rolesForPath(location.pathname) — assert khi dev
  if (import.meta.env.DEV) {
    const expected = rolesForPath(location.pathname);
    if (expected && expected.join() !== [...roles].sort().join())
      console.warn('[RequireRole] roles prop lệch ROUTE_ROLES cho', location.pathname);
  }

  if (!roles.includes(user.role)) return <Navigate to={defaultRouteForRole(user.role)} replace />;
  return <>{children}</>;
}
```
> Hoặc bỏ prop `roles`, tự lấy từ `rolesForPath` — gọn hơn, ít lệch. Cân nhắc; nếu làm thì cập nhật `App.tsx` bỏ `roles={[...]}`.

---

## 4. Token expiry + refresh

### 4.1 `authStore` mở rộng
```ts
interface AuthState {
  user: AuthUser | null;
  token: string | null;
  refreshToken: string | null;
  expiresAt: number | null;          // epoch ms
  setAuth: (u: AuthUser, t: string, rt: string, expiresAt: number) => void;
  clearAuth: () => void;
  isAuthenticated: () => boolean;    // token != null && expiresAt > Date.now()
}
```
`isAuthenticated`: `return !!get().token && (get().expiresAt ?? 0) > Date.now();`

### 4.2 `apiClient` — refresh flow
Interceptor request: nếu `expiresAt - Date.now() < 60_000` và có `refreshToken` → gọi `authService.refresh` (một lần, dùng cờ chống gọi song song), cập nhật store, gắn token mới.
Interceptor response 401: `clearAuth()` + `window.dispatchEvent(new Event('auth:logout'))` + reject (B8). **Không** `window.location`.

### 4.3 `RequireAuth` — check expiry
```tsx
const ok = useAuthStore((s) => s.isAuthenticated());
if (!ok) return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
```
Thêm: interval trong `<AuthEvents />` mỗi 30s kiểm `isAuthenticated()` → nếu hết hạn, `clearAuth()` + điều hướng.

### 4.4 Lưu ý client-only
- Token vẫn ở `localStorage` (`persist`) — chấp nhận vì chưa có BE + httpOnly cookie. Ghi rõ trong ADR: khi có BE, chuyển sang httpOnly cookie + CSRF, bỏ `persist` token.
- KHÔNG log token. KHÔNG đưa token vào URL/query.

---

## 5. Bảng ma trận RBAC — xem [reference-rbac-matrix.md](reference-rbac-matrix.md)
Cập nhật file đó nếu logic đổi. Test Phase 4 §3 sinh từ bảng này.

---

## 6. Scope địa phương — cô lập dữ liệu (B14 đã chốt)

**Quy tắc nghiệp vụ:**
- `LOCALITY` **không** xem lịch sử thay đổi (`/thi-dua/lich-su-thay-doi`) — đã bỏ khỏi `ROUTE_ROLES` (§1.2) và `App.tsx` giữ `INTERNAL_ROLES`.
- `LOCALITY` **không** xem dữ liệu của địa phương khác ở bất kỳ trang nào.

**Enforce — 3 tầng:**

### 6.1 Route: bỏ param địa phương ở cổng LOCALITY
`/thi-dua/dia-phuong/*` (`TrangThaiPage`, `MinhChungPage`, `KetQuaPage`) — **không** route nào nhận `:localityId`. Các trang này lấy địa phương từ `useAuthStore(s => s.user?.localityId)`, không từ `useParams`.
- `KetQuaPage` route hiện `/thi-dua/dia-phuong/ket-qua/:nam` — chỉ `:nam`, OK. Giữ vậy.
- Nếu bất kỳ trang cổng nào đang đọc `localityId` từ URL → sửa: đọc từ `user.localityId`. Nếu `user.localityId` rỗng → `<EmptyState>` "Tài khoản chưa gắn địa phương".
- `LocalityLayout` (`src/components/layout/LocalityLayout.tsx`) — nav KHÔNG có mục "Lịch sử thay đổi" / audit. Xác nhận; xoá nếu có. `AppLayout` audit nav giữ nguyên (chỉ role nội bộ render `AppLayout`).

### 6.2 Hook/query: khoá `localityId` theo user
Wrapper hook cho cổng LOCALITY luôn truyền `user.localityId`:
```ts
export function useMyLocalityId(): string {
  const id = useAuthStore((s) => s.user?.localityId);
  if (!id) throw new Error('Tài khoản LOCALITY thiếu localityId');
  return id;
}
// dùng:
const localityId = useMyLocalityId();
const { data } = useScoreRecord(activeTableId, localityId);
const { data: evidence } = useEvidence({ tableId, localityId });
```
Component cổng LOCALITY **không** được nhận `localityId` qua props từ ngoài.

### 6.3 MSW handler: enforce server-side (nguồn thật tới khi có BE)
Trong `src/mocks/handlers/*` — với mọi request đọc/ghi có `localityId` (query hoặc path), nếu `user.role === 'LOCALITY'`:
```ts
const requested = url.searchParams.get('localityId') ?? params.localityId;
if (user.role === 'LOCALITY' && requested && requested !== user.localityId) {
  return err('FORBIDDEN', 403);
}
// nếu LOCALITY gọi list không kèm localityId → ép filter về user.localityId (không trả toàn bộ)
```
Áp cho: `/scores`, `/scores/:tableId/:localityId(/**)`, `/evidence`, `/audits`, `/dashboard/overview` (LOCALITY không có route dashboard nên chỉ chặn), `/localities/:id` (LOCALITY chỉ GET chính mình).
`/audits` — `LOCALITY` gọi bất kỳ → `403` (role không có quyền `view` audit theo quyết định; đơn giản nhất: check `can(user, 'view')` + role ≠ LOCALITY cho audit endpoint).

### 6.4 `can()` cho evidence (nộp/xoá minh chứng)
`MinhChungPage` (role LOCALITY): `create`/`delete` evidence với `scope: { localityId: user.localityId }` + `state: record.state` (chỉ khi `isEditable(state)` — không sửa minh chứng sau công bố). MSW enforce scope luôn.

---

## Nghiệm thu Phase 3

- [ ] `rbac.test.ts` phủ B7 (scope bypass) + toàn ma trận (xem [04-testing.md](04-testing.md) §3).
- [ ] `Button` core: thiếu quyền → **disabled + title**, không biến mất (trừ `hideWhenDenied`).
- [ ] Mọi dòng trong bảng §2.2 có gate thực tế — kiểm bằng test component: đăng nhập sai role → nút disabled / không gọi mutation.
- [ ] `ScoreInput` disabled khi `!can('edit', {state, scope})`.
- [ ] `defaultRouteForRole` + `rolesForPath` là nơi DUY NHẤT map route↔role; `LoginPage` và `RequireRole` cùng dùng.
- [ ] Token hết hạn (chỉnh `expiresAt` về quá khứ trong devtools) → lần điều hướng/refetch kế tiếp đá về `/login`.
- [ ] MSW handler trả 403 khi user role sai gọi transition (đã làm Phase 2, thêm test ở đây).
- [ ] grep `getDefaultRoute` = 0 (đã đổi tên/di chuyển).
- [ ] `rolesForPath('/thi-dua/lich-su-thay-doi')` KHÔNG chứa `LOCALITY`; role `LOCALITY` vào route audit → redirect `/thi-dua/dia-phuong/trang-thai`.
- [ ] Trang cổng LOCALITY không đọc `localityId` từ `useParams` (grep `useParams` trong `src/features/dia-phuong/` — chỉ `:nam`).
- [ ] MSW: `loginAs('LOCALITY', { localityId: 'dp1' })` gọi `/scores?localityId=dp2` hoặc `/evidence?localityId=dp2` → 403; gọi `/audits` → 403.
- [ ] `LOCALITY` không có `localityId` → trang cổng hiện EmptyState "chưa gắn địa phương", không crash.
