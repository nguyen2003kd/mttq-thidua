# Solutions Architecture Document — FE Module Thi đua Khen thưởng

> **Deadline:** Hoàn thành trong tháng 11/2026 (60 ngày kể từ 03/09/2026)
> **Ngày tạo:** 03/09/2026
> **Trạng thái:** Draft — chờ MTTQ chốt các Open Questions (mục 9)

---

## Mục lục

1. [Bối cảnh & Mục tiêu](#1-bối-cảnh--mục-tiêu)
2. [Actor Matrix](#2-actor-matrix)
3. [Kiến trúc thông tin (IA)](#3-kiến-trúc-thông-tin-ia)
4. [Luồng nghiệp vụ chính → FE flow](#4-luồng-nghiệp-vụ-chính--fe-flow)
5. [Danh sách màn hình chi tiết](#5-danh-sách-màn-hình-chi-tiết)
6. [State Machine](#6-state-machine)
7. [Kiến trúc FE & Tech stack](#7-kiến-trúc-fe--tech-stack)
8. [API Contract giả định](#8-api-contract-giả-định)
9. [Open Questions & Rủi ro](#9-open-questions--rủi-ro)
10. [Cấu trúc dự án](#10-cấu-trúc-dự-án)
11. [Roadmap triển khai 60 ngày](#11-roadmap-triển-khai-60-ngày)
12. [Chiến lược test](#12-chiến-lược-test)

---

## 1. Bối cảnh & Mục tiêu

Module cho phép Thành phố (MTTQ) chấm điểm thi đua cho 95 xã/phường, đi qua 4 tầng duyệt nội bộ (Chuyên viên → Lãnh đạo Ban → Hội đồng thi đua khen thưởng → Ban thường trực) trước khi công bố kết quả ra địa phương.

### Đặc điểm nghiệp vụ chi phối kiến trúc FE

| Đặc điểm | Tác động kiến trúc |
|---|---|
| Workflow đa cấp, một chiều (draft → duyệt → công bố), sau công bố khóa cứng | State machine ở FE + RBAC route guard; disable tất cả input khi `DA_CONG_BO` |
| Audit log bắt buộc cho mọi thay đổi điểm (before/after + lý do) | Component `AuditTimeline` dùng chung, query theo `localityId` / `scoreId` |
| Hai chế độ hiển thị khác nhau: nội bộ TP (full) vs địa phương (3 trạng thái) | Role-based rendering, 2 layout root: `AppInternal` và `AppLocality` |
| Time-boxing tiêu chí (mở/đóng theo ngày) + nhắc hạn | UI đếm ngược (`useCountdown` hook), config linh hoạt |

---

## 2. Actor Matrix

| Vai trò | Số TK | Phạm vi thấy | Hành động chính | Ghi chú FE |
|---|---|---|---|---|
| Admin tiêu chí | 1 | Toàn bộ bộ tiêu chí, toàn bộ địa phương | Tạo/sửa bảng tiêu chí, gán tiêu chí, cấu hình thời hạn, nhắc hạn | Màn hình phức tạp nhất: form builder cho bảng điểm |
| Địa phương (xã/phường) | 95 | Chỉ dữ liệu của chính họ | Nộp minh chứng (optional), xem trạng thái, xem kết quả + lý do | Giao diện tối giản, mobile-friendly, 3 trạng thái |
| Chuyên viên | N (theo Ban) | Toàn bộ địa phương, theo tiêu chí phân công | Chấm điểm từng tiêu chí, ghi chú lý do | Grid chấm điểm dạng grid, nhập nhanh |
| Lãnh đạo Ban (Trưởng/Phó) | 2/ban | Kết quả tổng hợp của Ban mình | Duyệt hoặc trả lại kèm lý do | Trưởng ban mới có quyền duyệt cuối ở cấp Ban |
| Hội đồng TĐKT (Chủ tịch/Phó CT) | 2 | Kết quả sau khi các Ban thống nhất | Duyệt/sửa; chỉ Chủ tịch được duyệt final | UI chỉ Chủ tịch mới thấy nút "Duyệt" |
| Ban thường trực (Chủ tịch) | 1 | Toàn bộ, bước cuối | Sửa lần cuối → Công bố (khóa) | Nút "Công bố" cần modal xác nhận 2 bước |

### Nguyên tắc thiết kế quyền

- **RBAC theo role + scope** (ban/địa phương)
- Mọi nút hành động (duyệt / sửa / công bố) phải check quyền ở **cả FE** (ẩn/hiện) **lẫn BE** (không tin tưởng FE-only)
- Route guard chặn truy cập trái quyền ngay ở route level
- Component-level guard: `<Can role="..." action="...">` wrapper

---

## 3. Kiến trúc thông tin (IA) theo vai trò

```
/thi-dua
├── /admin                              (Admin tiêu chí)
│   ├── /bang-tieu-chi                  — danh sách + tạo/sửa bảng điểm
│   ├── /bang-tieu-chi/:id/gan-dia-phuong
│   ├── /cau-hinh-thoi-han              — mở/đóng, nhắc hạn
│   └── /dashboard                      — tổng quan toàn thành phố
│
├── /dia-phuong                         (view của 95 xã/phường)
│   ├── /minh-chung                     — nộp minh chứng theo tiêu chí
│   ├── /trang-thai                     — Đã nộp / Đang xử lý / Công bố
│   └── /ket-qua/:nam                   — điểm + lý do thay đổi + file quyết định
│
├── /cham-diem                          (Chuyên viên)
│   ├── /theo-tieu-chi/:id
│   └── /theo-dia-phuong/:id
│
├── /duyet                              (Duyệt — 3 cấp)
│   ├── /lanh-dao-ban/:banId
│   ├── /hoi-dong-tdkt
│   └── /ban-thuong-truc
│
├── /lich-su-thay-doi/:diaPhuongId      (audit log — dùng chung, khác quyền xem)
│
└── /dashboard-tong-quan                (toàn cảnh, filter theo ban/địa phương/tiêu chí)
```

### Route guard matrix

| Route prefix | Role được phép | Redirect nếu không có quyền |
|---|---|---|
| `/thi-dua/admin/*` | `ADMIN` | `/thi-dua/dashboard-tong-quan` |
| `/thi-dua/dia-phuong/*` | `LOCALITY` | `/thi-dua/trang-thai` |
| `/thi-dua/cham-diem/*` | `SPECIALIST` | `/thi-dua/dashboard-tong-quan` |
| `/thi-dua/duyet/lanh-dao-ban/*` | `BAN_LEADER` | `/thi-dua/dashboard-tong-quan` |
| `/thi-dua/duyet/hoi-dong-tdkt` | `COUNCIL_CHAIR`, `COUNCIL_VICE` | `/thi-dua/dashboard-tong-quan` |
| `/thi-dua/duyet/ban-thuong-truc` | `STANDING_COMMITTEE` | `/thi-dua/dashboard-tong-quan` |
| `/thi-dua/dashboard-tong-quan` | Tất cả role nội bộ | — |
| `/thi-dua/lich-su-thay-doi/*` | Tất cả (render khác theo role) | — |

---

## 4. Luồng nghiệp vụ chính → FE flow

### 4.1 Luồng chấm điểm — công bố

```
[Chuyên viên chấm điểm]
        │  (mỗi thay đổi điểm bắt buộc nhập lý do nếu sửa lại)
        ▼
[4 Ban họp thống nhất] → kết quả gộp
        │
        ▼
[Lãnh đạo Ban duyệt] ──(trả lại + lý do)──▶ quay lại Chuyên viên
        │ (duyệt)
        ▼
[Hội đồng TĐKT — Chủ tịch duyệt]
        │
        ▼
[Ban thường trực — sửa lần cuối]
        │
        ▼
   [CÔNG BỐ] ──► khóa vĩnh viễn, đẩy kết quả về 95 địa phương
```

#### FE xử lý cho mỗi mũi tên "duyệt"

1. **Modal xác nhận** hiển thị diff (điểm cũ vs điểm mới nếu có sửa) trước khi submit
2. **Trạng thái loading** + optimistic lock (chặn 2 người duyệt cùng lúc → toast "đã được xử lý bởi X")
3. **Invalidation cache** React Query sau khi duyệt thành công (invalidate `scores`, `results`, `audit-log`)
4. **Audit log** tự động ghi qua BE (FE không tự ghi log)

### 4.2 Luồng phía địa phương (đơn giản hóa)

```
Đã nộp → Đang xử lý → Công bố
```

- Sau "Công bố": mở khóa xem điểm cuối + lịch sử lý do thay đổi + tải file quyết định công nhận (PDF)
- FE mapping trạng thái:

| BE state | FE display (địa phương) |
|---|---|
| Chưa có bản ghi + đã nộp minh chứng | "Đã nộp" |
| `DRAFT`, `CHO_DUYET_BAN`, `CHO_DUYET_HOI_DONG`, `CHO_DUYET_BTT` | "Đang xử lý" |
| `DA_CONG_BO` | "Công bố" |

---

## 5. Danh sách màn hình chi tiết

### 5.1 Admin — Quản lý bảng tiêu chí

**Bảng tiêu chí (list):**
- Columns: tên bảng, tổng điểm, số tiêu chí con, trạng thái (nháp/đang áp dụng/hết hạn), số địa phương đã gán
- Actions: tạo mới, sửa, xóa (chỉ khi nháp), gán địa phương

**Form tạo/sửa bảng:**
- Dynamic form — thêm/xóa dòng tiêu chí con, mỗi dòng có điểm số
- Validate real-time: tổng điểm con ≤ tổng điểm bảng
- UI: thanh progress "Đã dùng 8.5/10 điểm"
- Tech: React Hook Form `useFieldArray` + Zod schema

**Gán địa phương:**
- Multi-select checkbox 95 xã/phường
- Search, chọn theo quận/huyện, "chọn tất cả"
- Component: `LocalityMultiSelect` (virtualized list nếu cần)

**Cấu hình thời hạn:**
- Date-range picker (ngày mở – ngày đóng)
- Toggle "tự ẩn khi hết hạn"
- ⚠️ Chờ MTTQ confirm cơ chế (xem mục 9)

**Cấu hình nhắc hạn:**
- Input số ngày trước hạn để gửi thông báo
- ⚠️ Chờ MTTQ cung cấp số ngày cụ thể

### 5.2 Chuyên viên — Chấm điểm

**Grid chấm điểm:**
- Hàng = địa phương, cột = tiêu chí
- Ô nhập điểm inline (Tab/Enter để navigate)
- Click vào ô → side panel xem minh chứng (nếu có)
- Badge "Minh chứng: có/không" — không block submit
- Khi sửa điểm đã chấm → modal nhập lý do thay đổi (required)
- Filter theo Ban / theo tiêu chí được phân công
- Tech: TanStack Table với inline edit, hoặc AG Grid nếu cần hiệu năng cao

### 5.3 Duyệt (Lãnh đạo Ban / Hội đồng / Ban thường trực)

**Bảng tổng hợp kết quả:**
- Hàng = địa phương, có thể expand xem chi tiết từng tiêu chí
- Nút Duyệt / Trả lại (kèm lý do — required textarea)
- Riêng Ban thường trực: nút Công bố — 2-step confirm
- Upload file quyết định công nhận (PDF) đính kèm khi công bố

**2-step confirm cho Công bố:**
```
Step 1: Modal "Bạn có chắc chắn?"
        → [Hủy] [Tiếp tục]
Step 2: Modal "Sau khi công bố sẽ KHÔNG THỂ chỉnh sửa. Nhập 'CÔNG BỐ' để xác nhận."
        → Text input phải khớp "CÔNG BỐ"
        → [Hủy] [Công bố]
```

### 5.4 Địa phương

**Trang trạng thái:**
- Timeline 3 bước (Đã nộp → Đang xử lý → Công bố)
- Mobile-first, responsive
- Component: `StatusTimeline` (3 step, current step highlighted)

**Nộp minh chứng:**
- Upload file theo từng tiêu chí (optional)
- Hiển thị rõ "Không bắt buộc"
- Drag & drop + click to upload
- Preview file đã upload, có nút xóa/thay thế

**Trang kết quả (sau công bố):**
- Điểm tổng + breakdown theo tiêu chí
- Lịch sử thay đổi điểm + lý do (filter chỉ log liên quan đến điểm của họ)
- Nút tải file quyết định (PDF)

### 5.5 Dashboard tổng quan

- Biểu đồ: % địa phương đã nộp / đang xử lý / đã công bố (donut chart)
- Bảng xếp hạng điểm theo địa phương (sortable)
- Bộ đếm ngày còn lại tới hạn nộp / hạn công bố (`useCountdown`)
- Filter theo Ban, theo bộ tiêu chí, theo thời gian
- Tech: Recharts hoặc Chart.js cho biểu đồ

### 5.6 Lịch sử thay đổi (Audit Log) — component dùng chung

**Timeline:**
- Thời gian, người thực hiện, hành động (chấm/sửa/duyệt/trả lại), điểm trước → sau, lý do
- Component: `AuditTimeline` — nhận `localityId` + role context

**Quyền xem khác nhau:**
- Nội bộ Thành phố: thấy full log (ai duyệt, ai chấm, lý do nội bộ)
- Địa phương: chỉ thấy log liên quan đến điểm của họ (không thấy nội bộ ai duyệt ai)

---

## 6. State Machine

```
DRAFT ──(chuyên viên nộp)──▶ CHO_DUYET_BAN
CHO_DUYET_BAN ──(LĐ Ban duyệt)──▶ CHO_DUYET_HOI_DONG
CHO_DUYET_BAN ──(trả lại)──▶ DRAFT
CHO_DUYET_HOI_DONG ──(CT Hội đồng duyệt)──▶ CHO_DUYET_BTT
CHO_DUYET_HOI_DONG ──(trả lại)──▶ CHO_DUYET_BAN
CHO_DUYET_BTT ──(công bố)──▶ DA_CONG_BO  [FINAL — không có transition ra khỏi trạng thái này]
```

### FE state mapping

```typescript
type ScoreState = 'DRAFT' | 'CHO_DUYET_BAN' | 'CHO_DUYET_HOI_DONG' | 'CHO_DUYET_BTT' | 'DA_CONG_BO';

// Mapping cho địa phương
const localityStatusMap: Record<ScoreState | 'SUBMITTED', string> = {
  SUBMITTED: 'Đã nộp',
  DRAFT: 'Đang xử lý',
  CHO_DUYET_BAN: 'Đang xử lý',
  CHO_DUYET_HOI_DONG: 'Đang xử lý',
  CHO_DUYET_BTT: 'Đang xử lý',
  DA_CONG_BO: 'Công bố',
};

// Quyền hành động theo state + role
const actionMatrix: Record<ScoreState, Partial<Record<Role, Action[]>>> = {
  DRAFT: { SPECIALIST: ['submit', 'edit'] },
  CHO_DUYET_BAN: { BAN_LEADER: ['approve', 'reject'] },
  CHO_DUYET_HOI_DONG: { COUNCIL_CHAIR: ['approve', 'reject', 'edit'] },
  CHO_DUYET_BTT: { STANDING_COMMITTEE: ['approve', 'reject', 'edit', 'publish'] },
  DA_CONG_BO: {}, // Không ai có quyền chỉnh sửa
};
```

---

## 7. Kiến trúc FE & Tech stack

| Layer | Đề xuất | Lý do |
|---|---|---|
| Framework | React 18 + TypeScript + Vite | Team quen thuộc, Vite build nhanh, ecosystem lớn |
| State management | React Query (server state) + Zustand (UI state) | Nhiều luồng duyệt cần cache + invalidate theo role |
| Routing | React Router v6, route guard theo role (RBAC) | Chặn truy cập trái quyền ngay ở route level |
| Form phức tạp | React Hook Form + Zod | Validate tổng điểm real-time, schema rõ ràng |
| Grid chấm điểm | TanStack Table v8 | Grid lớn, inline edit, sort/filter, không cần license |
| Component UI | TailwindCSS + shadcn/ui | Đồng nhất UI, component accessible, dễ customize |
| Auth | JWT + role/scope claim, refresh token | Khớp yêu cầu, OTP optional giai đoạn 2 |
| File upload | Presigned URL upload trực tiếp lên storage | Giảm tải BE, UX mượt |
| Real-time (optional) | WebSocket hoặc polling cho optimistic lock | Tránh conflict khi nhiều người thao tác đồng thời |
| i18n | Tách string ra file riêng (`src/constants/labels.ts`) | MTTQ hay đổi thuật ngữ hành chính |
| Charts | Recharts | Lightweight, đủ cho dashboard |
| Icons | Lucide React | Đồng nhất với shadcn/ui |

### Kiến trúc state management

```
┌─────────────────────────────────────────────────┐
│                   React Query                    │
│  (Server state: scores, criteria, audit log)     │
│  - Cache key theo [role, scope, entityId]         │
│  - Invalidate sau mỗi action (duyệt/sửa/công bố) │
│  - Optimistic update cho chấm điểm inline         │
└─────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────┐
│                    Zustand                        │
│  (UI state: sidebar, filters, modal, countdown)  │
│  - Store per feature: useFilterStore, useUIStore │
└─────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────┐
│              React Hook Form + Zod               │
│  (Form state: bảng tiêu chí, lý do thay đổi)     │
│  - Schema-driven validation                      │
│  - useFieldArray cho dynamic criteria rows       │
└─────────────────────────────────────────────────┘
```

### Auth flow

```
Login → POST /auth/login → JWT (access + refresh)
  → Decode JWT → extract role, scope (banId, localityId)
  → Store in Zustand authStore + localStorage
  → React Router guard checks authStore before each route
  → Axios interceptor: attach Authorization header, auto-refresh on 401
```

---

## 8. API Contract giả định

> Cần BE xác nhận field/response format trước khi FE finalize.

### 8.1 Bảng tiêu chí

```typescript
// GET /criteria-tables
Response: {
  data: CriteriaTable[]
}
CriteriaTable: {
  id: string
  name: string
  totalScore: number
  status: 'DRAFT' | 'ACTIVE' | 'EXPIRED'
  criteria: CriteriaItem[]
  assignedLocalityCount: number
  openDate: string      // ISO
  closeDate: string     // ISO
}
CriteriaItem: {
  id: string
  name: string
  maxScore: number
  order: number
}

// POST /criteria-tables
Body: Omit<CriteriaTable, 'id' | 'status' | 'assignedLocalityCount'>

// PUT /criteria-tables/:id
Body: Partial<CriteriaTable>
```

### 8.2 Gán địa phương

```typescript
// POST /criteria-tables/:id/assign-localities
Body: { localityIds: string[] }
Response: { success: boolean, assignedCount: number }
```

### 8.3 Chấm điểm

```typescript
// GET /localities/:id/scores?year=2026
Response: {
  localityId: string
  localityName: string
  scores: ScoreEntry[]
}
ScoreEntry: {
  id: string
  criteriaId: string
  criteriaName: string
  value: number
  state: ScoreState
  scoredBy: string
  scoredAt: string
  evidenceCount: number
}

// PUT /scores/:scoreId
Body: { value: number, reason?: string }  // reason required nếu edit, không required nếu lần đầu
Response: ScoreEntry
```

### 8.4 Duyệt

```typescript
// POST /scores/:id/approve
Body: { note?: string }
Response: { success: boolean, newState: ScoreState }

// POST /scores/:id/reject
Body: { reason: string }  // required
Response: { success: boolean, newState: ScoreState }
```

### 8.5 Công bố

```typescript
// POST /results/:localityId/publish
Body: { decisionFileUrl: string }  // irreversible
Response: { success: boolean, publishedAt: string }
```

### 8.6 Audit log

```typescript
// GET /audit-log?localityId=&scoreId=&page=&limit=
Response: {
  data: AuditEntry[]
  total: number
}
AuditEntry: {
  id: string
  timestamp: string
  actorName: string
  actorRole: Role
  action: 'SCORE' | 'EDIT' | 'APPROVE' | 'REJECT' | 'PUBLISH'
  fieldName: string
  oldValue: string | null
  newValue: string
  reason: string | null
}
```

### 8.7 Trạng thái địa phương

```typescript
// GET /localities/:id/status
Response: {
  status: 'submitted' | 'processing' | 'published'
  submittedAt: string | null
  publishedAt: string | null
}
```

### 8.8 Minh chứng

```typescript
// POST /evidences
Body: {
  localityId: string
  criteriaId: string
  fileUrl: string  // presigned URL sau khi upload
  fileName: string
}
Response: { id: string, uploadedAt: string }

// GET /evidences?localityId=&criteriaId=
Response: { data: Evidence[] }
Evidence: {
  id: string
  criteriaId: string
  fileName: string
  fileUrl: string
  uploadedAt: string
}
```

### 8.9 Nhắc hạn

```typescript
// GET /reminders/config
Response: { daysBefore: number, enabled: boolean }

// PUT /reminders/config
Body: { daysBefore: number, enabled: boolean }
```

---

## 9. Open Questions & Rủi ro

### Câu hỏi mở cần MTTQ chốt

| # | Câu hỏi | Tác động FE | Deadline chốt |
|---|---|---|---|
| Q1 | Cơ chế thời hạn tiêu chí: UI đếm ngược hiển thị theo "ngày mở tiêu chí" hay "ngày chấm"? | Ảnh hưởng màn Admin cấu hình + Dashboard countdown | Trước Sprint 1 |
| Q2 | Số ngày nhắc hạn cụ thể | Để field cấu hình được, không hardcode | Đã xử lý — field động |
| Q3 | OTP cho tài khoản lãnh đạo: bắt buộc bản đầu hay giai đoạn 2? | Ảnh hưởng scope auth flow | Trước Sprint 1 |
| Q4 | Real-time conflict khi duyệt: có tình huống 2 người cùng cấp duyệt song song không? | Quyết định cần lock cơ chế hay chỉ optimistic UI | Trước Sprint 2 |
| Q5 | Định dạng file quyết định công nhận: PDF only hay cho phép khác? | Ảnh hưởng viewer component | Trước Sprint 3 |

### Rủi ro & Mitigation

| Rủi ro | Mức | Mitigation |
|---|---|---|
| BE API chưa sẵn sàng, chậm so với FE | Cao | Dùng MSW (Mock Service Worker) + fixture data để FE build độc lập |
| MTTQ thay đổi thuật ngữ nghiệp vụ thường xuyên | Trung bình | Tách tất cả label ra `src/constants/labels.ts` |
| 95 địa phương × nhiều tiêu chí → grid chậm | Trung bình | Virtualization (TanStack Virtual), pagination, debounce inline edit |
| Optimistic lock khi 2 người cùng duyệt | Trung bình | BE trả 409 Conflict + FE hiển thị toast, reload data. Nếu Q4 → cần WebSocket |
| Scope thay đổi trong 60 ngày | Cao | Chốt MVP scope trước Sprint 1, mọi thay đổi ghi vào changelog |

---

## 10. Cấu trúc dự án

```
thidua/
├── docs/
│   └── SAD-FE-ThiDuaKhenThuong.md       ← tài liệu này
├── public/
├── src/
│   ├── main.tsx                          ← entry point
│   ├── App.tsx                           ← root router + providers
│   ├── api/
│   │   ├── client.ts                     ← axios instance + interceptors
│   │   ├── auth.ts                       ← auth API
│   │   ├── criteria.ts                   ← criteria table API
│   │   ├── scores.ts                     ← scoring API
│   │   ├── approval.ts                   ← approval/publish API
│   │   ├── audit.ts                      ← audit log API
│   │   ├── evidence.ts                   ← evidence upload API
│   │   └── reminders.ts                  ← reminder config API
│   ├── components/
│   │   ├── ui/                           ← shadcn/ui primitives
│   │   ├── layout/
│   │   │   ├── AppLayout.tsx             ← main layout (sidebar + header)
│   │   │   ├── LocalityLayout.tsx        ← mobile-first layout cho địa phương
│   │   │   └── Sidebar.tsx
│   │   ├── shared/
│   │   │   ├── AuditTimeline.tsx         ← audit log component dùng chung
│   │   │   ├── StatusTimeline.tsx        ← 3-step timeline cho địa phương
│   │   │   ├── CountdownTimer.tsx        ← bộ đếm ngược
│   │   │   ├── LocalityMultiSelect.tsx   ← multi-select 95 địa phương
│   │   │   ├── ConfirmDialog.tsx         ← 2-step confirm cho công bố
│   │   │   ├── ScoreDiffModal.tsx        ← hiển thị diff điểm cũ/mới
│   │   │   └── Can.tsx                   ← RBAC component guard
│   │   └── charts/
│   │       ├── StatusDonutChart.tsx
│   │       └── RankingTable.tsx
│   ├── features/
│   │   ├── admin/
│   │   │   ├── pages/
│   │   │   │   ├── CriteriaListPage.tsx
│   │   │   │   ├── CriteriaFormPage.tsx
│   │   │   │   ├── AssignLocalityPage.tsx
│   │   │   │   ├── DeadlineConfigPage.tsx
│   │   │   │   └── AdminDashboardPage.tsx
│   │   │   └── components/
│   │   │       ├── CriteriaFormBuilder.tsx
│   │   │       └── ScoreProgressBar.tsx
│   │   ├── cham-diem/
│   │   │   ├── pages/
│   │   │   │   ├── ScoreByCriteriaPage.tsx
│   │   │   │   └── ScoreByLocalityPage.tsx
│   │   │   └── components/
│   │   │       ├── ScoreGrid.tsx
│   │   │       └── EvidenceSidePanel.tsx
│   │   ├── duyet/
│   │   │   ├── pages/
│   │   │   │   ├── BanLeaderApprovalPage.tsx
│   │   │   │   ├── CouncilApprovalPage.tsx
│   │   │   │   └── StandingCommitteePage.tsx
│   │   │   └── components/
│   │   │       ├── ApprovalSummaryTable.tsx
│   │   │       ├── RejectReasonModal.tsx
│   │   │       └── PublishConfirmModal.tsx
│   │   ├── dia-phuong/
│   │   │   ├── pages/
│   │   │   │   ├── MinhChungPage.tsx
│   │   │   │   ├── TrangThaiPage.tsx
│   │   │   │   └── KetQuaPage.tsx
│   │   │   └── components/
│   │   │       ├── EvidenceUpload.tsx
│   │   │       └── ResultBreakdown.tsx
│   │   └── dashboard/
│   │       └── pages/
│   │           └── OverviewDashboardPage.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useCountdown.ts
│   │   ├── useCan.ts                      ← RBAC hook
│   │   └── useOptimisticLock.ts
│   ├── lib/
│   │   ├── rbac.ts                        ← role/scope definitions + helpers
│   │   ├── state-machine.ts               ← ScoreState transitions + mapping
│   │   └── utils.ts
│   ├── routes/
│   │   ├── index.tsx                      ← route definitions
│   │   └── guards/
│   │       ├── RequireAuth.tsx
│   │       ├── RequireRole.tsx
│   │       └── RequireScope.tsx
│   ├── store/
│   │   ├── authStore.ts                   ← Zustand: auth state
│   │   ├── uiStore.ts                     ← Zustand: UI state
│   │   └── filterStore.ts                 ← Zustand: filter state
│   ├── types/
│   │   ├── api.ts                         ← API response types
│   │   ├── domain.ts                      ← domain entity types
│   │   └── rbac.ts                        ← role/scope types
│   ├── constants/
│   │   ├── labels.ts                      ← tất cả label nghiệp vụ (i18n-ready)
│   │   ├── routes.ts                      ← route path constants
│   │   └── enums.ts                       ← ScoreState, Role, Action enums
│   └── mocks/
│       ├── handlers.ts                    ← MSW handlers
│       └── fixtures/                      ← mock data
│           ├── criteria.ts
│           ├── scores.ts
│           └── localities.ts
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── .eslintrc.cjs
├── .gitignore
└── README.md
```

---

## 11. Roadmap triển khai 60 ngày

### Sprint 0 — Setup & Foundation (Ngày 1–5)

- [x] Scaffold Vite + React + TypeScript
- [x] Cấu hình TailwindCSS + shadcn/ui
- [x] Cấu hình ESLint, Prettier, path aliases
- [x] Setup React Router với route guards
- [x] Setup React Query + axios client
- [x] Setup Zustand stores
- [x] Tạo type definitions (`types/`, `constants/`)
- [x] Setup MSW + fixture data
- [x] Tạo layout components (AppLayout, LocalityLayout)

### Sprint 1 — Core Domain & Admin (Ngày 6–15)

- [ ] RBAC system (`lib/rbac.ts`, `useCan`, `<Can>`)
- [ ] State machine (`lib/state-machine.ts`)
- [ ] Admin: Criteria list page
- [ ] Admin: Criteria form builder (React Hook Form + Zod + useFieldArray)
- [ ] Admin: Assign locality (LocalityMultiSelect)
- [ ] Admin: Deadline config + reminder config
- [ ] Auth flow (login, JWT, refresh token, route guard)

### Sprint 2 — Chấm điểm & Duyệt (Ngày 16–30)

- [ ] Chuyên viên: Score grid (TanStack Table, inline edit)
- [ ] Chuyên viên: Evidence side panel
- [ ] Chuyên viên: Edit reason modal
- [ ] Duyệt: Ban leader approval page
- [ ] Duyệt: Council approval page (chỉ Chủ tịch thấy nút Duyệt)
- [ ] Duyệt: Standing committee page + 2-step publish confirm
- [ ] Duyệt: Reject reason modal
- [ ] Duyệt: Score diff modal
- [ ] Optimistic lock handling (409 Conflict → toast)

### Sprint 3 — Địa phương & Dashboard (Ngày 31–45)

- [ ] Địa phương: Status timeline (mobile-first)
- [ ] Địa phương: Evidence upload (presigned URL)
- [ ] Địa phương: Result page (breakdown + audit log filtered)
- [ ] Dashboard: Status donut chart
- [ ] Dashboard: Ranking table
- [ ] Dashboard: Countdown timer
- [ ] Dashboard: Filters (Ban, tiêu chí, thời gian)
- [ ] Audit timeline component (shared, role-based rendering)

### Sprint 4 — Polish, Test & Handoff (Ngày 46–60)

- [ ] Responsive audit tất cả màn hình
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Unit test: RBAC, state machine, form validation
- [ ] Integration test: luồng chấm điểm → công bố
- [ ] E2E test (Playwright): luồng địa phương, luồng duyệt
- [ ] Performance: virtualization grid, lazy load routes
- [ ] Error boundaries + fallback UI
- [ ] Empty states + loading skeletons
- [ ] Documentation: README, component storybook (nếu có)
- [ ] Handoff demo cho MTTQ

---

## 12. Chiến lược test

| Loại | Tool | Phạm vi | Khi nào |
|---|---|---|---|
| Unit test | Vitest + React Testing Library | RBAC logic, state machine, form validation, utils | Song song với dev |
| Integration test | Vitest + MSW | API calls, React Query cache invalidation | Sau mỗi feature |
| E2E test | Playwright | Luồng chấm điểm → duyệt → công bố; luồng địa phương | Sprint 4 |
| Accessibility | axe-core (via Playwright) | WCAG 2.1 AA | Sprint 4 |
| Visual regression | (optional) Storybook + Chromatic | Component UI | Nếu có bandwidth |

### Test cases ưu tiên

1. **State machine**: Không thể transition từ `DA_CONG_BO` sang trạng thái khác
2. **RBAC**: Role không có quyền không thấy nút hành động + không truy cập được route
3. **Form validation**: Tổng điểm con ≤ tổng điểm bảng
4. **Publish flow**: 2-step confirm, phải nhập "CÔNG BỐ" chính xác
5. **Edit score**: Bắt buộc nhập lý do khi sửa điểm đã chấm
6. **Optimistic lock**: 409 → toast "đã được xử lý bởi X"
7. **Locality view**: Chỉ thấy 3 trạng thái, không thấy log nội bộ

---

## Changelog

| Ngày | Thay đổi | Người |
|---|---|---|
| 03/09/2026 | Tạo tài liệu SAD ban đầu | Cascade |
