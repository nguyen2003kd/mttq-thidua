# Refresh Token Flow — Đặc tả cho FE

Tài liệu mô tả luồng refresh token của BE (.NET) để FE implement đúng contract.

## Endpoint

```
POST /api/v1/auth/refresh
```

- **Anonymous** — không cần `Authorization` header (`[AllowAnonymous]`)
- Gửi `withCredentials: true` để kèm cookie (BE có fallback đọc `refresh_token` cookie)

### Request body

```json
{
  "refreshToken": "<jwt>"
}
```

Field là **camelCase** `refreshToken`. Nếu body rỗng, BE fallback đọc cookie `refresh_token`.

### Response thành công — 200

```json
{
  "success": true,
  "data": {
    "accessToken": "<jwt mới>",
    "refreshToken": "<jwt mới>"
  },
  "traceId": "...",
  "timestamp": "..."
}
```

**Lưu ý**: response dùng camelCase (`accessToken`, `refreshToken`) — không phải snake_case như model cũ (`access_token`, `refresh_token`).

## Luồng xử lý BE

`SessionService.RefreshTokenAsync`:

1. **Verify JWT** — HS256 với `JWT_REFRESH_SECRET`, validate `iss`/`aud`/`exp`, `ClockSkew = 0`
2. **Lookup session** — SHA256 hash của token → tìm `user_sessions.RefreshTokenHash`
3. **Reuse detection** — nếu không tìm thấy session hoặc `Status != Active`:
   - `RevokeAllUserSessionsAsync` — **thu hồi TOÀN BỘ sessions của user**
   - Trả 401 `"Token reuse detected"`
4. **Rotate** — phát hành access token mới (1h) + refresh token mới (7d), update hash trong session, trả về cả 2

## Quy tắc quan trọng

### 1. Refresh token là SINGLE-USE

Mỗi lần refresh thành công, BE rotate token: refresh token cũ **vô hiệu ngay lập tức**, phải dùng token mới từ response. Gửi lại token cũ → 401 + mất toàn bộ sessions.

### 2. Chỉ 1 request refresh tại 1 thời điểm

Nhiều request cùng 401 → chỉ gọi refresh 1 lần, các request còn lại chờ kết quả chung (dedup bằng shared promise). Nếu gọi refresh song song 2 lần với cùng token → request thứ 2 bị "Token reuse detected" → revoke all sessions.

### 3. Không retry refresh trong interceptor

Request tới `/api/v1/auth/refresh` phải được exclude khỏi logic retry-401, tránh vòng lặp vô hạn.

### 4. Không gắn Authorization header

Request refresh không cần access token. Gắn token hết hạn vào cũng không sao (endpoint anonymous) nhưng nên bỏ cho sạch.

## Error cases

| HTTP | Code | Message (en) | Nguyên nhân | FE xử lý |
|------|------|--------------|-------------|----------|
| 401 | `MISSING_TOKEN` | Refresh token is missing | Không có token trong body/cookie | Clear session → login |
| 401 | `UNAUTHORIZED` | Invalid refresh token | JWT sai signature/hết hạn (>7d) | Clear session → login |
| 401 | `UNAUTHORIZED` | Token reuse detected | Token đã rotate hoặc session revoked | Clear session → login |

Mọi lỗi 401 từ refresh → **clear auth state + redirect `/login`**. Không retry.

## Luồng FE chuẩn

```
Request API → 401
  ├─ URL thuộc auth endpoints (login/refresh/logout/...) → reject luôn
  ├─ Store đã có accessToken mới hơn token trong request → retry với token mới
  │   (request khác đã refresh xong)
  └─ Chưa ai refresh → gọi POST /auth/refresh (dedup qua shared promise)
       ├─ Thành công → lưu accessToken + refreshToken MỚI → retry request gốc
       └─ Thất bại → clearAuth() → dispatch 'auth:logout' → redirect /login
```

## Token TTL

| Token | TTL | Config |
|-------|-----|--------|
| Access token | 1h | `JWT_EXPIRES_IN` |
| Refresh token | 7d | `JWT_REFRESH_EXPIRES_IN` |

## Tham chiếu code

- BE endpoint: `mttq-tctd-be/src/Mttq.Tctd.Api/Controllers/AuthController.cs` → `Refresh`
- BE logic: `mttq-tctd-be/src/Mttq.Tctd.Application/Services/SessionService.cs` → `RefreshTokenAsync`
- JWT verify: `mttq-tctd-be/src/Mttq.Tctd.Application/Services/TokenService.cs` → `VerifyToken`
- FE interceptor hiện tại: `src/api/mutator/auth-interceptors.ts` (đã implement đúng luồng trên)
