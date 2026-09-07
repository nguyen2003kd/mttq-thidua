# Bug list hợp nhất — fix trong Phase 1

Mỗi bug: vị trí, mô tả, cách tái hiện, cách fix, test regression bắt buộc.
ID dùng để tham chiếu chéo ở các file phase.

---

## B1 — Enum trạng thái hiển thị thô cho người dùng

**Vị trí:**
- `src/features/cham-diem/pages/ScoreByCriteriaPage.tsx` — `<Badge ...>{record.state}</Badge>` trong `ScoreRow` (khoảng dòng 165–168).
- `src/features/cham-diem/pages/ScoreByLocalityPage.tsx` — `<Badge ...>{record.state}</Badge>` (khoảng dòng 933–935).

**Mô tả:** hiển thị `CHO_DUYET_BAN` thay vì "Chờ duyệt Ban". Đã có sẵn `ScoreStateBadge` ở `src/components/core/StatusBadge.tsx` map đúng label + variant.

**Fix:** thay cả hai chỗ bằng `<ScoreStateBadge state={record.state} />`. Bỏ import `Badge` nếu không còn dùng trong file. Grep toàn repo `>{record.state}<` và `{record.state}` trong `.tsx` phải về 0 (trừ khi truyền vào prop `state=`).

**Test:** `ScoreByCriteriaPage.test.tsx` — render 1 locality state `CHO_DUYET_BAN`, assert text "Chờ duyệt Ban" xuất hiện, "CHO_DUYET_BAN" không.

---

## B2 — `useCountdown` dep không ổn định

**Vị trí:** `src/hooks/useCountdown.ts`.

**Mô tả:**
```ts
const target = typeof targetDate === 'string' ? new Date(targetDate) : targetDate;
useEffect(() => { ... }, [target]);
```
`target` là object `new Date()` mới mỗi render → `[target]` luôn khác → `setInterval` bị `clearInterval` + tạo lại mỗi render. Countdown không tick đều, rò rỉ timer khi render dày.

**Fix:** memo hoá theo giá trị nguyên thuỷ.
```ts
import { useState, useEffect, useMemo } from 'react';
import { daysBetween } from '@/lib/utils';

export function useCountdown(targetDate: string | Date) {
  const targetMs = useMemo(
    () => (typeof targetDate === 'string' ? new Date(targetDate) : targetDate).getTime(),
    [targetDate instanceof Date ? targetDate.getTime() : targetDate],
  );
  const [daysLeft, setDaysLeft] = useState(() => daysBetween(Date.now(), targetMs));

  useEffect(() => {
    const tick = () => setDaysLeft(daysBetween(Date.now(), targetMs));
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [targetMs]);

  return { daysLeft, isExpired: daysLeft <= 0 };
}
```
`daysBetween` phải nhận `number | string | Date` (xem B3).

**Test:** `useCountdown.test.tsx` với `vi.useFakeTimers()` — mount, advance 5 phút, assert `setInterval` gọi `daysBetween` đúng số lần; rerender nhiều lần với cùng `targetDate` string, assert timer không bị recreate (spy `clearInterval`).

---

## B3 — `daysBetween` lệch ±1 quanh nửa đêm

**Vị trí:** `src/lib/utils.ts`.

**Mô tả:** `Math.ceil((d2 - d1) / DAY_MS)` — chênh vài giờ trong ngày cũng làm tròn lên thành nguyên 1 ngày. Countdown "còn 30 ngày" nhảy lung tung theo giờ mở app.

**Fix:** so theo mốc 00:00 địa phương, rồi chia chẵn.
```ts
export function daysBetween(from: number | string | Date, to: number | string | Date): number {
  const startOfDay = (v: number | string | Date) => {
    const d = new Date(v);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  };
  return Math.round((startOfDay(to) - startOfDay(from)) / 86_400_000);
}
```

**Test:** `utils.test.ts` —
- `daysBetween('2026-01-01', '2026-01-31')` === 30
- cùng ngày, khác giờ → 0
- `to` quá khứ → số âm
- qua năm nhuận (`2024-02-28` → `2024-03-01`) === 2

---

## B4 — State machine thiếu transition, store tự chế logic

**Vị trí:**
- `src/lib/state-machine.ts` — mảng `TRANSITIONS` thiếu entry reject từ `CHO_DUYET_BTT`.
- `src/store/scoreStore.ts` — `approve`, `reject`, `publish` viết if-else transition thủ công, không gọi `getNextState`/`canTransition`.

**Mô tả:** `scoreStore.reject` xử lý `CHO_DUYET_BTT → CHO_DUYET_HOI_DONG` nhưng `canTransition('CHO_DUYET_BTT','reject')` trả `false`. Hai nguồn chân lý mâu thuẫn → drift, khó test, khó audit.

**Fix:** xem chi tiết [01-domain-logic.md](01-domain-logic.md) §2. Tóm tắt:
1. `TRANSITIONS` bổ sung đủ 3 nhánh reject: `CHO_DUYET_BAN→DRAFT`, `CHO_DUYET_HOI_DONG→CHO_DUYET_BAN`, `CHO_DUYET_BTT→CHO_DUYET_HOI_DONG`.
2. `publish` = transition `CHO_DUYET_BTT --publish--> DA_CONG_BO` (giữ action name `publish` để khớp RBAC).
3. Thêm `applyTransition(record, action, actor)` pure → `{ ok: true, record, audit } | { ok: false, error }`.
4. `scoreStore` chỉ gọi `applyTransition`, không còn if-else.

**Test:** `state-machine.test.ts` — bảng đầy đủ: mọi cặp `(from, action)` hợp lệ → `to` đúng; mọi cặp không hợp lệ → `canTransition` false, `getNextState` null; `isFinalState('DA_CONG_BO')` true; `applyTransition` từ `DA_CONG_BO` → `{ ok: false }`.

---

## B5 — `submit` chặn tổng điểm 0

**Vị trí:** `src/store/scoreStore.ts` — `submit`: `if (record.state !== 'DRAFT' || record.totalScore === 0) return state;`

**Mô tả:** địa phương bị chấm 0 điểm ở mọi tiêu chí (hợp lệ) thì không nộp được — kẹt vĩnh viễn ở DRAFT.

**Fix:** điều kiện đúng là "đã chấm đủ mọi tiêu chí của bảng", không phải tổng > 0.
```ts
submit: (tableId, localityId, actorName, actorRole) => set((state) => {
  const table = state.criteriaTables.find((t) => t.id === tableId);
  const record = get().getScore(tableId, localityId);
  if (!table || record.state !== 'DRAFT') return state;
  const scoredIds = new Set(record.entries.map((e) => e.criteriaId));
  const allScored = table.criteria.every((c) => scoredIds.has(c.id));
  if (!allScored) return state;
  // ... transition qua applyTransition
});
```
UI: nút "Nộp" ở `ScoreByCriteriaPage`/`ScoreByLocalityPage` đổi điều kiện hiện từ `record.totalScore > 0` sang `allScored` (helper `isRecordComplete(table, record)` ở `lib/state-machine.ts`).

**Test:** `scoreStore.test.ts` — chấm cả 3 tiêu chí = 0 → `submit` thành công, state `CHO_DUYET_BAN`. Chấm 2/3 tiêu chí → `submit` no-op.

---

## B6 — Hardcode `criteriaTables[0]`

**Vị trí:**
- `src/store/scoreStore.ts` — `getScoreForLocality`, `getRanking` dùng `state.criteriaTables[0]`.
- `src/features/cham-diem/pages/ScoreByLocalityPage.tsx` — `const table = useMemo(() => criteriaTables[0], ...)`.
- `src/components/layout/AppLayout.tsx` — nav item SPECIALIST dùng `criteriaTables[0].id`.
- `src/App.tsx` — `ScoreRedirect` dùng `criteriaTables[0]` (chấp nhận được vì chỉ là redirect mặc định — ghi chú, không bắt buộc sửa).

**Mô tả:** sai ngay khi có > 1 bảng tiêu chí (chức năng tạo bảng đã tồn tại). Ranking chỉ tính bảng đầu; trang chấm theo địa phương luôn mở bảng đầu bất kể địa phương được gán bảng nào.

**Fix:**
- `getRanking(tableId: string)`, `getScoreForLocality(localityId, tableId?: string)` — nhận tham số. Nếu không truyền, chọn bảng `status === 'ACTIVE'` đầu tiên mà địa phương được gán; fallback bảng active đầu tiên.
- Thêm selector `getActiveTableForLocality(localityId): CriteriaTable | null`.
- `ScoreByLocalityPage`: resolve bảng từ assignment của địa phương, không lấy `[0]`. Nếu địa phương thuộc nhiều bảng → hiện selector bảng (đơn giản: list card như nhánh `!id`).
- `AppLayout`: giữ `[0]` nhưng đổi thành "bảng ACTIVE đầu tiên" cho gọn; không critical.

**Test:** `scoreStore.test.ts` — seed 2 bảng, địa phương gán bảng thứ 2 → `getActiveTableForLocality` trả bảng 2; `getRanking(table2.id)` xếp hạng theo điểm bảng 2.

---

## B7 — `can()` bỏ qua scope khi user thiếu scope field

**Vị trí:** `src/lib/rbac.ts` — `can()`, nhánh `context.scope`.

**Mô tả:**
```ts
if (context.scope.banId && user.banId && context.scope.banId !== user.banId) return false;
```
Nếu `user.banId` là `undefined` (token thiếu), điều kiện `&& user.banId` false → **bỏ qua kiểm tra** → user không thuộc ban nào vẫn duyệt được mọi ban.

**Fix:** khi context yêu cầu scope, user **phải** có scope tương ứng và khớp — trừ `ADMIN` (toàn quyền theo thiết kế hiện tại).
```ts
if (context?.scope && user.role !== 'ADMIN') {
  if (context.scope.banId !== undefined) {
    if (user.banId === undefined || user.banId !== context.scope.banId) return false;
  }
  if (context.scope.localityId !== undefined) {
    if (user.localityId === undefined || user.localityId !== context.scope.localityId) return false;
  }
}
```

**Test:** `rbac.test.ts` —
- `BAN_LEADER` không `banId`, context `scope.banId='ban1'` → `can('approve', ...)` false.
- `BAN_LEADER` `banId='ban1'`, scope `ban1` → true; scope `ban2` → false.
- `LOCALITY` `localityId='dp1'`, scope `dp2` → false.
- `ADMIN` không scope field, scope bất kỳ → không bị chặn bởi scope.

---

## B8 — `apiClient` 401 dùng `window.location.href`

**Vị trí:** `src/api/client.ts` — interceptor response, nhánh 401: `window.location.href = '/login'`.

**Mô tả:** full page reload, mất state SPA, mất toast. (Hiện chưa chạy vì `apiClient` chưa được import ở đâu — sẽ chạy sau Phase 2.)

**Fix:** interceptor chỉ `clearAuth()` + `reject`. Điều hướng để React Router lo qua `RequireAuth` (token null → redirect `/login` giữ `location.state.from`). Nếu cần cưỡng bức, phát custom event `window.dispatchEvent(new Event('auth:logout'))` và cho `App` lắng nghe rồi `navigate`.

**Test:** `apiClient.test.ts` (msw server) — endpoint trả 401 → `authStore.token` bị clear, promise reject, **không** gọi `window.location` (spy).

---

## B9 — `LOCALITY_STATUS_MAP` union lai

**Vị trí:** `src/lib/state-machine.ts` — `Record<ScoreState | 'SUBMITTED', LocalityStatus>` + `toLocalityStatus(state: ScoreState | 'SUBMITTED')`.

**Mô tả:** `'SUBMITTED'` không phải `ScoreState`, nhét vào key gây union lạ, caller phải ép kiểu. `submitted` status thực ra suy ra được từ `state !== 'DRAFT' && submittedAt != null`.

**Fix:** bỏ `'SUBMITTED'`. Chuyển sang hàm nhận `record`:
```ts
export function toLocalityStatus(record: Pick<ScoreRecord, 'state' | 'submittedAt'>): LocalityStatus {
  if (record.state === 'DA_CONG_BO') return 'published';
  if (record.state !== 'DRAFT') return 'processing';
  return record.submittedAt ? 'submitted' : 'processing';
}
```
Cập nhật callers (grep `toLocalityStatus`).

**Test:** `state-machine.test.ts` — 3 nhánh.

---

## B10 — Store persist toàn bộ dữ liệu nghiệp vụ

**Vị trí:** `src/store/scoreStore.ts` — `persist` với `partialize` giữ `criteriaTables, localities, evidence, audits, scores, assignments, deadline`.

**Mô tả:** dữ liệu nghiệp vụ sống trong localStorage của store → không thể có loading/error state, không sync nhiều tab đúng cách, seed 170 dòng nhét trong file store. Sau Phase 2 dữ liệu này về MSW.

**Fix:** xem [02-service-layer.md](02-service-layer.md). `scoreStore` co lại còn UI/draft state; `persist` chỉ giữ draft điểm chưa lưu (nếu muốn) — hoặc bỏ hẳn persist.

**Test:** sau Phase 2, `scoreStore.test.ts` không còn test dữ liệu nghiệp vụ; chuyển sang `services/*.test.ts`.

---

## B11 — Route `bang-tieu-chi/new` chết + vỡ nếu gọi tới

**Vị trí:** `src/App.tsx:84` (`<Route path="bang-tieu-chi/new" element={<CriteriaFormPage />} />`), `src/constants/routes.ts:5` (`ADMIN_CRITERIA_NEW`).

**Mô tả:** không chỗ nào navigate tới `ROUTES.ADMIN_CRITERIA_NEW` (grep = 0). `CriteriaListPage` tạo bảng qua **Dialog**, không qua route. Nếu ai gọi `/thi-dua/admin/bang-tieu-chi/new`: React Router match route literal `new` (rank cao hơn `:id`), `useParams().id === undefined` → `CriteriaFormPage` tính `isNew = undefined === 'new'` = `false` → `!isNew && !existing` → render EmptyState "Không tìm thấy bảng tiêu chí". Vỡ.

**Fix:** xoá `<Route path="bang-tieu-chi/new">` + const `ADMIN_CRITERIA_NEW`. `CriteriaFormPage` đã tự xử `id === 'new'`, nên nếu sau này cần trang tạo riêng thì để `bang-tieu-chi/:id` bắt luôn (`id="new"`), không cần route literal.

**Test:** `guards.test.tsx` / route test — điều hướng `/thi-dua/admin/bang-tieu-chi/new` với role ADMIN → hoặc render form tạo (nếu giữ `:id` bắt), hoặc 404-redirect (nếu xoá hẳn). KHÔNG được ra EmptyState "không tìm thấy".

---

## B12 — Thứ tự route trong block `/thi-dua/admin` lộn xộn

**Vị trí:** `src/App.tsx:76–92`.

**Mô tả:** `<Route index>` nằm giữa các route con `bang-tieu-chi/*`; `bang-tieu-chi/:id/gan-dia-phuong` đặt sau `index`. React Router v6 rank theo độ cụ thể nên **không lỗi chức năng**, nhưng khó đọc, dễ gây hiểu nhầm khi sửa.

**Fix:** sắp lại: `index` đầu tiên, rồi các route tĩnh → động → lồng sâu. Xem [01-domain-logic.md §6](01-domain-logic.md).

**Test:** không cần test riêng; smoke route (mọi path admin render đúng page) ở `guards.test.tsx`.

---

## B13 — Naming `dia-phuong` mang 2 nghĩa

**Vị trí:** `src/App.tsx` — `/thi-dua/admin/dia-phuong` (`LocalityListPage`, ADMIN quản lý danh mục) vs `/thi-dua/dia-phuong/*` (cổng của MỘT địa phương, role LOCALITY).

**Mô tả:** không lỗi, nhưng cùng slug cho 2 khái niệm khác nhau → dễ nhầm khi đọc route/guard.

**Fix (tùy chọn, khuyến nghị):** đổi route admin thành `/thi-dua/admin/danh-muc-dia-phuong` (hoặc `quan-ly-dia-phuong`). Cập nhật `ROUTES.ADMIN_LOCALITY`, `AppLayout` nav, `ROUTE_ROLES` ([03-rbac.md](03-rbac.md) §1.2). Không đụng `/thi-dua/dia-phuong/*`.

**Test:** cập nhật `rbac.test.ts` `rolesForPath` cho path mới.

---

## B14 — Role cho route Audit lệch giữa 2 nguồn

**Vị trí:**
- `src/App.tsx` — route `/thi-dua/lich-su-thay-doi/:diaPhuongId?` dùng `INTERNAL_ROLES` = `['ADMIN','SPECIALIST','BAN_LEADER','COUNCIL_CHAIR','COUNCIL_VICE','STANDING_COMMITTEE']` — **không** có `LOCALITY`.
- `src/lib/rbac.ts` — `canAccessRoute` map `/thi-dua/lich-su-thay-doi` → **có** `LOCALITY`.

**Mô tả:** hai nguồn route→role mâu thuẫn. Chưa gây lỗi runtime vì `canAccessRoute` không được gọi ở đâu (code chết), nhưng là mìn khi Phase 3 chuyển sang `rolesForPath` làm nguồn duy nhất.

**ĐÃ CHỐT NGHIỆP VỤ:** địa phương **KHÔNG** xem được lịch sử thay đổi. Và địa phương **KHÔNG** xem được dữ liệu của địa phương khác ở bất kỳ đâu.

**Fix:**
1. `ROUTE_ROLES['/thi-dua/lich-su-thay-doi']` = chỉ role nội bộ `['ADMIN','SPECIALIST','BAN_LEADER','COUNCIL_CHAIR','COUNCIL_VICE','STANDING_COMMITTEE']` — **bỏ `LOCALITY`** (khớp `INTERNAL_ROLES` trong `App.tsx`).
2. Route `App.tsx` `/thi-dua/lich-su-thay-doi/:diaPhuongId?` giữ `RequireRole roles={INTERNAL_ROLES}` (đã đúng). Không đổi.
3. `src/lib/rbac.ts` — xoá `LOCALITY` khỏi `canAccessRoute`/`ROUTE_ROLES` map cho path này.
4. **Scope địa phương toàn hệ thống** (xem [03-rbac.md](03-rbac.md) §6): mọi trang cổng địa phương (`TrangThaiPage`, `MinhChungPage`, `KetQuaPage`) chỉ đọc dữ liệu của `user.localityId` — **không** nhận `localityId` từ URL/param. MSW handler enforce: role `LOCALITY` gọi `/scores?localityId=X`, `/audits?localityId=X`, `/evidence?localityId=X` với `X !== user.localityId` → `403 FORBIDDEN`.

**Test:**
- `rbac.test.ts` — `rolesForPath('/thi-dua/lich-su-thay-doi')` KHÔNG chứa `LOCALITY`.
- `guards.test.tsx` — role `LOCALITY` vào `/thi-dua/lich-su-thay-doi/...` → redirect `defaultRouteForRole('LOCALITY')` = `/thi-dua/dia-phuong/trang-thai`.
- `scoreService.test.ts` / MSW — `loginAs('LOCALITY')` với `localityId='dp1'`, gọi `scoreService.get(tableId, 'dp2')` → 403.
- `auditService.test.ts` — `LOCALITY` gọi `/audits` bất kỳ → 403 (không có quyền `view` audit).

---

## B15 — `LocalityLayout` thiếu nút đăng xuất

**Vị trí:** `src/components/layout/LocalityLayout.tsx`.

**Mô tả:** header chỉ hiển thị `{user.name}` dạng text, không có user menu, không có logout. Role `LOCALITY` render layout này (không phải `AppLayout`) → **không có cách đăng xuất**. Bonus: 3 nav item cùng dùng `icon={Trophy}`.

**Fix:** thêm `DropdownMenu` (giống `AppLayout`) với avatar + tên + `ROLE_LABELS[role]` + `DropdownMenuItem` "Đăng xuất" gọi `clearAuth()` + `navigate(ROUTES.LOGIN)`. Nav item dùng icon riêng (FileText / Upload / Award).

**Test:** `LocalityLayout.test.tsx` — render với user, mở dropdown, click "Đăng xuất" → `authStore.token` null, điều hướng `/login`.

**Trạng thái:** ✅ fixed (`refactor/phase-7-core-components`).

---

## B16 — Thang font-size không chuẩn

**Vị trí:** `src/components/layout/AppLayout.tsx` header (`text-[13px]`, `text-[10px]`, `text-[11px]` lẫn `text-xs`, `text-sm`), rải rác vài nơi.

**Mô tả:** kích thước chữ tùy tiện, không theo scale Tailwind, khó bảo trì + không scale theo user setting.

**Fix (Phase 6):** chuẩn hóa về `text-xs`/`text-sm`/`text-base`… Bỏ mọi `text-[Npx]` tùy biến trừ khi có lý do. Xem [06-polish-docs.md](06-polish-docs.md) §2 (typography).

**Trạng thái:** ⬜ Phase 6.

---

## B17 — `window.confirm()` thay vì `ConfirmDialog`

**Vị trí:**
- `src/features/admin/pages/CriteriaListPage.tsx` — xóa bảng tiêu chí.
- `src/features/admin/pages/LocalityListPage.tsx` — `handleDelete` (còn gây **double confirm** vì `DetailDialog` đã có bước xác nhận riêng).

**Fix:** CriteriaListPage → `<ConfirmDialog variant="destructive" action="delete">`. LocalityListPage → bỏ `window.confirm` (DetailDialog tự lo xác nhận), `handleDelete` chỉ xóa + đóng dialog.

**Trạng thái:** ✅ fixed (`refactor/phase-7-core-components`).

---

## B18 — Không có trang 404 + loading fallback sơ sài

**Vị trí:** `src/App.tsx` — `<Route path="*">` redirect thẳng về dashboard (nuốt lỗi URL sai); `<Loading>` chỉ là spinner tròn, không skeleton.

**Fix:**
- Thêm `src/features/NotFoundPage.tsx` — `EmptyState` + nút "Về trang chính" (theo `defaultRouteForRole`). `<Route path="*" element={<NotFoundPage />} />`.
- (Phase 6) `<Loading>` → skeleton khớp layout, hoặc `Spinner` core dùng chung (LoginPage hiện tự viết spinner inline).

**Trạng thái:** 🟡 404 page ✅ fixed; skeleton/Spinner core ⬜ Phase 6.

---

## Bảng tổng

| ID | Nhóm | Mức | Fix ở |
|---|---|---|---|
| B1 | UI correctness | trung bình | Phase 1 |
| B2 | hook bug | trung bình | Phase 1 |
| B3 | logic sai số | thấp | Phase 1 |
| B4 | kiến trúc + đúng đắn | cao | Phase 1 |
| B5 | chặn nghiệp vụ hợp lệ | trung bình | Phase 1 |
| B6 | sai khi scale dữ liệu | cao | Phase 1 |
| B7 | bảo mật (bypass scope) | cao | Phase 1 / 3 |
| B8 | UX + SPA | thấp | Phase 1 / 2 |
| B9 | type smell | thấp | Phase 1 |
| B10 | kiến trúc data | cao | Phase 2 |
| B11 | route chết + vỡ | trung bình | Phase 1 |
| B12 | route thứ tự khó đọc | thấp | Phase 1 |
| B13 | naming mơ hồ | thấp | Phase 1 (tùy chọn) |
| B14 | route→role lệch nguồn + scope địa phương | cao | Phase 3 (đã chốt: LOCALITY không xem audit, không xem địa phương khác) |
| B15 | LOCALITY không đăng xuất được | cao | ✅ fixed (phase-7) |
| B16 | thang font-size không chuẩn | trung bình | Phase 6 |
| B17 | window.confirm thay ConfirmDialog (+ double confirm) | trung bình | ✅ fixed (phase-7) |
| B18 | thiếu 404 page + loading skeleton | thấp | 🟡 404 ✅ fixed; skeleton Phase 6 |
