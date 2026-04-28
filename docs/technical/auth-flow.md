# Authentication & Identity Flow

Tài liệu này đặc tả cách hệ thống Zentrix định danh người dùng và quản lý quyền truy cập.

## 1. Auth Provider — Clerk Email (Phase 1)

Hệ thống sử dụng **Clerk** làm auth provider cho Phase 1, cho phép đăng nhập bằng email/password mà không cần ví Web3.

### Quy trình Login (Phase 1):
1. **Frontend**: User đăng nhập bằng email/password qua Clerk.
2. **Frontend**: Nhận Clerk session token (`__session` cookie hoặc Clerk JWT).
3. **Frontend**: Gửi Clerk token lên `POST /auth/login`.
4. **Backend**:
   - Verify Clerk token bằng `clerkClient.verifyToken()`.
   - Extract email từ Clerk session.
   - Nếu user chưa tồn tại theo email → tạo user mới (chưa có wallet, status `no_wallet`).
   - Nếu user đã tồn tại → cập nhật last login.
   - Trả về **JWT của hệ thống** (Access Token & Refresh Token).

---

## 2. JWT & Session Management

- **Access Token**: ngắn hạn (15-60 phút). Chứa `user_id`, `email`, `wallet_address` (nullable), `tier`.
- **Refresh Token**: dài hạn (7-30 ngày). Dùng để lấy Access Token mới mà không cần đăng nhập lại.
- **Guard**: Tất cả API yêu cầu `Authorization: Bearer <jwt>` được kiểm tra bởi NestJS Passport/JWT Guard.

---

## 3. Wallet Linking (Phase 2)

Sau khi đăng nhập bằng email, user có thể liên kết ví Web3 để thực hiện các tác vụ on-chain (claim).

### Quy trình Link Wallet (Email Confirmation):
1. **Frontend**: User nhập địa chỉ ví (wallet address).
2. **Frontend**: Gọi `POST /auth/request-wallet-link` với `walletAddress`.
3. **Backend**:
   - Tạo verification code (6 chữ số) hoặc magic link.
   - Gửi email xác nhận đến email của user (đã đăng nhập qua Clerk).
   - Lưu code/link với expiry (15 phút).
4. **User**: Mở email, click link hoặc nhập code.
5. **Backend**: Verify code/link → cập nhật `users.wallet_address`, đổi status từ `no_wallet` → `active`.

---

## 4. Tier & Role Resolution

Sau khi login, User ở trạng thái "vô danh" về mặt referral cho đến khi thực hiện **Connect Broker UID**:

1. User gọi `POST /accounts/connect-broker-uid` (đã đặc tả trong `spec.md`).
2. Backend xác thực UID với Broker.
3. Nếu thành công, `users.tier` được cập nhật (F1 hoặc F2).
4. Quyền hạn (Permissions) được tự động kích hoạt dựa trên Tier này.

---

## 5. Bảo mật Identity

- **Verification Code**: Code chỉ có hiệu lực 15 phút, sử dụng 1 lần.
- **Wallet Whitelisting**: Chỉ những địa chỉ ví đã được verify mới được phép rút tiền (Claim) từ Smart Contract.
- **Audit**: Các hành động nhạy cảm (Đổi rate, connect UID) luôn đính kèm `user_id` từ JWT để audit.
- **Clerk Token**: Backend verify token qua Clerk SDK, không chấp nhận token đã hết hạn hoặc bị thu hồi.
