# Files API — Tài liệu cho Frontend

API quản lý file đính kèm (upload lên MinIO, lưu metadata vào DB). Base URL: `/api/v1/files`.

> **Tất cả endpoint đều yêu cầu JWT** — gửi header `Authorization: Bearer <token>`.

---

## Mục lục

1. [Khái niệm cốt lõi: `entityType` + `entityId`](#1-khái-niệm-cốt-lõi-entitytype--entityid)
2. Danh sách endpoint
3. Upload 1 file
4. Upload nhiều file
5. Danh sách file (lọc theo entityType/entityId)
6. Chi tiết 1 file (có URL tạm)
7. Download file
8. Xóa file
9. Bảng tham chiếu nhanh

---

## 1. Khái niệm cốt lõi: `entityType` + `entityId`

Đây là **2 trường quan trọng nhất** của API files. Chúng dùng để **gắn (attach) một file vào một đối tượng nghiệp vụ cụ thể** trong hệ thống.

| Trường | Kiểu | Bắt buộc | Ý nghĩa |
|---|---|---|---|
| `entityType` | string (enum) | Không | **Loại đối tượng** mà file được gắn vào |
| `entityId` | GUID | Không | **ID cụ thể** của đối tượng đó |

### 1.1. Cách hoạt động

- Khi upload, FE gửi kèm `entityType` + `entityId` trong form-data → hệ thống lưu 2 giá trị này vào record file.
- Khi cần hiển thị danh sách file của một đối tượng (ví dụ: tất cả file của một `CriteriaGroup` có id `abc-123`), FE gọi `GET /api/v1/files?entityType=CriteriaGroup&entityId=abc-123`.
- **Cả hai trường đều optional**: file không gắn `entityType`/`entityId` là file "độc lập" (không thuộc đối tượng nào).
- Hai trường **độc lập với nhau**: có thể lọc chỉ theo `entityType`, chỉ theo `entityId`, hoặc cả hai.

### 1.2. Các giá trị hợp lệ của `entityType`

`entityType` là **enum**, server kiểm tra chặt (không phân biệt hoa/thường):

| Giá trị | Ý nghĩa |
|---|---|
| `CriteriaGroup` | Nhóm tiêu chí |
| `Criteria` | Tiêu chí |
| `SubmissionResult` | Kết quả nộp hồ sơ |
| `SubmissionHistory` | Lịch sử nộp |
| `ApprovalHistory` | Lịch sử phê duyệt |
| `FinalDecision` | Quyết định cuối cùng |

**Lưu ý quan trọng:**

- **Upload**: nếu gửi `entityType` sai (ví dụ `criterias`, `user`, `task`...) → request **bị từ chối** với lỗi: `Invalid entityType 'xxx'. Valid values: CriteriaGroup, Criteria, SubmissionResult, SubmissionHistory, ApprovalHistory, FinalDecision`.
- **Lọc danh sách**: nếu `entityType` trong query string sai → **không lỗi**, nhưng filter bị **bỏ qua im lặng** (trả về tất cả file). FE phải tự đảm bảo gửi đúng giá trị enum.
- So khớp **không phân biệt hoa/thường**: `criteriagroup` = `CriteriaGroup` = `criteriaGroup`.

### 1.3. Quy ước khi dùng

- **Nên gửi cả `entityType` + `entityId` cùng lúc** khi file thuộc về một đối tượng. Gửi `entityType` mà thiếu `entityId` (hoặc ngược lại) vẫn hợp lệ nhưng ít có ý nghĩa nghiệp vụ.
- **Upload trước, có entity sau?** Với luồng "tạo mới đối tượng kèm file" (chưa có `entityId` lúc upload): upload file trước (bỏ qua `entityType`/`entityId`), sau khi có id của đối tượng thì... hiện tại API **chưa có endpoint cập nhật lại** `entityType`/`entityId` của file — cần backend bổ sung nếu luồng này xảy ra. Hiện tại cách an toàn: **tạo đối tượng trước, upload file sau** khi đã có `entityId`.
- `entityId` phải là **GUID hợp lệ** (đúng id của đối tượng trong hệ thống).

### 1.4. Ví dụ minh họa

```
Scenario: User đính kèm 3 file minh chứng vào một Tiêu chí (Criteria) có id = "7f3c..."

1. Upload từng file với:
   entityType = "Criteria"
   entityId   = "7f3c..."

2. Sau đó, mở trang chi tiết Tiêu chí → gọi:
   GET /api/v1/files?entityType=Criteria&entityId=7f3c...
   → nhận đúng 3 file đó.
```

---

## 2. Upload 1 file

```
POST /api/v1/files/upload
Content-Type: multipart/form-data
```

**Giới hạn:** tối đa **20MB** mỗi request; kích thước 1 file không vượt quá `Storage:MaxFileSize` (mặc định **10MB**).

### Form fields

| Field | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `file` | binary | ✅ | Nội dung file |
| `displayName` | string | ❌ | Tên hiển thị (bỏ trống → dùng tên file gốc) |
| `title` | string | ❌ | Tiêu đề |
| `description` | string | ❌ | Mô tả |
| `note` | string | ❌ | Ghi chú |
| `category` | string | ❌ | Phân loại tự do (vd: `document`, `image`) |
| `entityType` | string | ❌ | **Loại đối tượng gắn file** (xem mục 1) |
| `entityId` | GUID | ❌ | **ID đối tượng gắn file** (xem mục 1) |
| `visibility` | string | ❌ | `Private` (mặc định) hoặc `Public` |

### Ví dụ (JavaScript)

```js
const form = new FormData();
form.append('file', fileInput.files[0]);
form.append('displayName', 'Bản vẽ thiết kế');
form.append('entityType', 'Criteria');        // gắn vào Tiêu chí
form.append('entityId', criteriaId);          // id của Tiêu chí

const res = await fetch('/api/v1/files/upload', {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}` },
  body: form,
});
const { success, data } = await res.json();
// data.id → dùng cho các thao tác sau
```

### Response `201`

```json
{
  "success": true,
  "data": {
    "id": "9b2e...",
    "originalName": "ban-ve.pdf",
    "displayName": "Bản vẽ thiết kế",
    "title": null,
    "description": null,
    "note": null,
    "provider": "Minio",
    "bucketName": "mttq-tctd",
    "objectKey": "attachments/2026/09/10/9b2e....pdf",
    "mimeType": "application/pdf",
    "extension": ".pdf",
    "category": null,
    "entityType": "Criteria",
    "entityId": "7f3c...",
    "sizeBytes": 1048576,
    "checksumSha256": "a3f1...",
    "visibility": "Private",
    "status": "Uploaded",
    "url": null,
    "createdAt": "2026-09-10T09:00:00+00:00"
  },
  "traceId": null,
  "timestamp": "2026-09-10T09:00:00.123+00:00",
  "errors": null
}
```

> `url` chỉ có giá trị ở endpoint **chi tiết** (mục 5). Sau upload nó là `null`.

---

## 3. Upload nhiều file

```
POST /api/v1/files/upload-bulk
Content-Type: multipart/form-data
```

**Giới hạn:** tối đa **100MB** mỗi request (tổng tất cả file; từng file vẫn giới hạn bởi `MaxFileSize`).

- Field file phải tên `files` (có thể lặp nhiều lần).
- Các field metadata (`displayName`, `entityType`, `entityId`...) được **áp dụng chung cho tất cả file** trong request.

```js
const form = new FormData();
for (const f of fileInput.files) form.append('files', f);
form.append('entityType', 'CriteriaGroup');
form.append('entityId', criteriaGroupId);

await fetch('/api/v1/files/upload-bulk', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form });
// data: mảng FileResponse
```

---

## 4. Danh sách file

```
GET /api/v1/files
```

### Query params

| Param | Kiểu | Mặc định | Mô tả |
|---|---|---|---|
| `search` | string | — | Tìm trong tên gốc / displayName / title / description |
| `category` | string | — | Lọc đúng giá trị category |
| `entityType` | string | — | **Lọc theo loại đối tượng** (enum, không phân biệt hoa/thường) |
| `entityId` | GUID | — | **Lọc theo id đối tượng** |
| `page` | int | `1` | Trang |
| `pageSize` | int | `20` | Tối đa 100 |
| `sortBy` | string | — | `originalname` hoặc `sizebytes` |
| `sortOrder` | string | `desc` | `asc` / `desc` |

> Không truyền `sortBy` → sắp xếp mặc định theo `createdAt` mới nhất trước.

### Ví dụ — lấy tất cả file của một Tiêu chí

```
GET /api/v1/files?entityType=Criteria&entityId=7f3c...&page=1&pageSize=50
```

### Response `200`

```json
{
  "success": true,
  "data": {
    "items": [ { "...FileResponse": "" } ],
    "total": 3,
    "page": 1,
    "pageSize": 50
  }
}
```

---

## 5. Chi tiết 1 file

```
GET /api/v1/files/{id}
```

Response giống FileResponse ở mục 2, nhưng **`url` có giá trị**: đây là **presigned URL trỏ thẳng tới MinIO**, dùng để hiển thị ảnh/preview hoặc tải trực tiếp mà **không cần header Authorization**.

> ⚠️ URL **hết hạn sau 1 giờ**. Mỗi lần cần hiển thị lại, FE nên gọi lại `GET /{id}` để lấy URL mới, **không lưu URL này vào DB/state lâu dài**.

---

## 6. Download file

```
GET /api/v1/files/{id}/download
```

Trả về **binary stream** (không bọc `ApiResponse`), kèm header `Content-Disposition` với tên file gốc. Phù hợp cho thẻ `<a download>` hoặc fetch + blob.

---

## 7. Xóa file

```
DELETE /api/v1/files/{id}
```

- **Soft delete**: file bị đánh dấu xóa (ẩn khỏi list/chi tiết), object trên MinIO **vẫn còn**.
- Response: `{ "success": true, "data": { "deleted": true, "id": "..." } }`.

---

## 8. Xử lý lỗi

Mọi lỗi trả về dạng:

```json
{
  "success": false,
  "data": null,
  "errors": [ { "code": "...", "message": "..." } ]
}
```

| Tình huống | Nguyên nhân thường gặp |
|---|---|
| `401` | Thiếu/sai JWT |
| Lỗi "File size ... exceeds the limit" | File > `MaxFileSize` (10MB mặc định) |
| Lỗi "Invalid entityType '...'. Valid values: ..." | `entityType` không nằm trong enum (chỉ có ở **upload**) |
| `404` | File không tồn tại hoặc đã bị xóa |

---

## 9. Bảng tham chiếu nhanh

| Endpoint | Method | Mô tả |
|---|---|---|
| `/api/v1/files/upload` | POST | Upload 1 file (multipart, ≤20MB request) |
| `/api/v1/files/upload-bulk` | POST | Upload nhiều file (≤100MB request) |
| `/api/v1/files` | GET | Danh sách + lọc (`search`, `category`, `entityType`, `entityId`, phân trang) |
| `/api/v1/files/{id}` | GET | Chi tiết + presigned URL (hạn 1h) |
| `/api/v1/files/{id}/download` | GET | Tải file (binary) |
| `/api/v1/files/{id}` | DELETE | Xóa mềm |

**Ghi nhớ về `entityType` / `entityId`:**

- Cặp `entityType` + `entityId` = "file này thuộc về đối tượng nào".
- `entityType` chỉ nhận 6 giá trị: `CriteriaGroup`, `Criteria`, `SubmissionResult`, `SubmissionHistory`, `ApprovalHistory`, `FinalDecision` (không phân biệt hoa/thường).
- Upload: sai `entityType` → lỗi. Lọc danh sách: sai `entityType` → filter bị bỏ qua im lặng.
- Muốn file của đối tượng X → luôn truyền **cả hai** khi upload, và lọc bằng **cả hai** khi list.
