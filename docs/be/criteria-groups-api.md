# API Documentation — Criteria Groups & Criteria

Base URL: `http://localhost:5241/api/v1` (dev) — mọi request đều cần header `Authorization: Bearer {token}`.

## 1. Khái niệm

- **CriteriaGroup (Nhóm tiêu chí / Đợt đánh giá)**: nhóm các tiêu chí dùng để chấm điểm. Có `maxPoint` là điểm tối đa của cả nhóm.
- **Criteria (Tiêu chí)**: từng tiêu chí con thuộc một nhóm. Có `maxPoint` riêng.
- **Luồng nghiệp vụ**:
  1. Tạo nhóm tiêu chí → trạng thái `Draft`.
  2. Thêm tiêu chí vào nhóm (chỉ khi nhóm đang `Draft`).
  3. Áp dụng nhóm (`apply`) → trạng thái `Applied`, hệ thống tự tạo phiếu chấm (submission) cho từng user cấp xã/phường.
  4. Sau khi `Applied`, nhóm và tiêu chí **không thể sửa**.

### Trạng thái nhóm (`status`)

| Giá trị | Ý nghĩa |
|---|---|
| `Draft` | Nháp — được phép sửa nhóm, thêm/sửa tiêu chí |
| `Applied` | Đã áp dụng — đã tạo phiếu chấm cho các đơn vị |
| `Closed` | Đã đóng |

### Quy tắc nghiệp vụ quan trọng

- **Tổng `maxPoint` của các tiêu chí không được vượt quá `maxPoint` của nhóm.** Nếu vượt, API trả lỗi 400 với message tiếng Việt rõ ràng.
- Chỉ nhóm ở trạng thái `Draft` mới được cập nhật / thêm tiêu chí / áp dụng.
- `deadline` là **optional** — không truyền thì lưu `null`.

## 2. Response envelope

Mọi API trả về dạng:

```json
{
  "success": true,
  "data": { "...": "" },
  "traceId": "...",
  "timestamp": "..."
}
```

Khi lỗi:

```json
{
  "success": false,
  "data": null,
  "traceId": "...",
  "timestamp": "...",
  "errors": [
    {
      "field": "",
      "code": "BUSINESS_RULE",
      "messages": {
        "vi": "Tổng điểm tối đa của các tiêu chí (57.5) vượt quá điểm tối đa của nhóm tiêu chí (15.00). Vui lòng giảm điểm tối đa của các tiêu chí.",
        "en": "Sum of criteria max points (57.5) exceeds group max point (15.00)."
      }
    }
  ]
}
```

Các `code` lỗi thường gặp: `BAD_REQUEST`, `BUSINESS_RULE`, `NOT_FOUND`, `UNAUTHORIZED`, `CONFLICT`.

## 3. Criteria Groups

### 3.1. Tạo nhóm tiêu chí

`POST /criteria-groups`

```json
{
  "name": "Đợt thi đua quý 4/2026",
  "content": "Nội dung mô tả đợt thi đua (không bắt buộc)",
  "maxPoint": 100,
  "deadline": "2026-12-31T17:00:00.000Z"
}
```

- `name` (bắt buộc), `content`, `maxPoint`, `deadline` (optional).
- Nhóm mới luôn có `status = "Draft"`.

**Response 201** — `data` là `CriteriaGroupResponse`:

```json
{
  "id": "ecae0a32-8370-4f21-9ebc-bc5ee9883a02",
  "name": "Đợt thi đua quý 4/2026",
  "content": "Nội dung mô tả đợt thi đua (không bắt buộc)",
  "maxPoint": 100,
  "deadline": "2026-12-31T17:00:00.000Z",
  "status": "Draft",
  "createdAt": "2026-09-10T08:00:00+00:00",
  "updatedAt": null,
  "criteria": []
}
```

### 3.2. Cập nhật nhóm

`PUT /criteria-groups/{id}`

```json
{
  "name": "Đợt thi đua quý 4/2026 (sửa)",
  "content": "Nội dung mới",
  "maxPoint": 100,
  "deadline": null
}
```

- Chỉ được sửa khi nhóm đang `Draft`. Ngược lại trả lỗi `BUSINESS_RULE`.

### 3.3. Danh sách nhóm

`GET /criteria-groups`

Query params:

| Param | Mặc định | Mô tả |
|---|---|---|
| `search` | — | Tìm theo tên |
| `status` | — | Lọc: `Draft` / `Applied` / `Closed` |
| `page` | `1` | Trang |
| `pageSize` | `20` | Số dòng/trang (max 100) |
| `sortBy` | `createdAt` | `createdAt` / `name` / `deadline` / `maxPoint` |
| `sortOrder` | `desc` | `asc` / `desc` |

Ví dụ: `GET /criteria-groups?status=Draft&page=1&pageSize=20`

**Response 200** — `data` là `PagedResult`:

```json
{
  "items": [ { "...CriteriaGroupResponse": "" } ],
  "total": 42,
  "page": 1,
  "pageSize": 20
}
```

### 3.4. Chi tiết nhóm

`GET /criteria-groups/{id}`

**Response 200** — `data` là `CriteriaGroupResponse`, trong đó `criteria` chứa danh sách tiêu chí của nhóm.

### 3.5. Áp dụng nhóm (Draft → Applied)

`POST /criteria-groups/apply`

```json
{
  "criteriaGroupId": "ecae0a32-8370-4f21-9ebc-bc5ee9883a02"
}
```

Điều kiện:
- Nhóm phải đang `Draft`.
- Nhóm phải có ít nhất 1 tiêu chí.
- Tổng `maxPoint` của tiêu chí ≤ `maxPoint` nhóm.

Khi thành công, hệ thống tự tạo phiếu chấm (submission) cho **mỗi user cấp xã/phường**.

**Response 200**:

```json
{
  "success": true,
  "data": { "applied": true, "criteriaGroupId": "ecae0a32-..." }
}
```

## 4. Criteria

### 4.1. Tạo 1 tiêu chí

`POST /criteria`

```json
{
  "criteriaGroupId": "ecae0a32-...",
  "type": "Standard",
  "content": "Nội dung tiêu chí",
  "maxPoint": 7.5,
  "maxBonusPoint": 1.5,
  "deadline": "2026-10-25T17:00:00.000Z",
  "note": "Ghi chú (optional)"
}
```

**Response 201** — `data` là `CriteriaResponse`:

```json
{
  "id": "b1c2d3e4-...",
  "criteriaGroupId": "ecae0a32-...",
  "type": "Standard",
  "targetSubmissionId": null,
  "content": "Nội dung tiêu chí",
  "maxPoint": 7.5,
  "maxBonusPoint": 1.5,
  "deadline": "2026-10-25T17:00:00.000Z",
  "note": "Ghi chú (optional)",
  "createdAt": "2026-09-10T08:00:00+00:00",
  "updatedAt": null
}
```

### 4.2. Tạo nhiều tiêu chí cùng lúc (bulk)

`POST /criteria/bulk`

```json
{
  "criteriaGroupId": "ecae0a32-8f57-43fe-8766-51809d42a3d9",
  "items": [
    {
      "type": "Standard",
      "content": "Thành lập đoàn giám sát theo chuyên đề.",
      "maxPoint": 7.5,
      "maxBonusPoint": 1.5,
      "deadline": "2026-10-25T17:00:00.000Z",
      "note": "Có biên bản làm việc đầy đủ chữ ký."
    },
    {
      "type": "Standard",
      "content": "Tổ chức hội nghị phản biện xã hội.",
      "maxPoint": 5,
      "maxBonusPoint": 0
    }
  ]
}
```

Validation (trả 400 `BUSINESS_RULE` nếu vi phạm):
- `items` không được rỗng.
- Nhóm phải tồn tại và đang `Draft`.
- **Tổng `maxPoint` tiêu chí hiện có + items mới ≤ `maxPoint` của nhóm.**

**Response 201** — `data` là mảng `CriteriaResponse`.

### 4.3. Cập nhật tiêu chí

`PUT /criteria/{id}`

```json
{
  "content": "Nội dung mới",
  "maxPoint": 5,
  "maxBonusPoint": 1,
  "deadline": "2026-10-30T17:00:00.000Z",
  "note": "Ghi chú",
  "changeReason": "Lý do sửa (lưu vào lịch sử)"
}
```

### 4.4. Chi tiết tiêu chí

`GET /criteria/{id}`

### 4.5. Danh sách tiêu chí theo nhóm

`GET /criteria-groups/{group-id}/criteria`

Query params: `search`, `type`, `page`, `pageSize`, `sortBy` (`content`/`maxPoint`/`deadline`/`createdAt`), `sortOrder`.

## 5. Ví dụ luồng tích hợp (JS)

```js
const BASE = "https://<api-host>/api/v1";
const headers = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
};

// 1. Tạo nhóm
const group = await fetch(`${BASE}/criteria-groups`, {
  method: "POST",
  headers,
  body: JSON.stringify({ name: "Đợt thi đua Q4", maxPoint: 100 }),
}).then(r => r.json()).then(r => r.data);

// 2. Thêm tiêu chí hàng loạt
await fetch(`${BASE}/criteria/bulk`, {
  method: "POST",
  headers,
  body: JSON.stringify({
    criteriaGroupId: group.id,
    items: [
      { type: "Standard", content: "Tiêu chí 1", maxPoint: 50 },
      { type: "Standard", content: "Tiêu chí 2", maxPoint: 50 },
    ],
  }),
});

// 3. Áp dụng
await fetch(`${BASE}/criteria-groups/apply`, {
  method: "POST",
  headers,
  body: JSON.stringify({ criteriaGroupId: group.id }),
});
```
