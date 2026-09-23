# Audit Logs API — Lịch sử thay đổi (dành cho FE)

Tài liệu API lịch sử thay đổi dữ liệu (`GET /api/v1/audit-logs`) để FE gắn tab "Lịch sử" cho user địa phương và trang audit log cho admin.

---

## 1. Phân quyền (đã xử lý phía BE)

| Role | Quyền |
|---|---|
| `admin`, `system_admin`, `specialist`, `leader`, `council`, `committee` (có permission `audit_logs.read`) | Xem **tất cả** log, filter tự do |
| User thường / địa phương (`local`, `user`) | **Tự động chỉ thấy log do chính tài khoản đó tạo** — BE ép `userId` = user hiện tại, **KHÔNG cần (và không thể) truyền `userId`** |

> FE chỉ cần gọi API bình thường — BE tự xử lý phạm vi dữ liệu theo role. User thường truyền `userId` của người khác cũng bị ghi đè.

---

## 2. Endpoint

```
GET /api/v1/audit-logs
Authorization: Bearer <accessToken>
```

### Query parameters

| Param | Kiểu | Mặc định | Mô tả |
|---|---|---|---|
| `from` | datetime? | — | Lấy log từ thời điểm (ISO 8601), vd `2026-09-01T00:00:00Z` |
| `to` | datetime? | — | Đến thời điểm |
| `userId` | guid? | — | **Chỉ có tác dụng với admin/nội bộ.** User thường bị ép = chính mình |
| `module` | string? | — | `Submission`, `Emulation`, `Files`, `ResultPublication`... |
| `action` | string? | — | `Created` \| `Updated` \| `Deleted` |
| `entityName` | string? | — | Tên entity, vd `Submission`, `SubmissionResult`, `FileEntity` |
| `entityId` | guid? | — | Xem lịch sử của 1 bản ghi cụ thể |
| `httpMethod` | string? | — | `GET`/`POST`/`PUT`/`DELETE` |
| `traceId` | string? | — | Truy vết theo request |
| `search` | string? | — | Tìm trong module/action/entityName/requestPath/traceId |
| `page` | int | 1 | |
| `pageSize` | int | 20 | max 100 |
| `sortBy` | string | `createdAt` | `createdAt` \| `action` \| `statusCode` \| `durationMs` |
| `sortOrder` | string | `desc` | `asc` \| `desc` |

---

## 3. Response

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "9f1e...",
        "userId": "3f2b8c1a-...",
        "actor": "Nguyễn Văn",
        "module": "Submission",
        "action": "Updated",
        "entityName": "SubmissionResult",
        "entityId": "aa11...",
        "httpMethod": "PUT",
        "requestPath": "/api/v1/submissions/...",
        "statusCode": 200,
        "traceId": "0HNOOFL1AC1QI:00000001",
        "userAgent": "Mozilla/5.0...",
        "beforeData": "{\"point\":null,\"bonusPoint\":null}",
        "afterData": "{\"point\":8.5,\"bonusPoint\":1}",
        "changedData": "{\"point\":{\"before\":null,\"after\":8.5},\"bonusPoint\":{\"before\":null,\"after\":2}}",
        "durationMs": 45,
        "success": true,
        "ipAddress": "10.0.0.1",
        "createdAt": "2026-09-22T07:44:57.1403528+00:00"
      }
    ],
    "total": 12,
    "page": 1,
    "pageSize": 20
  }
}
```

### Giải thích field

| Field | Mô tả |
|---|---|
| `actor` | Tên người thực hiện (đã join từ user). `"Hệ thống tự động"` nếu không phải user |
| `module` | Nhóm nghiệp vụ: `Submission`, `Emulation`, `Files`, `ResultPublication` |
| `action` | `Created` / `Updated` / `Deleted` |
| `entityName` / `entityId` | Bảng + id bản ghi bị thay đổi |
| `httpMethod`, `requestPath`, `statusCode` | Request gây ra thay đổi |
| `beforeData` / `afterData` | **JSON string** — snapshot toàn bộ entity trước/sau |
| `changedData` | **JSON string** — chỉ các field thay đổi: `{ "field": { "before": ..., "after": ... } }` |
| `durationMs`, `success`, `ipAddress`, `traceId` | Thông tin kỹ thuật của request |

### Parse ChangedData ở FE

```ts
type Change = { before: unknown; after: unknown };

interface SystemLog {
  id: string;
  actor: string;
  module: string;
  action: "Created" | "Updated" | "Deleted";
  entityName: string | null;
  changedData: string | null; // JSON string
  createdAt: string;
  // ...
}

const parseChanges = (log: SystemLog): Record<string, Change> =>
  log.changedData ? JSON.parse(log.changedData) : {};
```

Ví dụ render diff:

```ts
const changes = parseChanges(log);
Object.entries(changes).forEach(([field, { before, after }]) => {
  console.log(`${field}: ${JSON.stringify(before)} → ${JSON.stringify(after)}`);
});
// point: null → 8.5
```

> `beforeData`/`afterData`/`changedData` là **string JSON**, cần `JSON.parse` trước khi hiển thị. Với action `Created` chỉ có `afterData`, với `Deleted` chỉ có `beforeData`.

---

## 4. Gợi ý label tiếng Việt

**Module:**

| Giá trị | Label |
|---|---|
| `Submission` | Hồ sơ thi đua |
| `Emulation` | Danh hiệu thi đua |
| `Files` | Tài liệu |
| `ResultPublication` | Công bố kết quả |

**Action:**

| Giá trị | Label | Màu gợi ý |
|---|---|---|
| `Created` | Tạo mới | xanh |
| `Updated` | Cập nhật | vàng |
| `Deleted` | Xóa | đỏ |

---

## 5. Lưu ý

- Log chỉ tồn tại khi user **từng thao tác làm thay đổi dữ liệu** (nộp/sửa hồ sơ, chấm điểm, upload file...). User mới → danh sách rỗng là bình thường.
- Hệ thống **không ghi log** cho: đăng nhập/đăng xuất, thông báo, xem dữ liệu (chỉ ghi Created/Updated/Deleted).
- Dữ liệu nhạy cảm (password, token...) đã được redact thành `[REDACTED]` trước khi lưu.
- Log mới nhất xuất hiện sau khi request hoàn tất (ghi tự động trong cùng transaction với thay đổi).

## 6. Error

| HTTP | Khi nào |
|---|---|
| 401 | Chưa đăng nhập / token hết hạn |
| 500 | Lỗi hệ thống |

(User thường không bị 403 nữa — luôn xem được lịch sử của chính mình.)
