# Reference — Ma trận RBAC

Nguồn chân lý: `src/lib/rbac.ts`. File này đối chiếu cho test ([04-testing.md](04-testing.md) §3) và docs.

`can(user, action, ctx)` = **`role cho phép action`** AND (nếu `ctx.state`) **`state cho phép action`** AND (nếu `ctx.scope`) **`scope khớp`**.
`user === null` → luôn `false`.

---

## 1. `ROLE_ACTIONS` — role → action được phép

| Role | create | edit | delete | submit | approve | reject | publish | view | assign |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| `ADMIN` | ✅ | ✅ | ✅ | | | | | ✅ | ✅ |
| `LOCALITY` | ✅ | | ✅ | | | | | ✅ | |
| `SPECIALIST` | | ✅ | | ✅ | | | | ✅ | |
| `BAN_LEADER` | | | | | ✅ | ✅ | | ✅ | |
| `COUNCIL_CHAIR` | | ✅ | | | ✅ | ✅ | | ✅ | |
| `COUNCIL_VICE` | | | | | | | | ✅ | |
| `STANDING_COMMITTEE` | | ✅ | | | ✅ | ✅ | ✅ | ✅ | |

> `LOCALITY` `create`/`delete` = nộp/xoá **minh chứng** (không phải điểm).
> `COUNCIL_CHAIR` `edit` = quyền sửa điểm ở bước Hội đồng (theo `STATE_ACTIONS`).
> `COUNCIL_VICE` chỉ `view` → không duyệt/trả lại (UI: nút disabled).

---

## 2. `STATE_ACTIONS` — trạng thái điểm → action được phép

| ScoreState | edit | submit | approve | reject | publish | view |
|---|:-:|:-:|:-:|:-:|:-:|:-:|
| `DRAFT` | ✅ | ✅ | | | | |
| `CHO_DUYET_BAN` | | | ✅ | ✅ | | |
| `CHO_DUYET_HOI_DONG` | ✅ | | ✅ | ✅ | | |
| `CHO_DUYET_BTT` | ✅ | | ✅ | ✅ | ✅ | |
| `DA_CONG_BO` | | | | | | ✅ |

> `view` chỉ có ở `DA_CONG_BO` trong bảng này — nghĩa là khi truyền `ctx.state`, chỉ trạng thái công bố mới cho `view`. Các trang danh sách không truyền `state` nên `view` chỉ phụ thuộc role. **Giữ nguyên hành vi này**; nếu nghiệp vụ muốn khác, cập nhật `STATE_ACTIONS` + file này + test.

**Kết hợp role×state** (ví dụ điểm cần test):

| Role | State | Action | `can` |
|---|---|---|:-:|
| SPECIALIST | DRAFT | edit | ✅ |
| SPECIALIST | DRAFT | submit | ✅ |
| SPECIALIST | CHO_DUYET_BAN | edit | ❌ (state không cho) |
| BAN_LEADER | CHO_DUYET_BAN | approve | ✅ |
| BAN_LEADER | CHO_DUYET_BAN | reject | ✅ |
| BAN_LEADER | DRAFT | approve | ❌ (state không cho) |
| BAN_LEADER | CHO_DUYET_HOI_DONG | approve | ❌ (đúng ra role cho, nhưng đây là bước Hội đồng — chặn bằng route/scope, không bằng bảng này) |
| COUNCIL_CHAIR | CHO_DUYET_HOI_DONG | approve | ✅ |
| COUNCIL_VICE | CHO_DUYET_HOI_DONG | approve | ❌ (role chỉ view) |
| COUNCIL_CHAIR | CHO_DUYET_HOI_DONG | edit | ✅ |
| STANDING_COMMITTEE | CHO_DUYET_BTT | publish | ✅ |
| STANDING_COMMITTEE | CHO_DUYET_BTT | reject | ✅ |
| STANDING_COMMITTEE | CHO_DUYET_HOI_DONG | publish | ❌ (state không cho) |
| ADMIN | CHO_DUYET_BTT | publish | ❌ (role không có publish) |
| bất kỳ | DA_CONG_BO | edit/approve/publish/reject | ❌ |

---

## 3. Scope (sau fix B7)

Áp dụng khi `ctx.scope` có mặt và `user.role !== 'ADMIN'`:

| Tình huống | Kết quả |
|---|---|
| `ctx.scope.banId` set, `user.banId` khớp | không chặn bởi scope |
| `ctx.scope.banId` set, `user.banId` lệch | ❌ `false` |
| `ctx.scope.banId` set, `user.banId === undefined` | ❌ `false` (B7: trước đây lọt) |
| `ctx.scope.localityId` set, `user.localityId` khớp | không chặn |
| `ctx.scope.localityId` set, `user.localityId` lệch | ❌ `false` |
| `ctx.scope.localityId` set, `user.localityId === undefined` | ❌ `false` |
| `user.role === 'ADMIN'`, scope bất kỳ | scope bỏ qua (ADMIN toàn quyền) |
| `ctx.scope` không truyền | không kiểm scope |

---

## 4. Route → role (`ROUTE_ROLES` / `rolesForPath`)

| Prefix path | Roles |
|---|---|
| `/thi-dua/admin` | `ADMIN` |
| `/thi-dua/dia-phuong` | `LOCALITY` |
| `/thi-dua/cham-diem` | `SPECIALIST` |
| `/thi-dua/duyet/lanh-dao-ban` | `BAN_LEADER` |
| `/thi-dua/duyet/hoi-dong-tdkt` | `COUNCIL_CHAIR`, `COUNCIL_VICE` |
| `/thi-dua/duyet/ban-thuong-truc` | `STANDING_COMMITTEE` |
| `/thi-dua/dashboard-tong-quan` | tất cả role nội bộ (không `LOCALITY`) |
| `/thi-dua/lich-su-thay-doi` | `ADMIN`, `SPECIALIST`, `BAN_LEADER`, `COUNCIL_CHAIR`, `COUNCIL_VICE`, `STANDING_COMMITTEE` — **KHÔNG `LOCALITY`** (B14 đã chốt: địa phương không xem lịch sử) |

`rolesForPath`: prefix khớp **dài nhất** thắng (để `/duyet/lanh-dao-ban` không nuốt bởi `/duyet`). Không khớp → `null`.

## 5. `defaultRouteForRole`

| Role | Route mặc định |
|---|---|
| `ADMIN` | `/thi-dua/dashboard-tong-quan` |
| `SPECIALIST` | `/thi-dua/dashboard-tong-quan` |
| `LOCALITY` | `/thi-dua/dia-phuong/trang-thai` |
| `BAN_LEADER` | `/thi-dua/duyet/lanh-dao-ban/{banId ?? 'ban1'}` |
| `COUNCIL_CHAIR` / `COUNCIL_VICE` | `/thi-dua/duyet/hoi-dong-tdkt` |
| `STANDING_COMMITTEE` | `/thi-dua/duyet/ban-thuong-truc` |

---

## 6. Sinh test

```ts
// CASES: [role, action, state | undefined, scope | undefined, expected]
// Sinh: mọi Role × mọi Action (state=undefined, scope=undefined) từ bảng §1
// + các dòng điểm ở §2 (bảng "Kết hợp role×state")
// + mọi dòng §3
// Cross-check property: can(u, a, {state}) === ROLE_ACTIONS[r].includes(a) && STATE_ACTIONS[state].includes(a)
```
Khi `ROLE_ACTIONS` / `STATE_ACTIONS` đổi → cập nhật file này **trước**, rồi sửa test theo.
