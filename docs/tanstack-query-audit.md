# Kiểm tra TanStack Query v5 — 01/10/2026

## Phạm vi và phát hiện

Đã dùng CodeGraph và Serena để đọc cấu trúc/call site, sau đó đối chiếu trực tiếp source và AST TypeScript vì CodeGraph báo live-sync bị khóa. Không commit, push, sửa backend, đổi layout/màu sắc, hay mở lại các hành động duyệt đang comment.

Trước khi bắt đầu, worktree đã có thay đổi ở CriteriaChildrenPage, CriteriaListPage và PeriodManagementPage. Các thay đổi đó được giữ nguyên; báo cáo chỉ mô tả phần cache/refetch bổ sung.

QueryClient global đã có cấu hình phù hợp, nên giữ nguyên:
`staleTime: 120000`, `retry: 1`, `refetchOnWindowFocus: true`, `refetchOnReconnect: true`, `refetchOnMount: true`.
Không đổi global thành staleTime 0 vì sẽ làm các query refetch ngay mỗi lần quay lại. Không dùng focus "always" hoặc thêm polling.

Vấn đề chính trước sửa: key tách riêng theo tên màn hình cho cùng GET, một số staleTime 0 ghi đè mặc định, mutation chỉ invalidate một màn, và invalidate trước khi upload kết thúc. SSE chỉ cập nhật notification store, chưa cập nhật REST cache.

Số call site hiện tại từ AST (không tính tests và code comment; useQueries có thể tạo nhiều query theo số dòng):

| Call site | Ứng dụng | SDK generated |
| --- | ---: | ---: |
| `useQuery` | 88 | 68 |
| `useQueries` | 4 | 0 |
| `useInfiniteQuery` | 0 | 0 |
| `useMutation` | 27 | 47 |
| `invalidateQueries` | 3 | 0 |
| `refetchQueries` | 0 | 0 |
| `refetch` | 1 | 0 |
| `queryClients` | 1 | 0 |

SDK có 47 GET key factories được chuẩn hóa. 21 wrapper query legacy còn lại trong authentication/roles/permissions/user-roles/role-permissions được generate cho thao tác POST/PUT/DELETE, không được màn hình hiện tại sử dụng dưới dạng query. Không bật chúng hoặc đổi API ngoài phạm vi; khi tích hợp thêm cần dùng mutation cho các thao tác ghi, không gọi wrapper query legacy.

## Query keys

Tái sử dụng export factory `getGet...QueryKey` hiện có; không tạo một query-key factory song song. Orval dùng cùng `apiQueryKey` để lần generate tiếp theo giữ cấu trúc resource.

| Loại | Factory/base key | Feature cache |
| --- | --- | --- |
| Tài khoản list | `["users"]` | `["users", "data", { search, role, status, page, pageSize }]` |
| Tài khoản detail | `["users", id]` | `["users", id, "data"]` |
| Hồ sơ list | `["submissions"]` | `["submissions", "data", { view, stage, periodId, ... }]` |
| Hồ sơ detail | `["submissions", id]` | `["submissions", id, "data"]` |
| Hồ sơ của địa phương | `["submissions", "mine"]` | Thêm `"data"`, locality/params |
| Hồ sơ theo nhóm | `["submissions", "by-group", groupId]` | Thêm `"data"`, projection/params |
| Nhóm tiêu chí | `["criteria-groups"]`, `["criteria-groups", id]` | Thêm `"data"`, filter/list params nếu có |
| Kỳ dropdown | `["periods"]` | `["periods", "data", "options"]` dùng chung |
| Lịch sử duyệt | `["submissions", id, "approval-histories"]` | Thêm `"data"`, action/page/sort |
| Lịch sử điểm con | `["submission-results", id, "histories"]` | Thêm `"data"`, page/sort |
| File | `["files"]`, `["files", "batch"]` | Thêm `"data"`, entity/category/params |
| Kết quả công bố | `["result-publications", endpoint]` | Thêm `"data"`, kỳ/locality |
| Ban/cụm/kỳ | `["departments"]`, `["clusters"]`, `["periods"]` | List/detail/lookup dưới cùng resource prefix |

`"data"` là dấu phân biệt cần thiết: generated queryFn trả response envelope, feature API trả dữ liệu đã unwrap. Không gộp hai response shape vào một cache key. Các query có cùng fetcher/shape dùng chung key, ví dụ criteria list của specialist/approval/results, submission detail, approval history, period options và department lookup. Các projection/filter khác nhau vẫn có variant riêng. Không có resource orders trong project nên không tạo key giả.

Cụm có hai view: list gốc và list được bổ sung wards. View bổ sung dùng `fetchQuery` với cùng key list/detail của trang quản lý để dedup GET và tái sử dụng detail đã cache, không trộn shape vào list gốc.

## Mutation → cache cần cập nhật

`invalidateQueryResources` dùng một predicate cho tập resource. Một query trùng cả list prefix và detail prefix chỉ bị invalidate/refetch một lần trong thao tác đó. Query active được refetch; query inactive được đánh stale và chỉ fetch khi dùng lại.

Nếu GET cũ đang chạy, helper đợi nó kết thúc rồi invalidate/refetch một lần, dùng cancelRefetch false để không khởi động hai request HTTP chồng nhau. Kiểm tra runtime với promise trì hoãn đã xác nhận cache cuối cùng là response sau mutation, không phải response cũ.

| Thao tác | Resource cập nhật |
| --- | --- |
| Tạo/sửa/xóa tài khoản | users, departments/members/counts, audit-logs |
| Reset mật khẩu admin | users, audit-logs |
| Tạo/sửa/xóa ban | departments; đổi tên/xóa cập nhật thêm criteria-groups/submissions có tên ban nhúng |
| Thêm/gỡ thành viên ban | departments, users, audit-logs |
| Tạo/sửa/xóa/gán/gỡ xã thuộc cụm | clusters (list/detail/available-wards/with-wards), audit-logs |
| Tạo/sửa/xóa kỳ | periods (list/detail/options), audit-logs |
| Tạo/sửa/xóa nhóm tiêu chí | criteria-groups, submissions, departments/counts, audit-logs |
| Thêm/sửa/xóa tiêu chí con | criteria-groups, criteria, submissions, submission-results/histories, audit-logs |
| Áp dụng nhóm và upload quyết định | criteria-groups, submissions, files, audit-logs; departments/counts ở list |
| Lưu nháp/nộp hồ sơ địa phương | submissions/mine/detail/group views, submission-results/histories, files |
| Lưu điểm/chuyển/yêu cầu chỉnh sửa | submissions/detail/history/group/summary views, submission-results/histories, files theo thao tác |
| Thêm tiêu chí bổ sung | submission resources/files và criteria-groups |
| Upload/xóa file đính kèm | files; criteria-groups hoặc submissions/submission-results theo entity |
| Công bố kết quả | result-publications (overview/preview/local/groups), submissions, criteria-groups |
| Sửa profile | setQueryData profile từ response PUT; invalidate users, không GET profile lại |

Mutation nhiều bước đợi upload xong rồi invalidate. Nếu cập nhật server thành công nhưng bước sau thất bại, cache vẫn được làm mới cho phần đã thành công. Upload batch không refresh từng file riêng.

Các GET trước áp dụng/sửa tiêu chí để kiểm tra tổng điểm mới nhất vẫn giữ: chuyển sang `fetchQuery` cùng detail key, staleTime 0 chỉ ở preflight nghiệp vụ đó. Đây không phải GET thủ công sau mutation. Nút Thử lại trong chi tiết bảng tổng hợp vẫn dùng `refetch()` theo hành động người dùng.

## Khi nào refetch

| Trigger | Hành vi |
| --- | --- |
| Quay lại window/tab | Query active/enabled stale (quá 2 phút hoặc bị invalidate) mới refetch; fresh dùng cache |
| Kết nối mạng trở lại | Query active/enabled stale refetch; tiếp tục request bị pause theo TanStack |
| Mount lại page/modal | Query enabled chưa có dữ liệu hoặc stale fetch; cache fresh không fetch |
| Mutation thành công | Invalidate resource liên quan một lần; active refetch ngay, inactive stale |
| SSE event | Parse data.eventType, gom burst 250ms và invalidate resource liên quan; không ghi payload SSE thành dữ liệu REST |
| SSE reconnect sau đứt stream | Reconcile các domain có thể bỏ lỡ event; initial connect không refresh lại dữ liệu trang |

Đúng theo cơ chế stale/refetch của [TanStack Query v5](https://tanstack.com/query/v5/docs/framework/react/guides/important-defaults); prefix invalidation theo [QueryClient API](https://tanstack.com/query/v5/docs/reference/QueryClient).

Ngoại lệ có chủ ý: ProfileGate khởi tạo session giữ staleTime Infinity và tắt enabled sau khi đã xác định hồ sơ; trang Tài khoản dùng policy 2 phút bình thường. Query trong dialog đóng hoặc thiếu id không gọi API. GET ký URL xem/tải file theo click và luồng notification store hiện có không bị đổi thành polling/cache dài hạn.

SSE hiện có trong backend (không có WebSocket cần tích hợp):
- criteria_added/updated/disabled, criteria_group_applied/updated, supplementary_criteria_added → criteria/group/submission/history.
- revision_requested, specialist_review_requested, reviewer_revision_requested, scorer_revision_requested → submission/history/file.
- result_published → publication/submission/group.
- submission_reminder/unknown/malformed → chỉ notification cache, không tải lại business tables.

SSE bỏ qua ID replay trong một kết nối/session hook, hủy timer và stream lúc unmount, reset frame buffer khi reconnect. Nếu GET liên quan đang chạy trước event, đợi request đó kết thúc rồi refresh; tránh hai GET chồng nhau và không để response cũ nuốt mất invalidation. Không dùng refetchQueries.

Refetch không được xóa draft đang sửa: profile form chỉ reset khi pristine; modal điểm reset khi mở/chọn tiêu chí khác; các field địa phương chưa sửa cập nhật từ server, field đang sửa và file đang chọn được giữ. Quyền/giới hạn điểm vẫn lấy từ dữ liệu server mới.

## Kiểm chứng

- TypeScript toàn project: PASS qua Node 16 có sẵn, chạy đúng `tsc --noEmit -p tsconfig.json`.
- ESLint toàn project: PASS qua Node 16, dùng config hiện có `.eslintrc.cjs`, report-unused-disable-directives và max-warnings 0.
- git diff --check: PASS; chỉ có cảnh báo chuyển LF/CRLF của Git.
- Runtime isolated: PASS: real TanStack key factories, overlap invalidation, stale/fresh focus+reconnect+mount, SSE event mapping+burst+cleanup (no HTTP).
- Đã thêm Vitest regression tests cho defaults/keys/lifecycle/invalidation, event mapping/burst/in-flight/cleanup, SSE hook và modal giữ draft.
- Chưa chạy được Vitest/full build: pnpm và Node 22/24 hiện lỗi native `ncrypto::CSPRNG(nullptr, 0)` trước khi chạy JS. Node 16 chạy TS/lint/helper checks nhưng thiếu crypto.getRandomValues cho Vite 5/Vitest và thiếu node:util.styleText cho Vite 8/Rolldown. Không thay runtime global, sửa cấu hình bảo mật hoặc cài package để lách lỗi. Do đó chưa xác nhận production bundle hoặc browser integration.

Có thể chạy lại khi Node tương thích hoạt động:

```powershell
pnpm lint
pnpm typecheck
pnpm test -- src/api/mutator/query-client.test.ts src/api/mutator/query-keys.test.ts src/hooks/sse-query-invalidation.test.ts src/hooks/useSseNotifications.test.tsx src/features/workflow/components/ReviewScoreModal.test.tsx
pnpm build
```

## File thay đổi (62)

- `docs/tanstack-query-audit.md`
- `orval.config.ts`
- `src/App.tsx`
- `src/api/endpoints/approval.ts`
- `src/api/endpoints/audit-logs.ts`
- `src/api/endpoints/auth.ts`
- `src/api/endpoints/authentication.ts`
- `src/api/endpoints/criteria-groups.ts`
- `src/api/endpoints/criteria.ts`
- `src/api/endpoints/departments.ts`
- `src/api/endpoints/emulation-classifications.ts`
- `src/api/endpoints/external-data.ts`
- `src/api/endpoints/files.ts`
- `src/api/endpoints/health.ts`
- `src/api/endpoints/local-result-publications.ts`
- `src/api/endpoints/notifications.ts`
- `src/api/endpoints/periods.ts`
- `src/api/endpoints/permissions.ts`
- `src/api/endpoints/result-publications.ts`
- `src/api/endpoints/role-permissions.ts`
- `src/api/endpoints/roles.ts`
- `src/api/endpoints/submissions.ts`
- `src/api/endpoints/user-roles.ts`
- `src/api/endpoints/users.ts`
- `src/api/mutator/query-keys.test.ts`
- `src/api/mutator/query-keys.ts`
- `src/components/core/FileAttachmentList.tsx`
- `src/features/admin/pages/ClusterManagementPage.tsx`
- `src/features/admin/pages/CriteriaChildrenPage.tsx`
- `src/features/admin/pages/CriteriaListPage.tsx`
- `src/features/admin/pages/CriteriaPeriodSelectionPage.tsx`
- `src/features/admin/pages/DepartmentManagementPage.tsx`
- `src/features/admin/pages/PeriodManagementPage.tsx`
- `src/features/admin/pages/UserManagementPage.tsx`
- `src/features/audit/AuditLogPage.tsx`
- `src/features/auth/AccountPage.tsx`
- `src/features/auth/ProfileCompletionPage.tsx`
- `src/features/cham-diem/pages/ScoreByCriteriaPage.tsx`
- `src/features/cham-diem/pages/SpecialistReviewPage.tsx`
- `src/features/cham-diem/pages/SpecialistScoreSummaryPage.tsx`
- `src/features/dia-phuong/components/LocalityCriteriaHistoryDialog.tsx`
- `src/features/dia-phuong/pages/KetQuaPage.tsx`
- `src/features/dia-phuong/pages/LocalityCriteriaPage.tsx`
- `src/features/dia-phuong/pages/LocalityResultsPage.tsx`
- `src/features/duyet/components/ResultPublicationDialog.tsx`
- `src/features/duyet/pages/BanLeaderApprovalPage.tsx`
- `src/features/duyet/pages/BanLeaderCriteriaGroupsPage.tsx`
- `src/features/duyet/pages/BanLeaderReviewDetailPage.tsx`
- `src/features/duyet/pages/CommitteeApprovalPage.tsx`
- `src/features/duyet/pages/CommitteeCriteriaGroupsPage.tsx`
- `src/features/duyet/pages/CouncilApprovalPage.tsx`
- `src/features/duyet/pages/CouncilCriteriaGroupsPage.tsx`
- `src/features/duyet/pages/ReadOnlyApprovalDetailPage.tsx`
- `src/features/duyet/pages/ResultPublicationPage.tsx`
- `src/features/workflow/components/LocalityScoreTable.tsx`
- `src/features/workflow/components/OfficialScoreRevisionDialog.tsx`
- `src/features/workflow/components/ReviewScoreModal.test.tsx`
- `src/features/workflow/components/ReviewScoreModal.tsx`
- `src/hooks/sse-query-invalidation.test.ts`
- `src/hooks/sse-query-invalidation.ts`
- `src/hooks/useSseNotifications.test.tsx`
- `src/hooks/useSseNotifications.ts`

## Call site ứng dụng đã đối chiếu

Line numbers tại thời điểm audit; generated hooks nằm trong các file endpoint liệt kê ở trên.

| File | Call site (dòng) |
| --- | --- |
| `src/api/mutator/query-client.ts` | `queryClients`: 6 |
| `src/api/mutator/query-keys.ts` | `invalidateQueries`: 26 |
| `src/App.tsx` | `useQuery`: 120 |
| `src/components/core/FileAttachmentList.tsx` | `useQuery`: 69 |
| `src/features/admin/pages/ClusterManagementPage.tsx` | `useQuery`: 35, 47 · `useMutation`: 58, 80, 91, 102, 114 |
| `src/features/admin/pages/CriteriaChildrenPage.tsx` | `useQuery`: 87, 89 · `useMutation`: 103 |
| `src/features/admin/pages/CriteriaListPage.tsx` | `useQuery`: 106, 117, 123 · `useMutation`: 180 |
| `src/features/admin/pages/CriteriaPeriodSelectionPage.tsx` | `useQuery`: 26 |
| `src/features/admin/pages/DepartmentManagementPage.tsx` | `useQuery`: 74, 80, 86 · `useMutation`: 109, 119, 128, 138, 149 |
| `src/features/admin/pages/PeriodManagementPage.tsx` | `useQuery`: 54 · `useMutation`: 77, 87, 99 |
| `src/features/admin/pages/UserManagementPage.tsx` | `useQuery`: 138, 157 · `useMutation`: 168, 169, 170, 171 |
| `src/features/audit/AuditLogPage.tsx` | `useQuery`: 664, 684 |
| `src/features/auth/AccountPage.tsx` | `useQuery`: 71 · `invalidateQueries`: 94 |
| `src/features/auth/ChangePasswordPage.tsx` | `useMutation`: 53 |
| `src/features/auth/ForgotPasswordDialog.tsx` | `useMutation`: 41, 45 |
| `src/features/auth/ProfileCompletionPage.tsx` | `useQuery`: 48 · `invalidateQueries`: 93 |
| `src/features/cham-diem/pages/ScoreByCriteriaPage.tsx` | `useQuery`: 67, 72, 78 |
| `src/features/cham-diem/pages/SpecialistReviewPage.tsx` | `useQuery`: 658, 725, 808, 1503, 1508, 1519, 1523, 1601, 1607, 1612, 1617, 1628 · `useQueries`: 814 |
| `src/features/cham-diem/pages/SpecialistScoreSummaryPage.tsx` | `useQuery`: 212, 439, 444, 448 · `refetch`: 253 |
| `src/features/dia-phuong/components/LocalityCriteriaHistoryDialog.tsx` | `useQuery`: 182, 235, 243 |
| `src/features/dia-phuong/pages/KetQuaPage.tsx` | `useQuery`: 71, 72 · `useQueries`: 77 |
| `src/features/dia-phuong/pages/LocalityCriteriaPage.tsx` | `useQuery`: 225, 231, 244, 378, 384, 396, 473 · `useQueries`: 268 · `useMutation`: 601, 606, 617 |
| `src/features/dia-phuong/pages/LocalityResultsPage.tsx` | `useQuery`: 232, 261, 266, 271, 307, 314, 319 · `useQueries`: 326 |
| `src/features/duyet/components/ResultPublicationDialog.tsx` | `useQuery`: 59, 74, 79 · `useMutation`: 107 |
| `src/features/duyet/pages/BanLeaderApprovalPage.tsx` | `useQuery`: 94, 99 |
| `src/features/duyet/pages/BanLeaderCriteriaGroupsPage.tsx` | `useQuery`: 58, 62 |
| `src/features/duyet/pages/BanLeaderReviewDetailPage.tsx` | `useQuery`: 107, 112, 120, 126, 131 |
| `src/features/duyet/pages/CommitteeApprovalPage.tsx` | `useQuery`: 126, 131 |
| `src/features/duyet/pages/CommitteeCriteriaGroupsPage.tsx` | `useQuery`: 56, 57 |
| `src/features/duyet/pages/CouncilApprovalPage.tsx` | `useQuery`: 100, 105 |
| `src/features/duyet/pages/CouncilCriteriaGroupsPage.tsx` | `useQuery`: 53, 57 |
| `src/features/duyet/pages/ReadOnlyApprovalDetailPage.tsx` | `useQuery`: 71, 72, 73, 74, 79, 86 |
| `src/features/duyet/pages/ResultPublicationPage.tsx` | `useQuery`: 47, 60, 65 · `useMutation`: 76 |
| `src/features/workflow/components/OfficialScoreRevisionDialog.tsx` | `useQuery`: 19 |

