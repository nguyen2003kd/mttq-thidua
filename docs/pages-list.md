# Danh sách trang — Thi đua Khen thưởng MTTQ

Tổng cộng: **16 trang** (đang là placeholder, cần thiết kế UI)

---

## 1. Auth — 1 trang

| # | Trang | Route | File | Mô tả |
|---|---|---|---|---|
| 1 | LoginPage | `/login` | `src/features/auth/LoginPage.tsx` | Đăng nhập split-screen: logo MTTQ bên trái, form username/password bên phải |

---

## 2. Admin — 5 trang

| # | Trang | Route | File | Mô tả |
|---|---|---|---|---|
| 2 | AdminDashboardPage | `/thi-dua/admin/dashboard` | `src/features/admin/pages/AdminDashboardPage.tsx` | Dashboard admin: thống kê bảng tiêu chí, địa phương, tiến độ chấm điểm |
| 3 | CriteriaListPage | `/thi-dua/admin/bang-tieu-chi` | `src/features/admin/pages/CriteriaListPage.tsx` | DataTable danh sách bảng tiêu chí + trạng thái, nút tạo mới |
| 4 | CriteriaFormPage | `/thi-dua/admin/bang-tieu-chi/:id` | `src/features/admin/pages/CriteriaFormPage.tsx` | Form builder: tạo/sửa tiêu chí, thêm/xóa dòng, set maxScore |
| 5 | AssignLocalityPage | `/thi-dua/admin/bang-tieu-chi/:id/gan-dia-phuong` | `src/features/admin/pages/AssignLocalityPage.tsx` | Gán bảng tiêu chí cho địa phương, multi-select checkbox |
| 6 | DeadlineConfigPage | `/thi-dua/admin/cau-hinh-thoi-han` | `src/features/admin/pages/DeadlineConfigPage.tsx` | Cấu hình thời hạn nộp/chấm/duyệt + nhắc nhở |

---

## 3. Địa phương — 3 trang

| # | Trang | Route | File | Mô tả |
|---|---|---|---|---|
| 7 | TrangThaiPage | `/thi-dua/dia-phuong/trang-thai` | `src/features/dia-phuong/pages/TrangThaiPage.tsx` | Timeline 3 bước trạng thái (Nháp → Chờ duyệt → Công bố), mobile-first |
| 8 | MinhChungPage | `/thi-dua/dia-phuong/minh-chung` | `src/features/dia-phuong/pages/MinhChungPage.tsx` | Upload minh chứng theo tiêu chí, drag-drop, preview file |
| 9 | KetQuaPage | `/thi-dua/dia-phuong/ket-qua/:nam` | `src/features/dia-phuong/pages/KetQuaPage.tsx` | Breakdown điểm theo tiêu chí + lịch sử thay đổi (AuditTimeline) |

---

## 4. Chấm điểm — 2 trang

| # | Trang | Route | File | Mô tả |
|---|---|---|---|---|
| 10 | ScoreByCriteriaPage | `/thi-dua/cham-diem/theo-tieu-chi/:id` | `src/features/cham-diem/pages/ScoreByCriteriaPage.tsx` | Grid chấm điểm inline: địa phương × tiêu chí, input số, auto-save |
| 11 | ScoreByLocalityPage | `/thi-dua/cham-diem/theo-dia-phuong/:id` | `src/features/cham-diem/pages/ScoreByLocalityPage.tsx` | Chấm điểm 1 địa phương qua tất cả tiêu chí, lý do sửa điểm bắt buộc |

---

## 5. Duyệt — 3 trang

| # | Trang | Route | File | Role | Mô tả |
|---|---|---|---|---|---|
| 12 | BanLeaderApprovalPage | `/thi-dua/duyet/lanh-dao-ban/:banId` | `src/features/duyet/pages/BanLeaderApprovalPage.tsx` | BAN_LEADER | Bảng duyệt + diff modal (điểm cũ → mới), approve/reject + lý do |
| 13 | CouncilApprovalPage | `/thi-dua/duyet/hoi-dong-tdkt` | `src/features/duyet/pages/CouncilApprovalPage.tsx` | COUNCIL_CHAIR / COUNCIL_VICE | Duyệt tổng hợp từ Ban, xem breakdown, approve/reject |
| 14 | StandingCommitteePage | `/thi-dua/duyet/ban-thuong-truc` | `src/features/duyet/pages/StandingCommitteePage.tsx` | STANDING_COMMITTEE | 2-step publish: nhập "CÔNG BỐ" + upload file quyết định |

---

## 6. Dashboard & Audit — 2 trang

| # | Trang | Route | File | Mô tả |
|---|---|---|---|---|
| 15 | OverviewDashboardPage | `/thi-dua/dashboard-tong-quan` | `src/features/dashboard/pages/OverviewDashboardPage.tsx` | Charts tình trạng địa phương, bảng xếp hạng, countdown banner |
| 16 | AuditLogPage | `/thi-dua/lich-su-thay-doi/:diaPhuongId` | `src/features/audit/AuditLogPage.tsx` | AuditTimeline đầy đủ, filter theo action/actor/date |

---

## Thứ tự ưu tiên thiết kế

1. **LoginPage** — entry point, ấn tượng đầu tiên
2. **TrangThaiPage** — trang chính của địa phương, mobile-first
3. **KetQuaPage** — xem kết quả + audit timeline
4. **CriteriaListPage** — DataTable đầu tiên, template cho các list page khác
5. **ScoreByCriteriaPage** — grid chấm điểm, phức tạp nhất
6. **BanLeaderApprovalPage** — flow duyệt + diff modal
7. **OverviewDashboardPage** — charts + ranking + countdown
8. **StandingCommitteePage** — 2-step publish confirm
9. **MinhChungPage** — upload drag-drop
10. **CriteriaFormPage** — form builder
11. **AssignLocalityPage** — multi-select
12. **DeadlineConfigPage** — cấu hình thời hạn
13. **ScoreByLocalityPage** — chấm điểm 1 địa phương
14. **CouncilApprovalPage** — duyệt hội đồng
15. **AdminDashboardPage** — dashboard admin
16. **AuditLogPage** — audit log chi tiết
