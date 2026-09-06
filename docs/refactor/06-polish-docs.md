# Phase 6 — Polish + a11y + docs

**Thời lượng:** ~1 ngày. **Phụ thuộc:** tất cả phase trước.
**Nâng điểm:** UI 7→10, docs 6→10.

---

## 1. Sweep UI correctness

- [ ] `grep -rn "{record.state}" src/**/*.tsx` → 0 (đã làm B1, xác nhận lại).
- [ ] `grep -rn "\.state}<" src` → 0 enum thô.
- [ ] `ScoreInput` (`src/features/cham-diem/components/ScoreInput.tsx`): prop `value: number | null` (bỏ `''`). Empty → hiển thị placeholder, `onChange(null)` khi xoá trắng thay vì ép `0`. Caller phân biệt "chưa chấm" vs "chấm 0".
  - `record.entries` chỉ tạo entry khi có giá trị thật; "chưa chấm" = không có entry (khớp `isRecordComplete`).
- [ ] Mọi `useQuery` trong trang có 3 nhánh: `isLoading` → skeleton, `isError` → `<EmptyState>` + nút "Thử lại" (`onClick={refetch}`), `data` → nội dung. Rà từng trang ở [02-service-layer.md](02-service-layer.md) §5.
- [ ] `toast` thống nhất: thành công `toast.success`, lỗi API `toast.error(mapApiError(e))`. Không nuốt lỗi im lặng (`onError` mọi mutation).
- [ ] Bỏ `eslint-disable react-hooks/exhaustive-deps` ở `ApprovalPage.tsx` (columns memo). Cách đúng: đưa `handleApprove`/`setDiffRow`... vào `useCallback` hoặc chấp nhận deps đầy đủ; columns không cần memo theo `[canApprove]` nếu dùng `useCan()` trực tiếp trong cell.
- [ ] Dialog "Trả lại hồ sơ" + dialog lịch sử audit trùng ở `ApprovalPage.tsx` và `StandingCommitteePage.tsx` → tách core `RejectDialog` + `AuditTimelineDialog`. Chi tiết ở [07-core-components.md](07-core-components.md) §5 (làm ở Phase 7, tick ở đây).
- [ ] `EmptyState` biến thể `error` + nút "Thử lại" cho mọi `isError` của query — [07-core-components.md](07-core-components.md) §4.

---

## 2. Accessibility (WCAG 2.1 AA — mức thực tế)

- [ ] Mọi nút chỉ-icon có `aria-label` (grep `<Button` + `size="icon` không kèm `aria-label` → sửa). VD chuông thông báo ở `AppLayout`.
- [ ] Dialog (`src/components/ui/dialog.tsx` + mọi `<Dialog>`): focus trap (base-ui/radix lo sẵn — xác nhận), `Esc` đóng, focus trả về trigger khi đóng. Test tay bằng bàn phím.
- [ ] `ConfirmDialog` keyword input: `aria-describedby` trỏ tới hint.
- [ ] `DataTable`: header sort là `<button>` hoặc có `role="button"` + `tabIndex={0}` + `aria-sort`. Hiện là `<div onClick>` — thêm keyboard (`onKeyDown` Enter/Space) + `aria-sort={asc|desc|none}`.
- [ ] Form: mọi `<Input>` có `<Label htmlFor>` khớp `id` (phần lớn đã có; rà `LoginPage` dùng `<label>` thô — OK). Lỗi validate gắn `aria-invalid` + `aria-describedby`.
- [ ] Màu: kiểm tương phản text/nền ≥ 4.5:1 (badge `info`/`warning`/`success` trên nền trắng). Dùng công cụ; chỉnh token trong `tailwind.config.js` / `index.css` nếu fail.
- [ ] `:focus-visible` thấy rõ trên mọi control tương tác (ring). Kiểm nút trong `DataTable`, `NavItem`.
- [ ] Skip-link "Bỏ qua tới nội dung" ở đầu `AppLayout`/`LocalityLayout` → `#main`.
- [ ] `<html lang="vi">` trong `index.html`.
- [ ] Ảnh nền trang trí (`sidebar.png`, `login-*.png`) đã `aria-hidden` — xác nhận; `Trophy`/`Star` icon trang trí có `aria-hidden`.
- [ ] Chạy `axe` trong 1 test component (`vitest-axe` hoặc `@axe-core/playwright` trong 1 e2e smoke) trên: Login, Dashboard, trang Chấm điểm, 1 dialog.

---

## 3. Dọn dependency

Sau Phase 2 (đã dùng react-query + axios), rà `package.json`:
- [ ] `grep -rn "from 'recharts'" src` — nếu chỉ vài chart, giữ. Nếu 0 → gỡ.
- [ ] `@tanstack/react-virtual` — grep; nếu không dùng (DataTable phân trang, không ảo hoá) → gỡ.
- [ ] `next-themes` — grep; nếu app chỉ light mode → gỡ hoặc triển khai dark mode thật (xem §4).
- [ ] `shadcn` (runtime dep, bất thường — thường devDep/CLI) → chuyển devDep hoặc gỡ.
- [ ] `tw-animate-css` + `tailwindcss-animate` — trùng vai trò; giữ 1.
- [ ] `msw` chuyển sang **dependencies** nếu `browser.ts` chạy ở dev build (import động OK ở devDep, nhưng an toàn để deps). Xác nhận không lọt vào bundle production (import guard bằng `VITE_ENABLE_MOCK`).
- [ ] Chạy `pnpm dlx depcheck` — xử lý unused/missing.

---

## 4. Dark mode (quyết định)

`next-themes` đang trong deps. Chọn:
- **(a)** Bỏ: gỡ dep, xoá mọi `dark:` class thừa.
- **(b)** Làm thật: `ThemeProvider` ở `App`, toggle trong menu user, token dark trong `index.css` (`.dark { --background: ... }`), kiểm mọi trang + `DataTable` header (`bg-primary` cần biến thể dark).
Khuyến nghị (a) trừ khi có yêu cầu — hệ thống nội bộ ít cần.

---

## 5. Docs

### 5.1 Cập nhật `docs/SAD-FE-ThiDuaKhenThuong.md`
Thêm/sửa mục:
- **Kiến trúc dữ liệu**: sơ đồ Component → RQ hook → service → apiClient → (MSW | BE). Nêu rõ MSW là tạm.
- **State machine**: dán bảng + sơ đồ từ [reference-state-machine.md](reference-state-machine.md).
- **RBAC**: link [reference-rbac-matrix.md](reference-rbac-matrix.md).
- **Cấu hình môi trường**: `VITE_API_BASE_URL`, `VITE_ENABLE_MOCK`.

### 5.2 Tạo mới
- `docs/testing.md`: cách chạy unit/component/e2e, cấu trúc thư mục test, helper `renderApp`/`loginAs`, ngưỡng coverage, cách thêm test cho tính năng mới.
- `docs/rbac-matrix.md`: bản chính thức (copy từ `docs/refactor/reference-rbac-matrix.md` sau khi chốt).
- `docs/adr/0001-msw-thay-backend-tam-thoi.md`: bối cảnh (FE trước, BE sau), quyết định (MSW + service layer), hệ quả (khi có BE: thay `src/mocks`, chuyển token sang httpOnly cookie, bỏ `persist` token), phương án đã loại (localStorage thuần, chờ BE).
- `docs/adr/0002-business-logic-trong-lib.md`: vì sao state-machine/RBAC ở `src/lib` pure, dùng chung UI + mock server.

### 5.3 `README.md`
- Bảng scripts cập nhật (`typecheck`, `test:cov`, `test:e2e`, `validate`).
- Mục "Chạy với mock": `VITE_ENABLE_MOCK=true pnpm dev`.
- Mục "Nối backend thật": set `VITE_API_BASE_URL`, `VITE_ENABLE_MOCK=false`, đối chiếu hợp đồng API ở [02-service-layer.md](02-service-layer.md) §1.
- Link `docs/testing.md`, `docs/adr/`.

### 5.4 JSDoc
- Mọi export ở `src/lib/**` và `src/services/**`: 1 dòng mô tả + `@param`/`@returns` nếu không hiển nhiên.
- `src/api/hooks/**`: mô tả query key + invalidation side-effect.

---

## 6. Housekeeping

- [ ] Xoá `dist/`, `test-results/`, `.tmp/` khỏi git; thêm `.gitignore`.
- [ ] `vite.config.js` + `vite.config.d.ts` + `vite.config.ts` — chỉ giữ `.ts`. Xoá `.js`/`.d.ts` (artefact build lọt vào repo).
- [ ] `tsconfig.tsbuildinfo`, `tsconfig.node.tsbuildinfo` → `.gitignore`.
- [ ] `src/tailwind-output.css` — nếu là output build, gỡ khỏi repo + gitignore.
- [ ] `components.json` giữ (shadcn config).

---

## Nghiệm thu Phase 6 + toàn dự án

- [ ] `pnpm validate` xanh.
- [ ] `pnpm test:e2e` xanh.
- [ ] axe smoke 0 violation nghiêm trọng trên 4 màn chính.
- [ ] `depcheck` sạch; deps không dùng đã gỡ.
- [ ] SAD + `docs/testing.md` + 2 ADR + `docs/rbac-matrix.md` tồn tại, khớp code.
- [ ] Repo không còn file build/scratch bị track.
- [ ] Checklist "Definition of Done" ở [README.md](README.md) tick hết.
- [ ] Chấm lại theo 8 tiêu chí ban đầu → mọi mục ≥ 9.
