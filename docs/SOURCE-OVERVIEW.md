# Source Overview — Thi đua Khen thưởng (MTTQ)

Tài liệu tổng hợp toàn bộ source frontend: kiến trúc, mô hình dữ liệu, luồng nghiệp vụ, RBAC, danh mục component, trạng thái refactor.

> Cập nhật: sau nhánh `refactor/phase-1-domain-logic` + `refactor/phase-7-core-components`.
> Kế hoạch nâng cấp chi tiết: [`docs/refactor/`](refactor/README.md).

---

## 1. Mục tiêu & phạm vi

Module chấm điểm thi đua khen thưởng cho ~95 xã/phường (seed: các phường/xã Đồng Nai, `parentCode='75'`), đi qua **4 tầng duyệt nội bộ** trước khi công bố.

- **Hiện tại:** frontend thuần, dữ liệu trong `localStorage` (Zustand `persist`) + seed nhúng trong store. Chưa nối backend.
- **Đích:** tầng service + mock API (MSW) làm ranh giới backend — xem [refactor/02-service-layer.md](refactor/02-service-layer.md).

---

## 2. Tech stack

| Lớp | Công nghệ |
|---|---|
| Framework | React 18 + TypeScript 5.5 (strict) + Vite 5 |
| Routing | React Router v6 + RBAC guards |
| State (server) | @tanstack/react-query 5 — **đã cấu hình, chưa dùng** |
| State (UI/data tạm) | Zustand 4 + `persist` |
| Bảng | @tanstack/react-table 8 (+ react-virtual — ít dùng) |
| Form | React Hook Form + Zod (+ validate thủ công vài chỗ) |
| UI | TailwindCSS 3 + shadcn/ui pattern trên `@base-ui/react` |
| Icon | lucide-react |
| Chart | recharts |
| Toast | sonner |
| HTTP | axios — `src/api/client.ts` **cấu hình, chưa import ở đâu** |
| Test | Vitest 2 + @testing-library/react + Playwright (E2E — chưa viết) |
| Mock | msw (devDep — chưa dùng) |

Scripts: `dev`, `build`, `lint`, `typecheck`, `test` (`vitest run`), `test:watch`, `test:cov`, `test:e2e`, `validate` (lint→typecheck→cov→build).

---

## 3. Bản đồ thư mục

```
src/
  main.tsx                 entry
  App.tsx                  QueryClientProvider + BrowserRouter + Routes + <AuthEvents/>
  index.css                Tailwind + design tokens (HSL CSS vars)

  api/
    client.ts              axios instance + interceptor (401 → phát 'auth:logout')

  constants/
    enums.ts               SCORE_STATES + *_LABELS + PUBLISH_CONFIRM_KEYWORD
    labels.ts              LABELS — chuỗi UI tiếng Việt tập trung
    routes.ts              ROUTES — path constants

  data/
    vn-provinces.ts, vn-wards.ts   dữ liệu hành chính tĩnh

  types/
    rbac.ts                Role, ScoreState, LocalityStatus, ActionType, CriteriaTableStatus, AuthUser, Scope
    domain.ts              CriteriaItem/Table, ScoreEntry, ScoreRecord, LocalityScoreResponse,
                           AuditEntry, Evidence, Locality, ReminderConfig, LocalityStatusResponse

  lib/
    rbac.ts                can(), ROUTE_ROLES, rolesForPath(), canAccessRoute(), defaultRouteForRole()
    state-machine.ts       TRANSITIONS, canTransition/getNextState/availableActions,
                           applyTransition() (pure), isRecordComplete(), isEditable/isFinalState,
                           toLocalityStatus()
    id.ts                  uid(), nowIso()
    utils.ts               cn(), formatDate/formatDateTime (vi-VN), daysBetween()

  hooks/
    useAuth.ts             useAuth(), useCan()
    useCountdown.ts        đếm ngược theo ngày, tick mỗi 60s (dep ổn định)

  store/
    authStore.ts           user + token (persist 'thidua-auth')
    scoreStore.ts          criteriaTables, localities, assignments, scores, evidence, audits, deadline
                           + reducers + selectors (persist 'thidua-score')  ← Phase 2 sẽ tách ra service
    filterStore.ts         bộ lọc UI (ban/criteria/year/search)
    uiStore.ts             sidebarOpen, stickyTitle/Description

  routes/guards/
    RequireAuth.tsx        token null → /login (giữ location.state.from)
    RequireRole.tsx        role sai → defaultRouteForRole(role, user)

  components/
    ui/                    primitives shadcn/base-ui (button, dialog, select, table, badge, …)
    core/                  component nghiệp vụ tái dùng — xem §7
    shared/Can.tsx         <Can action state scope fallback> — gate theo quyền
    layout/
      AppLayout.tsx        sidebar + header cho role nội bộ
      LocalityLayout.tsx   layout cho role LOCALITY (3 nav item, KHÔNG có audit)

  features/                xem §8
```

---

## 4. Mô hình dữ liệu (`src/types`)

### Role (7)
`ADMIN` (admin tiêu chí) · `LOCALITY` (địa phương) · `SPECIALIST` (chuyên viên chấm) · `BAN_LEADER` (lãnh đạo Ban) · `COUNCIL_CHAIR` / `COUNCIL_VICE` (Hội đồng TĐKT) · `STANDING_COMMITTEE` (Ban thường trực).

### ScoreState (5)
`DRAFT` → `CHO_DUYET_BAN` → `CHO_DUYET_HOI_DONG` → `CHO_DUYET_BTT` → `DA_CONG_BO` (chốt, bất biến).

### Entity chính
- **CriteriaTable** — bảng tiêu chí: `criteria[]` (CriteriaItem: name/maxScore/order), `totalScore`, `status` (DRAFT/ACTIVE/EXPIRED), `openDate/closeDate`, `assignedLocalityCount`.
- **ScoreRecord** — bảng điểm 1 địa phương / 1 bảng tiêu chí: `state`, `entries[]` (ScoreEntry), `totalScore`, `submittedAt`, `publishedAt`.
- **Locality** — xã/phường: `code`, `name`, `fullName`, `unitType`, `region`.
- **Evidence** — minh chứng: `criteriaId`, `localityId`, `fileName`, `fileUrl`.
- **AuditEntry** — nhật ký: `timestamp`, `actorName/Role`, `action` (SCORE/EDIT/APPROVE/REJECT/PUBLISH), `fieldName` (`\`${criteriaId|state} - ${localityId}\``), `oldValue/newValue`, `reason`.

---

## 5. Luồng nghiệp vụ — State machine (`src/lib/state-machine.ts`)

`applyTransition({ from, action, actor, localityId, reason?, scoringComplete? })` → `{ ok:true, nextState, audit }` | `{ ok:false, error }`. **Pure**, không side effect. Store và (tương lai) MSW cùng gọi.

| Từ | Hành động | Đến | Role | Điều kiện |
|---|---|---|---|---|
| DRAFT | submit | CHO_DUYET_BAN | SPECIALIST | `isRecordComplete` (đã chấm đủ tiêu chí — điểm 0 vẫn tính) |
| CHO_DUYET_BAN | approve | CHO_DUYET_HOI_DONG | BAN_LEADER | scope `banId` khớp |
| CHO_DUYET_BAN | reject | DRAFT | BAN_LEADER | có `reason` |
| CHO_DUYET_HOI_DONG | approve | CHO_DUYET_BTT | COUNCIL_CHAIR | (VICE chỉ xem) |
| CHO_DUYET_HOI_DONG | reject | CHO_DUYET_BAN | COUNCIL_CHAIR | có `reason` |
| CHO_DUYET_BTT | publish | DA_CONG_BO | STANDING_COMMITTEE | keyword "CÔNG BỐ" ở UI |
| CHO_DUYET_BTT | reject | CHO_DUYET_HOI_DONG | STANDING_COMMITTEE | có `reason` |

Lỗi: `INVALID_TRANSITION`, `REASON_REQUIRED`, `INCOMPLETE_SCORING`, `FINAL_STATE`.

`toLocalityStatus(record)`: `DA_CONG_BO`→`published`; state khác DRAFT→`processing`; DRAFT + `submittedAt`→`submitted` (đã từng nộp rồi bị trả lại); DRAFT chưa nộp→`processing`.

Bảng đối chiếu đầy đủ: [refactor/reference-state-machine.md](refactor/reference-state-machine.md).

---

## 6. RBAC (`src/lib/rbac.ts`)

`can(user, action, { state?, scope? })` = **role cho phép** AND **state cho phép** (nếu truyền) AND **scope khớp** (nếu truyền; ADMIN bỏ qua scope).

- `ROLE_ACTIONS` — role → action.
- `STATE_ACTIONS` — ScoreState → action.
- Scope: nếu context yêu cầu `scope.banId`/`scope.localityId` mà user thiếu field đó → **deny** (không còn bypass).
- `ROUTE_ROLES` + `rolesForPath(pathname)` (prefix dài nhất thắng) — nguồn duy nhất route↔role. `/thi-dua/lich-su-thay-doi` **không** có `LOCALITY` (địa phương không xem lịch sử).
- `defaultRouteForRole(role, user?)` — trang mặc định sau login / khi vào route cấm.

Áp dụng ở UI: `<Button action state scope>` (core) và `<Can>` — nếu không đủ quyền thì ẩn nút (Phase 3 sẽ đổi thành disable + tooltip). Guard route: `RequireAuth` + `RequireRole`.

Ma trận đầy đủ: [refactor/reference-rbac-matrix.md](refactor/reference-rbac-matrix.md).

---

## 7. Core components (`src/components/core/`) — 17

| Component | Vai trò |
|---|---|
| `PageHeader` | tiêu đề trang + mô tả + actions |
| `DataTable` | bảng TanStack: sort/filter/paginate/search debounce, sticky header, variant `table`/`list`, loading skeleton, empty state, row select |
| `StatCard` | thẻ số liệu dashboard |
| `CountdownBanner` | banner đếm ngược hạn chót |
| `NavItem` | mục điều hướng sidebar (theme `sidebar`) |
| `EmptyState` | rỗng / lỗi (`variant='error'` + action "Thử lại") |
| `FilterSelect` | dropdown lọc (base-ui select) |
| `Button` | Button ui + gate RBAC (`action`/`state`/`scope`) |
| `ScoreStateBadge` / `LocalityStatusBadge` / `CriteriaStatusBadge` / `ActionBadge` | badge trạng thái — nhãn tiếng Việt + variant chuẩn |
| `ConfirmDialog` | xác nhận 1 bước hoặc 2 bước (nhập keyword) |
| `FormDialog` | khung Dialog + `<form>` + footer Hủy/Lưu, gate RBAC nút submit |
| `RejectDialog` | dialog "Trả lại hồ sơ" + input lý do + validate |
| `AuditTimelineDialog` | Dialog bọc `AuditTimeline` |
| `DetailDialog` | dialog xem chi tiết dạng label/value + nút Sửa/Xóa |
| `ListDialog` | dialog danh sách có search (vd: địa phương đã gán) |
| `AuditTimeline` | timeline nhật ký thay đổi |

Nguyên tắc: core **không** gọi store/query/service — nhận data + callback qua props.

---

## 8. Feature modules (`src/features/`)

| Module | Trang | Role | Ghi chú |
|---|---|---|---|
| `auth/` | `LoginPage` | — | demo role selector, `setAuth` giả (chưa qua service) |
| `admin/` | `CriteriaListPage`, `CriteriaFormPage`, `AssignLocalityPage`, `DeadlineConfigPage`, `LocalityListPage`, `AdminDashboardPage` | ADMIN | CRUD bảng tiêu chí, gán địa phương, cấu hình hạn |
| `cham-diem/` | `ScoreByCriteriaPage`, `ScoreByLocalityPage` (+ `ScoreInput`) | SPECIALIST | grid chấm điểm — **vẫn dùng `<Table>` thô**, chưa tách `ScoreGrid` core |
| `duyet/` | `ApprovalPage` (dùng chung) → `BanLeaderApprovalPage`, `CouncilApprovalPage`; `StandingCommitteePage` | BAN_LEADER / COUNCIL / STANDING | duyệt/trả lại/công bố; dùng `RejectDialog` + `AuditTimelineDialog` |
| `dia-phuong/` | `TrangThaiPage`, `MinhChungPage`, `KetQuaPage` | LOCALITY | cổng địa phương — lấy `user.localityId`, resolve bảng qua `getActiveTableForLocality` |
| `dashboard/` | `OverviewDashboardPage` (+ `DashboardContent`) | nội bộ | ranking + tình trạng (recharts) |
| `audit/` | `AuditLogPage` | nội bộ (không LOCALITY) | bảng nhật ký, lọc theo `:diaPhuongId?` |

---

## 9. Routing (`src/App.tsx` + `src/constants/routes.ts`)

- `/login` — công khai.
- `/thi-dua/admin/*` — ADMIN (AppLayout). `index`→danh sách; `bang-tieu-chi/:id` bắt cả `id="new"` (không còn route literal `/new`).
- `/thi-dua/dia-phuong/*` — LOCALITY (LocalityLayout): `trang-thai`, `minh-chung`, `ket-qua/:nam`.
- `/thi-dua/cham-diem/*` — SPECIALIST: `theo-tieu-chi/:id`, `theo-dia-phuong/:id`.
- `/thi-dua/duyet/lanh-dao-ban/:banId` — BAN_LEADER · `/hoi-dong-tdkt` — COUNCIL_* · `/ban-thuong-truc` — STANDING.
- `/thi-dua/lich-su-thay-doi/:diaPhuongId?` — role nội bộ (KHÔNG LOCALITY).
- `/thi-dua/dashboard-tong-quan` — role nội bộ.
- `<AuthEvents/>` lắng nghe `auth:logout` (từ interceptor 401) → `queryClient.clear()` + navigate `/login`.

---

## 10. Data layer — hiện trạng vs đích

**Hiện tại:** `scoreStore` giữ toàn bộ dữ liệu nghiệp vụ + seed (`initialTables/initialScores/…`), `persist` vào localStorage. `apiClient` + React Query đã cấu hình nhưng **không dùng**.

**Đích (Phase 2):**
```
Component → hook React Query (src/api/hooks) → service (src/services) → apiClient → MSW handlers (src/mocks)
```
MSW enforce RBAC + state-machine server-side (403/409). Đổi sang BE thật = thay `src/mocks`, không đụng UI. Hợp đồng API: [refactor/02-service-layer.md](refactor/02-service-layer.md) §1.

---

## 11. Testing

- **Đang có (93 test):** `lib/state-machine` (30, phủ 100%), `lib/rbac` (33, 100%), `lib/utils` (10), `store/scoreStore` (9), `hooks/useCountdown` (4), `core/RejectDialog` (3), `core/StatusBadge` (4).
- **Chưa có:** component test cho pages, service test, E2E Playwright.
- Coverage ngưỡng tăng dần theo phase (`vitest.config.ts`). Đích: lib 90%, store 85%, global 75%.

---

## 12. Trạng thái refactor & việc còn lại

| Phase | Nội dung | Trạng thái |
|---|---|---|
| 0 | Nền: scripts, coverage, test-setup | ✅ xong |
| 1 | state-machine 1 nguồn, fix bug B1–B14, test lib/store | ✅ xong (`c78525d`) |
| 7 | Chuẩn hoá core components | ✅ xong (`05e8f7b`) |
| 2 | Service layer + React Query + MSW | ⬜ chưa |
| 3 | RBAC enforce đầy đủ + scope địa phương ở MSW + token expiry | ⬜ chưa |
| 4 | Test component + service | ⬜ chưa |
| 5 | E2E Playwright | ⬜ chưa |
| 6 | Polish + a11y + docs (SAD, ADR) | ⬜ chưa |

**Nợ kỹ thuật đã biết:**
- `ScoreByCriteriaPage` / `ScoreByLocalityPage` dùng `<Table>` thô — cân nhắc tách `core/ScoreGrid`.
- `ScoreByLocalityPage` còn `criteriaTables[0]` (B6 chưa dứt điểm cho trang này).
- `ui/dialog.tsx` `DialogClose` render `<Button>` chưa `forwardRef` → warning "Function components cannot be given refs" ở mọi Dialog (Phase 6).
- `apiClient` + React Query + msw + react-virtual: cấu hình nhưng chưa dùng (Phase 2 kích hoạt, hoặc gỡ).
- `tsconfig*.tsbuildinfo`, `dist/`, `vite.config.js/.d.ts` bị track — dọn ở Phase 6.
- CI (`.github/workflows/ci.yml`) chưa tạo.

Chi tiết từng bug: [refactor/bug-list.md](refactor/bug-list.md). Kế hoạch từng phase: [refactor/README.md](refactor/README.md).
