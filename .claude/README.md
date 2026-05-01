## 💡 1. Các kịch bản sử dụng (Workflow Scenarios)

### 🆕 Bắt đầu một tính năng mới

- **Bước 1 (Nghiên cứu):** Dùng `@planner-researcher` để hỏi về kiến trúc.
  - _Ví dụ:_ `@planner-researcher tôi muốn thêm tính năng OTP qua Telegram, hãy đề xuất schema database và các service cần thiết.`
- **Bước 2 (Lập kế hoạch):** Gõ `/plan` để Claude liệt kê các bước triển khai cụ thể.
- **Bước 3 (Code mẫu):** Gõ `/cook` để tạo boilerplate.
  - _Ví dụ:_ `/cook tạo NestJS Controller và Service cho UserOTP.`

### 🛠 Viết Code & Refactor

- **Khi muốn code gọn hơn:** Triệu hồi skill `Minimalist Refactor`.
  - _Câu lệnh:_ `Dùng skill minimal-refactor để tối ưu lại file auth.service.ts, ưu tiên dùng các decorator có sẵn của NestJS.`
- **Khi chỉnh sửa xong:** Hệ thống sẽ **tự động chạy ESLint Fix** (nhờ hooks), bạn không cần chạy `npm run lint` thủ công.

### 🐛 Sửa lỗi (Debugging)

- **Lỗi Logic/Runtime:** Gõ `/debug` kèm theo đoạn log lỗi. Claude sẽ tự phân tích và đề xuất chỗ sửa.
- **Lỗi CI/CD:** Nếu GitHub Actions báo đỏ, hãy gõ `/fix-ci`. Claude sẽ đọc file workflow và log để tìm nguyên nhân.
- **Lỗi Test:** Gõ `/fix-test` để Claude tự chạy lại bộ test và sửa code cho đến khi pass.

### 📝 Trước khi tạo Pull Request

- **Tóm tắt thay đổi:** Gõ `/whatup`. Nó sẽ liệt kê tất cả những gì bạn đã làm để bạn copy vào description của PR.
- **Tự Review:** Gõ `/code-reviewer`. Claude sẽ đóng vai một senior khó tính để tìm lỗi tiềm ẩn trước khi bạn đẩy code lên.

### 📝 Hãy kiểm tra database

- Thay vì nói "Hãy kiểm tra database hộ tôi", hãy dùng `@database-admin kiểm tra xem index của bảng User đã tối ưu chưa?`. Các Agent này có System Prompt riêng cực kỳ chuyên sâu.

### 📝 Test

- Bạn có thể gõ `/test cho file này` để Claude tự động dùng bộ skill viết test chuyên sâu thay vì chỉ bảo "viết test đi".

---

## 🛠 2. Các tính năng tự động

1. **Kiểm tra trước khi commit (Husky)**:
   - Mỗi khi bạn `git commit`, hệ thống sẽ tự động chạy `pnpm lint`. Nếu có lỗi, commit sẽ bị chặn để đảm bảo code luôn sạch.

---

## ⚡ 3. Lệnh nhanh (Cheat Sheet)

| Bạn muốn làm gì?               | Lệnh khuyên dùng                             |
| :----------------------------- | :------------------------------------------- |
| **Hỏi về kiến trúc/DB**        | `@planner-researcher` hoặc `@database-admin` |
| **Viết code nhanh**            | `/cook`                                      |
| **Sửa lỗi gấp**                | `/debug` hoặc `/fix`                         |
| **Review lại code vừa viết**   | `/code-reviewer`                             |
| **Xem hôm nay đã làm gì**      | `/whatup`                                    |
| **Refactor theo chuẩn NestJS** | Dùng skill `minimal-refactor`                |

---

## 🔗 4. Quản lý Git nâng cao với MCP

Bạn có thể tận dụng **MCP Github** để thực hiện các thao tác Git phức tạp ngay trong chat:

- **Tạo Pull Request**: `@git-manager hãy tạo PR cho branch hiện tại với tiêu đề 'feat: add user otp'`.
- **Review PR**: `@code-reviewer hãy review các thay đổi trong PR #12`.
- **Check trạng thái build**: `@git-manager kiểm tra xem các status check của PR này đã pass chưa?`.

---

## ⚠️ 5. Một số lưu ý quan trọng

- **Tùy chỉnh thêm**: Bạn có thể sửa tệp `.claude/settings.json` để thêm các hook mới (ví dụ: tự động chạy unit test khi sửa logic).
