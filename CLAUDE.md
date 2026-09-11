# CLAUDE.md — Hướng dẫn cho Claude (Kilo / Claude Code / …)

## ⚠️ QUY TẮC BẮT BUỘC — ĐỌC TRƯỚC KHI CODE

**Trước khi viết hoặc sửa BẤT KỲ code UI / màn hình / component nào, BẮT BUỘC đọc file đặc tả:**

```
docs/Plan_Component_Va_Giao_Dien.docx
```

Đây là nguồn sự thật duy nhất (source of truth) cho Design System, component và giao diện của hệ thống Phân Hệ Quản Lý Thi Đua. File này **thay thế toàn bộ các bản đặc tả trước đó**.

Cách đọc (docx là file zip, không đọc trực tiếp được):

```bash
python -c "
import zipfile, re, html
z = zipfile.ZipFile('docs/Plan_Component_Va_Giao_Dien.docx')
xml = z.read('word/document.xml').decode('utf-8')
xml = re.sub(r'</w:p>', '\n', xml)
print(html.unescape(re.sub(r'<[^>]+>', '', xml)))
"
```

(Windows PowerShell: dùng `workdir` = thư mục gốc dự án. Nếu có pandoc: `pandoc docs/Plan_Component_Va_Giao_Dien.docx -o plan.md`)

**Không được code layout, màu sắc, font, component dựa vào phỏng đoán.** Khi docx và code hiện tại mâu thuẫn → hỏi user, không tự quyết.

---

## TÓM TẮT QUY TẮC THIẾT KẾ (tra cứu nhanh — chi tiết trong docx)

### 1. Design tokens (Mục A2)

| Token | Hex | Dùng cho |
|---|---|---|
| `color-primary` | `#A8202C` | Header, Sidebar, nút hành động chính (Duyệt/Lưu/Gửi) |
| `color-primary-hover` | `#8C1A24` | Hover/active của primary |
| `color-accent` | `#E8B923` | "Đang chờ duyệt", viền nút hiện tại trên Stepper, nút "Công bố kết quả" |
| `color-bg` / `color-surface` | `#FFFFFF` | Nền content area, card/table/modal |
| `color-surface-muted` | `#FAF7F5` | Hover dòng bảng |
| `color-border` | `#E7E2DE` | Viền, chia cột |
| `color-text` | `#1F1B1A` | Văn bản chính |
| `color-text-muted` | `#71685F` | Văn bản phụ, placeholder |
| `color-danger` | `#8B2635` | **CHỈ** cho Lỗi/Xóa/Từ chối, luôn kèm icon cảnh báo |

- **KHÔNG bao giờ hoán đổi 2 tông đỏ**: primary `#A8202C` (đỏ cờ, sáng) ≠ danger `#8B2635` (đỏ-nâu thẫm). Khai báo riêng 2 biến trong theme, không dùng chung.
- Màu trạng thái hồ sơ: Nháp `#9CA3AF` · Chờ duyệt `#E8B923` · Yêu cầu chỉnh sửa `#D9773D` · Đã duyệt `#2E7D5B` · Đã công bố `#2D2A26` · Lỗi/Từ chối `#8B2635`.
- Chữ trên nền vàng: luôn `#1F1B1A`, **không** dùng chữ trắng trên nền vàng.
- Font duy nhất: **Be Vietnam Pro** (đã có `@fontsource/be-vietnam-pro`).

### 2. Typography & layout

- H1 24px/600 · H2 18px/600 · Body 14px/400 · Label 13px/500 · Caption 12px/400.
- **Không ALL-CAPS** cho nhãn/cột bảng; header cột dùng sentence case.
- Spacing bội 4px (4/8/12/16/24/32). Radius: Button/Input 6px — Card/Modal 10px — Badge 999px.
- Shadow chỉ cho Modal/Dropdown. Ngày giờ: `dd/mm/yyyy hh:mm`.
- Cột bảng: Text trái · Number/Điểm phải · Trạng thái giữa (Badge) · Hành động luôn cuối, bên phải.

### 3. Archetype — 5 mẫu layout (Mục A7)

Mọi màn hình trong docx đều gắn nhãn `[Archetype X]` — implement đúng mẫu đó, **không tự sáng tạo layout**:

1. **Danh sách** — page header + Filter bar chuẩn + DataGrid + Pagination (10 dòng/trang).
2. **Generic Approval Screen** — 3 lớp drill-down: DS địa phương → DS nhóm tiêu chí → chi tiết (Breadcrumb + Status Stepper + bảng chấm điểm + sticky footer action bar).
3. **Modal Form** — field bắt buộc ★ đặt trước; field điểm nhóm cạnh nhau; upload gần cuối; nút chính Primary bên phải footer.
4. **Lịch sử/Timeline** — chấm tròn màu theo loại hành động, câu mô tả chủ động ("X đã làm Y") + timestamp phải.
5. **Read-only Detail** — chỉ Xem, Badge lớn cho kết quả xếp loại.

### 4. Component (33 cái: 14 atom + 10 molecule + 9 organism)

- Xây đủ theo Phần A của docx trước/trong Sprint 1. Icons: `lucide-react`.
- Tái sử dụng bắt buộc (Mục C14): Generic Approval Screen cho C6/C8/C10; Modal "Yêu cầu chỉnh sửa/bổ sung" dùng chung; Timeline chung cho mọi màn lịch sử; Confirm dialog, DataGrid + Filter bar, Upload 20MB, Status Stepper (A4.9).
- Toast dùng `sonner`; form dùng `react-hook-form` + `zod`.

### 5. Nghiệp vụ — Nguyên tắc B0 (xuyên suốt)

- **Ai được sửa điểm trực tiếp**: chỉ Chuyên viên và Lãnh đạo ban. Hội đồng + Ủy ban KHÔNG sửa điểm.
- **"Yêu cầu chỉnh sửa/bổ sung" từ bất kỳ cấp nào đều đi tới Chuyên viên** — không cấp nào gửi thẳng Địa phương ngoại trừ Chuyên viên.
- Sau khi Địa phương sửa + Chuyên viên gửi lại → hồ sơ duyệt lại **từ đầu** toàn chuỗi.
- Transition `YeuCauChinhSua`: 1 target state (Chuyên viên); lưu nguồn gốc vào `LichSuThaoTac`.
- "Công bố kết quả" là nút **Accent vàng** + Confirm 2 bước (không thể hoàn tác) → `DaCongBo`, khóa vĩnh viễn.

### 6. Tech stack (theo package.json)

React 18 + Vite + TypeScript · Tailwind CSS v4 · react-router-dom · TanStack Query/Table · react-hook-form + zod · zustand · sonner · lucide-react · @base-ui/react.

### 7. Khi hoàn thành task

Chạy kiểm tra: `pnpm lint` → `pnpm typecheck` → `pnpm build`. UI phải khớp đúng Archetype + tokens của docx.
