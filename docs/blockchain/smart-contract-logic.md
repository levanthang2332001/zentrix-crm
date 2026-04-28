# Đặc tả Luồng Contract (Bản nháp để Review)

## 1) Mục tiêu

Smart contract đóng vai trò vault phân phối rebate cho hệ thống FOREX (MT4/MT5):

- Tổng volume giao dịch của toàn bộ user trong kỳ tạo ra tổng rebate.
- Tổng rebate hợp lệ được nạp vào contract từ hệ thống backend.
- Mỗi user chỉ được rút đúng phần đã được phân bổ theo rule phân tầng (`CM/F0 -> IB/F1 -> User/F2`).
- Khi user claim, phí được trừ vào số user nhận và phân bổ: gas cho relayer + phí cho dev/protocol.

## 2) Nguyên tắc cốt lõi

- `Total volume` của user là cơ sở tính `rebate gross`.
- Backend tính toán phân bổ off-chain và ghi vào `split_ledger`.
- Contract không tự tính nghiệp vụ referral phức tạp; contract chỉ thực thi quyền rút theo allocation đã được xác nhận.
- Không user nào được rút quá số đã được cấp phát.
- **Phí claim**: Khi user claim, tổng **0.5 USDT** được trừ từ gross_amount, chia:
  - **0.1 USDT** → trả gas cho relayer (BNB gas reimbursement)
  - **0.4 USDT** → về dev/protocol treasury

## 3) Fee Model (Claim-Time Deduction - Option A)

```
split_ledger example:
┌─────────────────────────────────────────────────┐
│ gross_amount     = 1.000000 USDT (allocated)    │
│ fee_amount       = 0.500000 USDT (total fee)    │
│   ├── relayer_fee = 0.100000 USDT (gas)         │
│   └── dev_fee     = 0.400000 USDT (protocol)    │
│ net_amount       = 0.500000 USDT (user nhận)    │
└─────────────────────────────────────────────────┘

Khi user claim thành công:
  - User nhận:     0.500000 USDT vào ví user
  - Relayer nhận:  0.100000 USDT (gas reimbursement)
  - Dev nhận:      0.400000 USDT (protocol fee)

User chỉ nhận 0.5 thay vì 1.0 (đã mất 0.5 fee)
```

## 4) User Model (FOREX - MT4/MT5)

### Cấu trúc User

Một user có thể kết nối với nhiều broker, và có **tier khác nhau trên mỗi broker**.

```
Trần Văn A:
├── Kết nối broker: Exness
│   └── users row: tier = F1, wallet = 0xABC...
│       └── Có 3 tài khoản MT4/MT5 → user_accounts
│           ├── MT4 | account_uid = 12345678
│           ├── MT5 | account_uid = 87654321
│           └── MT4 | account_uid = 11111111
│
└── Kết nối broker: IC Markets
    └── users row: tier = F2, wallet = 0xABC... (khác tier trên Exness)
        └── Có 1 tài khoản MT5 → user_accounts
            └── MT5 | account_uid = 55555555
```

### Mối quan hệ

- **1 user = Nhiều rows trong `users`** (1 row per broker)
- **1 user row = 1 broker = 1 tier** (F0/F1/F2)
- **1 user row = Nhiều `user_accounts`** (MT4/MT5 accounts)
- **1 user = 1 wallet_address** (dùng chung cho tất cả broker)
- **1 user = Nhiều `rebate_rate_from_parent`** (khác nhau trên mỗi broker)

## 5) Data Flow tổng quát

1. Broker gửi webhook rebate về backend (payload: `broker`, `account_uid`/MT4_ID, `volume`).
2. Backend xác thực webhook, tra `user_accounts` để tìm `user_id` → tra `users` để lấy wallet + tier.
3. Backend tính split và tạo ledger allocations (đã bao gồm fee trừ vào net_amount).
4. Backend tổng hợp số tiền cần cấp phát và gửi vào contract (funding).
5. Backend (hoặc relayer) ghi allocation vào contract theo từng payout id.
6. User claim từ contract → contract tách split: user + relayer gas + dev fee.
7. Backend đồng bộ trạng thái claim về DB.

## 6) Invariants bắt buộc

- `sum(allocated_amount)` của một event không vượt `event.total_usdt` (sau khi trừ fee theo rule hệ thống).
- `claimed_amount(user)` <= `allocated_amount(user)` tại mọi thời điểm.
- Một allocation id chỉ được claim đúng 1 lần.
- Trạng thái off-chain và on-chain phải đối soát được theo `payout_id`/`tx_hash`.
- **Fee split bắt buộc**: `gross_amount - net_amount = 0.5 USDT` (= relayer_fee + dev_fee)

## 7) Mapping với DB hiện tại

### Users Table

```sql
users:
  user_id          -- UUID primary key
  broker_id        -- FK → brokers (user đăng ký qua broker nào)
  tier             -- F0, F1, F2 (khác nhau trên mỗi broker)
  wallet_address   -- Ví BEP-20, dùng chung cho tất cả broker
  email            -- Email user
  rebate_rate_from_parent  -- Rate ($/lot), khác nhau trên mỗi broker
  parent_user_id   -- FK → users (F0 là root, F1 có parent = F0, F2 có parent = F1)
  depth            -- 0=F0, 1=F1, 2=F2
  ltree_path       -- Path cho hierarchical query
  status           -- active, suspended, deleted
```

### User Accounts Table (MT4/MT5)

```sql
user_accounts:
  account_id       -- UUID primary key
  user_id          -- FK → users.user_id
  broker_id        -- FK → brokers.broker_id
  platform         -- ENUM ('mt4', 'mt5')
  account_uid      -- MT4/MT5 login ID (unique per broker)
  is_active        -- Boolean
```

### Broker Wallets

```sql
broker_wallets:
  wallet_type = treasury   → gửi USDT vào contract (funding)
  wallet_type = relay_fund → trả gas BNB cho các tx allocate (relayer fee không lấy từ đây, lấy từ dev_fee)
```

### Split Ledger

```sql
split_ledger:
  gross_amount    -- Tổng allocated (trước fee)
  relayer_fee     -- 0.1 USDT (cố định)
  dev_fee         -- 0.4 USDT (cố định)
  fee_amount      -- GENERATED: relayer_fee + dev_fee
  net_amount      -- = gross - fee (user nhận)
  sc_payout_id    -- Định danh payout map sang contract
  claim_status    -- pending_claim, claimed, expired, swept
  claim_tx_hash   -- Bằng chứng claim thành công
  expires_at      -- Thời điểm hết hạn claim
```

### Khác

- `broker.ref_api_url`: API endpoint để validate UID với broker (dùng trong connect-broker-uid)
- `sc_sync_log`: theo dõi allocate/claim sync trạng thái

## 7b) Funding Flow (Contract)

1. Broker xác định tổng `total_usdt` cần nạp vào contract (tổng gross_amount đã tính).
2. Hệ thống gửi USDT từ `broker_wallets` (wallet_type = `treasury`) vào contract qua `fund()`.
3. Relayer gọi `allocate(payoutId, recipient, grossAmount, netAmount, relayerFee, devFee, expiry)` cho từng ledger row.
4. User claim từ contract → contract split:
   - Chuyển `netAmount` cho user
   - Chuyển `relayerFee` cho relayer
   - Chuyển `devFee` cho dev treasury
5. Backend sync trạng thái claim về DB.

## 8) Contract Interface

### Core Functions

```solidity
// Admin/Relayer functions
function fund(uint256 amount) external;
function allocate(
    bytes32 payoutId,
    address recipient,
    uint256 grossAmount,
    uint256 netAmount,      // amount user nhận
    uint256 relayerFee,     // gas reimbursement
    uint256 devFee,         // protocol fee
    uint256 expiry
) external onlyRelayer;

function claim(bytes32 payoutId) external;
function pause() external onlyAdmin;
function unpause() external onlyAdmin;
function sweepExpired(bytes32[] calldata payoutIds, address payable to) external onlyAdmin;

// View functions
function getAllocation(bytes32 payoutId) external view returns (Allocation memory);
```

### Allocation State

```solidity
struct Allocation {
    address recipient;
    uint256 grossAmount;
    uint256 netAmount;       // amount goes to user
    uint256 relayerFee;      // amount goes to relayer
    uint256 devFee;          // amount goes to dev treasury
    uint256 expiry;
    bool claimed;
}
```

### Events

```solidity
event Allocated(bytes32 indexed payoutId, address recipient, uint256 netAmount, uint256 relayerFee, uint256 devFee);
event Claimed(bytes32 indexed payoutId, address recipient, uint256 netAmount, uint256 relayerFee, uint256 devFee);
event Swept(bytes32[] payoutIds, address indexed to, uint256 totalAmount);
```

## 9) Quy tắc claim

- User chỉ claim về chính ví đã đăng ký (`users.wallet_address` — ví whitelisted).
- Claim amount được split ngay trong contract:
  - `netAmount` → user
  - `relayerFee` → relayer address (stored in contract)
  - `devFee` → dev treasury address (stored in contract)
- Claim thành công -> ledger chuyển `pending_claim` sang `claimed`.
- Quá hạn (`expires_at`) -> không còn quyền claim theo policy backend (nếu contract hỗ trợ expiry thì enforce on-chain; nếu không thì backend chặn allocate mới cho khoản đã hết hạn).

## 10) Security yêu cầu

- Chỉ relayer được quyền ghi allocation (role-based access trong contract).
- Claim phải có cơ chế chống replay (nonce/payout id consumed).
- Có cơ chế pause khẩn cấp cho admin multisig.
- Mọi thay đổi quyền admin/relayer phải qua multisig.
- Relayer fee và dev treasury address phải được set bởi admin, không thể thay đổi sau khi allocate.

## 11) Những điểm cần chốt trước khi code contract

- Đơn vị tiền tệ on-chain:
  - token decimals (USDT BEP-20 thường là 18 hoặc 6 tùy token triển khai thực tế)
  - quy tắc rounding giữa DB (`NUMERIC(18,6)`) và token decimals
- Mô hình allocation:
  - push full allocation lên chain theo từng ledger row
  - hoặc dùng Merkle root distribution theo batch
- Expiry:
  - enforce on-chain hay chỉ off-chain
- Sweep:
  - số dư hết hạn xử lý về đâu (treasury hay recycle pool)
- Relayer và Dev treasury address

## 12) Fee Config Trong DB

`fee_configs` chỉ còn gas_fee, dev_fee là fixed constant trong contract:

| Field | Giá trị | Mô tả |
|-------|---------|-------|
| `gas_fee` | 0.1 USDT | USDT trả cho relayer (gas reimbursement) |

**Dev fee (0.4 USDT)** được hard-code trong SMC contract, không lưu trong DB.

## 13) Scaling with Merkle Tree Distribution (Phase 2+)

Khi hệ thống đạt quy mô hàng ngàn user mỗi đợt rebate, việc gọi `allocate()` từng người sẽ quá tốn kém. Giải pháp là sử dụng Merkle Tree:

### Flow Merkle:
1. **Backend**: Gom toàn bộ `split_ledger` rows của một đợt distribution (batch) thành một danh sách leaf nodes: `H(recipient, netAmount, relayerFee, devFee, payoutId)`.
2. **Backend**: Xây dựng Merkle Tree và lấy **Merkle Root**.
3. **Contract**: Admin/Relayer gọi `publishRoot(root, totalAmount, expiry)`. Chỉ tốn gas cho 1 transaction duy nhất.
4. **User**: Khi claim, user gửi kèm **Merkle Proof**. Contract xác thực proof đối với root đã lưu trước khi chuyển tiền.

### Lợi ích:
- **Tiết kiệm Gas**: Giảm từ O(N) xuống O(1) cho việc nạp dữ liệu lên chain.
- **Tốc độ**: Cấp phát cho 1 triệu user trong cùng 1 block.
- **Security**: Dữ liệu được bảo vệ bằng mật mã học (cryptography).

## 14) Review kết luận

Ý tưởng bạn đưa ra là đúng hướng cho non-custodial flow:

- Tổng rebate do volume tạo ra được funding vào contract.
- User chỉ rút đúng phần đã phân bổ.
- Fee được trừ tại thời điểm claim, chia cho relayer (gas) và dev (protocol fee).
- User model hỗ trợ FOREX (MT4/MT5) với nhiều accounts và nhiều brokers.

Để triển khai an toàn, cần chốt thêm 4 điểm kỹ thuật quan trọng:

- decimals + rounding
- allocation model (direct vs merkle)
- expiry enforcement
- sweep policy

Khi 4 điểm này được chốt, backend hiện tại có thể nối sang contract với thay đổi nhỏ ở `chain-sync` module.

---

## Các File Tham khảo

| File | Mục đích |
|------|---------|
| `docs/db.sql` | Lược đồ database đầy đủ (PostgreSQL 15+) |
| `docs/spec.md` | API Backend, quy tắc domain, background jobs |
| `docs/Roles.md` | User roles và quy tắc phân phối rebate |
| `docs/smc-build-flow.md` | Kế hoạch thực thi phát triển SMC |