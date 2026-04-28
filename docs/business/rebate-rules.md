# Roles and Referral Rules (MVP)

## 0) RBAC Permission Model

### End-User Permissions (F0/F1/F2)
Permissions được check trong app layer dựa trên `users.tier`. Không có bảng `user_permissions` — deterministic theo tier.

```typescript
const PERMS = {
  f0: ['f0:set_rate_f1', 'f0:view_f1_list', 'f0:view_f1_volumes', 'f0:view_f2_list', 'f0:view_f2_volumes'],
  f1: ['f1:set_rate_f2', 'f1:view_f2_list', 'f1:view_f2_volumes'],
  f2: ['f2:view_own_volume'],
} as const;
```

| Tier | Permissions |
|------|-------------|
| F0 (CM) | `f0:set_rate_f1`, `f0:view_f1_list`, `f0:view_f1_volumes`, `f0:view_f2_list`, `f0:view_f2_volumes` |
| F1 (IB) | `f1:set_rate_f2`, `f1:view_f2_list`, `f1:view_f2_volumes` |
| F2 (User) | `f2:view_own_volume` |

### Admin RBAC (for admin web)
4 bảng: `admin_roles`, `admin_permissions`, `admin_role_permissions`, `admin_users`.

Default roles:

| Role | Permissions |
|------|-------------|
| `super_admin` | Toàn quyền (tất cả 32 permissions) |
| `ops_admin` | View logs, retry events, manage DLQ |
| `finance_admin` | View P&L, manage broker wallets, fee configs |
| `support_admin` | View users, webhook logs, rebate events |

Xem đầy đủ permissions trong `docs/db.sql` section 5.

## 1) Role Mapping

Role trong sản phẩm được map trực tiếp với tier trong hệ thống:

- `CM` = `F0`
- `IB` = `F1`
- `User` = `F2`

## 2) Quy tắc tạo tài khoản và xác định tier

### 2.1 CM (F0)

- `CM/F0` **không được tự tạo bởi người dùng**.
- Chỉ hệ thống hoặc admin nội bộ mới được gán role `CM/F0`.

### 2.2 IB (F1)

- Người dùng đăng ký tài khoản và login bình thường.
- Khi connect tài khoản sàn (có `exchangeUid`), backend gọi API broker để validate UID.
- Nếu UID thuộc nhánh `F1`, tài khoản được gán role `IB/F1`.

### 2.3 User (F2)

- Người dùng đăng ký tài khoản và login bình thường.
- Khi connect tài khoản sàn (có `exchangeUid`), backend gọi API broker để validate UID.
- Nếu UID thuộc nhánh `F2`, tài khoản được gán role `User/F2`.

### 2.4 Trường hợp không hợp lệ khi connect UID

- UID không tồn tại trong dữ liệu broker/ref.
- UID không thuộc broker scope hợp lệ.
- UID đã liên kết với tài khoản khác.
- Dữ liệu referral của UID không xác định được tier hợp lệ (`F1` hoặc `F2`).
- API validate của broker trả về invalid.

## 3) Quy tắc phân chia rebate theo role

### 3.1 CM (F0) -> IB (F1)

- `CM/F0` có quyền thiết lập mức rebate mà `IB/F1` được hưởng (đơn vị: `$ / lot`).
- Mức hưởng này áp dụng trên tổng số lot do mạng `F2` dưới `F1` tạo ra (volume của downline thuộc F1 đó).
- Cấu hình được lưu trong `users.rebate_rate_from_parent` của F1 (số dương, decimal).

### 3.2 IB (F1) -> User (F2)

- `IB/F1` có quyền thiết lập trực tiếp mức rebate cho `User/F2` theo đơn vị `$ / lot`.
- Không sử dụng cơ chế tỷ lệ dạng `3/7`, `2/8`, `1/9`.
- Mức rebate của `F1 -> F2` phải tuân theo policy tổng của broker và không vượt ngưỡng mà tầng trên đã cấu hình.
- Cấu hình được lưu trong `users.rebate_rate_from_parent` của F2 (số dương, decimal).

## 4) Ràng buộc hệ thống bắt buộc

- Role/tier phải nhất quán:
  - `CM <-> F0`
  - `IB <-> F1`
  - `User <-> F2`
- Không cho phép sửa role theo chiều nâng cấp trực tiếp bằng API public.
- Mọi thay đổi role `CM/F0` hoặc mức `rebate_rate_from_parent` phải được audit log bởi hệ thống nội bộ.
- Thay đổi `rebate_rate_from_parent` phải được lưu vào `rebate_rate_history` để đối soát.
- UID mapping phải được kiểm tra:
  - UID tồn tại và active tại nguồn broker
  - tier mapping hợp lệ theo dữ liệu ref
  - cùng broker scope
  - một UID chỉ map tới một user account trong hệ thống
- `broker_wallets` phải được thiết lập trước khi broker có thể funding contract:
  - Mỗi broker cần ít nhất 1 ví treasury active
  - Relay fund wallet dùng để trả gas cho các tx allocate

## 5) Gợi ý validate backend (MVP)

- Khi register/login:
  - Chỉ tạo account người dùng ở trạng thái chưa xác định tier (`pending_link` hoặc tương đương).
- Khi connect sàn bằng UID:
  - Gọi `brokers.ref_api_url` để validate UID với broker.
  - Nhận kết quả từ broker: tier (F1/F2) và thông tin parent.
  - Map tier vào user: F1 => role `IB/F1`, F2 => role `User/F2`.
  - Nếu UID không map được hoặc không hợp lệ => reject liên kết.
- Khi F0 set rebate cho F1:
  - Gọi `PUT /users/:userId/rebate-rate` (hoặc admin endpoint).
  - Chỉ chấp nhận giá trị `$ / lot` hợp lệ (số dương, theo precision hệ thống).
  - Cập nhật `users.rebate_rate_from_parent` cho F1 và tạo bản ghi trong `rebate_rate_history`.
- Khi F1 set rebate cho F2:
  - Tương tự, chỉ chấp nhận giá trị `$ / lot` hợp lệ.
  - Cập nhật `users.rebate_rate_from_parent` cho F2 và tạo bản ghi trong `rebate_rate_history`.
  - Phải nằm trong giới hạn policy do hệ thống/broker định nghĩa.
- Khi set policy cho CM:
  - Chỉ endpoint nội bộ/system có quyền ghi cấu hình.