# Glossary - Thuật ngữ Zentrix

Tài liệu này định nghĩa các thuật ngữ chuyên môn được sử dụng trong hệ thống Zentrix để đảm bảo sự thống nhất giữa AI, Developer và Stakeholders.

## 1. Vai trò người dùng (User Roles)

*   **F0 (Country Manager - CM)**: Người đứng đầu một quốc gia hoặc khu vực. Là người nhận rebate trực tiếp từ Broker và phân phối lại cho các tầng dưới.
*   **F1 (Introducing Broker - IB)**: Người môi giới trực tiếp dưới quyền F0. Nhận hoa hồng dựa trên khối lượng giao dịch của bản thân và các F2 do mình giới thiệu.
*   **F2 (User)**: Người giao dịch trực tiếp. Nhận rebate từ F1 hoặc F0 tùy theo cấu trúc cây referral.

## 2. Thuật ngữ Tài chính & Trade

*   **Rebate**: Khoản tiền hoàn lại từ phí giao dịch mà sàn (Broker) trả cho người giới thiệu hoặc người giao dịch.
*   **Lot**: Đơn vị tiêu chuẩn để đo khối lượng giao dịch. 
*   **Rebate Rate ($/lot)**: Tỷ lệ tiền hoàn lại trên mỗi đơn vị Lot giao dịch.
*   **Total USDT**: Tổng số tiền rebate mà F0 nhận được từ sàn cho một giao dịch hoặc một khoảng thời gian.
*   **Split**: Hành động chia nhỏ tổng số tiền rebate cho các tầng F0, F1, F2 theo tỷ lệ đã cam kết.
*   **Pending Balance**: Số dư đã được tính toán nhưng chưa được "Confirm" hoặc chưa đủ điều kiện để rút (Claim).

## 3. Thuật ngữ Kỹ thuật

*   **Idempotency (Tính duy nhất)**: Đảm bảo một yêu cầu (ví dụ: webhook từ sàn) chỉ được xử lý đúng một lần, dù sàn có gửi lại nhiều lần do lỗi mạng.
*   **HMAC (Hash-based Message Authentication Code)**: Cơ chế xác thực sử dụng mã băm để đảm bảo webhook gửi từ sàn là thật và không bị chỉnh sửa.
*   **Merkle Tree**: Cấu trúc dữ liệu hình cây dùng để xác thực danh sách nhận tiền trên Blockchain một cách hiệu quả và tiết kiệm gas.
*   **Vault**: Smart Contract đóng vai trò là "kho tiền", nơi lưu trữ USDT và thực hiện chi trả cho người dùng.
*   **Relayer**: Thành phần trung gian giúp đẩy dữ liệu từ Backend lên Blockchain và trả phí Gas.
