# Refactor Plan — Thi đua Khen thưởng FE → 10/10

> Mục tiêu: nâng chất lượng codebase frontend lên mức production-grade **khi chưa có backend**.
> Giải pháp: dựng **tầng service + mock API (MSW)** làm ranh giới BE. Khi có BE thật, chỉ thay MSW handler, không đụng UI.

Tài liệu này viết để **một AI/dev khác thực thi** mà không cần hỏi lại. Mỗi phase là một file riêng, có: mục tiêu, file cần sửa, thay đổi cụ thể (kèm code mẫu), tiêu chí nghiệm thu, test phải thêm.

---

## Nguyên tắc

1. **Không phá UI hiện có.** Giao diện đã polish (commit gần đây). Refactor là đổi *nguồn dữ liệu* và *chỗ chứa business logic*, không đổi layout/màu/spacing.
2. **`src/lib/` là nguồn chân lý cho business rule.** State machine, RBAC chỉ định nghĩa một chỗ. UI và mock server đều import lại từ đây.
3. **Pure function ở `lib/`, orchestration ở `store/` và `services/`.** Logic thuần phải test được không cần React.
4. **Mọi mutation qua tầng service.** Không component nào gọi thẳng `localStorage` hay mutate store nghiệp vụ.
5. **Mọi thay đổi kèm test.** Không merge phase nếu coverage tụt dưới ngưỡng.
6. **TypeScript strict, zero `any`, zero `eslint-disable` mới.**

---

## Thứ tự thực thi

```
Phase 0  Nền hạ tầng (CI, coverage, scripts)         — 0.5 ngày   [BẮT BUỘC TRƯỚC]
Phase 1  Tách domain logic + fix bug correctness      — 1.5 ngày   [phụ thuộc 0]
Phase 2  Service layer + React Query + MSW            — 2.0 ngày   [phụ thuộc 1]
Phase 3  RBAC enforce đầy đủ                          — 1.0 ngày   [phụ thuộc 1; song song 4]
Phase 4  Test unit + component                        — 2.5 ngày   [phụ thuộc 1,2,3]
Phase 5  E2E Playwright                               — 1.5 ngày   [phụ thuộc 2,3]
Phase 6  Polish + a11y + docs                         — 1.0 ngày   [cuối]
Phase 7  Chuẩn hoá core components                    — 1.0 ngày   [phụ thuộc 1; song song 2–4]
```

Tổng ~12.5 ngày người.

| File | Phase | Nâng điểm |
|---|---|---|
| [00-foundation.md](00-foundation.md) | 0 | hạ tầng |
| [01-domain-logic.md](01-domain-logic.md) | 1 | kiến trúc 8→10, state-machine 5→10, route (B11–B13) |
| [02-service-layer.md](02-service-layer.md) | 2 | data layer 3→10 |
| [03-rbac.md](03-rbac.md) | 3 | bảo mật 4→9, route→role 1 nguồn (B14) |
| [04-testing.md](04-testing.md) | 4 | testing 2→10 |
| [05-e2e.md](05-e2e.md) | 5 | testing khoá 10 |
| [06-polish-docs.md](06-polish-docs.md) | 6 | UI 7→10, docs 6→10 |
| [07-core-components.md](07-core-components.md) | 7 | UI nhất quán 7→10 |
| [reference-state-machine.md](reference-state-machine.md) | ref | — |
| [reference-rbac-matrix.md](reference-rbac-matrix.md) | ref | — |
| [bug-list.md](bug-list.md) | 1, 3 | B1–B14 hợp nhất |

---

## Definition of Done (toàn dự án)

- [ ] `pnpm lint` — 0 warning (config đã `--max-warnings 0`).
- [ ] `pnpm typecheck` — 0 lỗi.
- [ ] `pnpm test` — pass, coverage ≥ 90% ở `src/lib`, `src/store`, `src/services`, ≥ 75% toàn repo.
- [ ] `pnpm test:e2e` — pass tất cả flow ở [05-e2e.md](05-e2e.md).
- [ ] `pnpm build` — pass.
- [ ] Không còn `useScoreStore` chứa dữ liệu nghiệp vụ (chỉ còn UI/session state).
- [ ] Không còn enum thô hiển thị cho người dùng (grep `{record.state}` = 0 hit trong JSX).
- [ ] `apiClient` được dùng thật qua `src/services/`.
- [ ] MSW bật ở dev + test; tắt được qua env cho BE thật.
- [ ] Mọi bug B1–B14 trong [bug-list.md](bug-list.md) đã fix (B14 sau khi chốt nghiệp vụ) + có test regression.
- [ ] Không core component chết (`ListDialog` đã xoá hoặc có usage); mọi pattern UI lặp ≥ 2 lần có core wrapper (xem [07-core-components.md](07-core-components.md)).
- [ ] `grep -rn "<Badge" src/features` chỉ còn badge trang trí; badge trạng thái đều qua core.
- [ ] Docs cập nhật: SAD, `docs/testing.md`, `docs/rbac-matrix.md`, ADR MSW.

---

## Quy ước git

- Branch: `refactor/phase-<n>-<slug>` (vd `refactor/phase-1-domain-logic`).
- 1 PR / phase. PR mô tả link tới file phase tương ứng + checklist nghiệm thu.
- Commit theo Conventional Commits, tiếng Việt phần mô tả OK (repo đang vậy).
  - `refactor(domain): chuyển transition logic vào lib/state-machine`
  - `test(rbac): phủ ma trận role×action×state`
  - `fix(countdown): ổn định dep của useCountdown`
- Không commit `dist/`, `test-results/`, `.tmp/`.

---

## Tech stack giữ nguyên

React 18, Vite 5, TS 5.5 strict, React Router 6, TanStack Table 8, Tailwind 3 + shadcn/base-ui pattern, Zustand 4, Recharts, Sonner, Zod, RHF.

**Thêm mới:** `msw` (đã có ở devDeps), `@tanstack/react-query` (đã có, sẽ bắt đầu dùng), `@faker-js/faker` (optional, cho seed).

**Cân nhắc bỏ nếu không dùng sau Phase 2:** không có — axios + react-query sẽ được dùng.
