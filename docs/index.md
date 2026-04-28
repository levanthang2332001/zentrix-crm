# Zentrix Master Documentation Index

Chào mừng bạn đến với trung tâm tri thức của **Zentrix Backend**. File này đóng vai trò là "Bản đồ nguồn" giúp AI và Developer hiểu toàn bộ hệ sinh thái chỉ trong một lần đọc.

---

## 1. Tầm nhìn & Mục tiêu (Core Vision)
Hệ thống Zentrix là nền tảng quản lý và phân phối Rebate (hoàn tiền) đa tầng cho thị trường Broker/Exchange. 
- **Triết lý**: Off-chain First (tính toán nhanh, linh hoạt) -> On-chain Settlement (minh bạch, không chiếm dụng vốn).
- **Mô hình**: Referral phân cấp (F0 -> F1 -> F2) với tỷ lệ tính theo `$ / lot`.

---

## 2. Bản đồ tài liệu (Document Manifest)

### 📂 Business (Nghiệp vụ)
| Tài liệu | Đối tượng hiểu | Mục đích |
| :--- | :--- | :--- |
| [glossary.md](./business/glossary.md) | **Tất cả** | Định nghĩa thuật ngữ (CM, IB, Lot, Rebate...). |
| [rebate-rules.md](./business/rebate-rules.md) | **Kỹ thuật/Business** | Quy tắc phân phối hoa hồng F0/F1/F2. |

### 📂 Technical (Kỹ thuật)
| Tài liệu | Đối tượng hiểu | Mục đích |
| :--- | :--- | :--- |
| [api-specification.md](./technical/api-specification.md) | **Backend Dev** | Đặc tả API, quy tắc Webhook, Worker. |
| [database-schema.sql](./technical/database-schema.sql) | **Database/Data** | Cấu trúc bảng, quan hệ (ERD), Partitioning. |
| [data-dictionary.md](./technical/data-dictionary.md) | **Data** | Chi tiết từng field trong Database. |
| [auth-flow.md](./technical/auth-flow.md) | **Định danh** | Quy trình Login Clerk, JWT và link wallet. |
| [schema-erd.md](./technical/schema-erd.md) | **Data** | Sơ đồ quan hệ thực thể. |

### 📂 Blockchain (On-chain)
| Tài liệu | Đối tượng hiểu | Mục đích |
| :--- | :--- | :--- |
| [smart-contract-logic.md](./blockchain/smart-contract-logic.md) | **SMC Dev** | Quy tắc Vault, Merkle Tree và Settlement. |
| [smc-dev-flow.md](./blockchain/smc-dev-flow.md) | **SMC Dev** | Quy trình build/test Smart Contract. |

### 📂 Ops (Vận hành)
| Tài liệu | Đối tượng hiểu | Mục đích |
| :--- | :--- | :--- |
| [deployment-guide.md](./ops/deployment-guide.md) | **DevOps** | Hướng dẫn Docker, Env và CI/CD. |

---

## 3. Mối liên kết giữa các thành phần (Traceability)

1. **Từ Webhook đến Ledger**:
   - Webhook (`api-specification.md`) -> Tính toán theo Rate (`rebate-rules.md`) -> Lưu vào Bảng (`database-schema.sql`).
2. **Từ Ledger lên Blockchain**:
   - `split_ledger` (`database-schema.sql`) -> Sync Log (`api-specification.md`) -> Allocate/Claim (`smart-contract-logic.md`).

---

## 4. Các quy tắc "Bất biến" (Critical Invariants)

Để hệ thống luôn an toàn, AI/Developer phải tuân thủ:
- **Idempotency**: `(broker_id, tx_id)` là duy nhất. Không bao giờ được xử lý 1 webhook 2 lần.
- **Sum Integrity**: Tổng tiền chia cho các con (F1, F2) không bao giờ được vượt quá số tiền F0 nhận từ sàn.
- **Auditability**: Mọi thay đổi về tỷ lệ hoa hồng phải nằm trong `rebate_rate_history`.
- **Security**: Chỉ ví Whitelisted mới được phép Claim tiền từ Smart Contract.

---

## 5. Trạng thái dự án (Current State)
- **Phase 1**: NestJS bootstrap, Docker API/DB infra, health module đã sẵn sàng.
- **Phase 2**: Database foundation nằm ở `src/database/schema.sql`.
- **Next Step**: Triển khai Common Infrastructure và các API modules theo `PLAN.md`.
