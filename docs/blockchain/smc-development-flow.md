# Luồng Xây dựng SMC (Kế hoạch Thực thi)

## Phase 0 - Khóa Scope


| Task                                           | Owner                             | Deliverable              | Exit Criteria                                          |
| ---------------------------------------------- | --------------------------------- | ------------------------ | ------------------------------------------------------ |
| Khóa token config (address, decimals, chain)   | Product + Blockchain Lead         | `token-config.md`        | Team đồng ý single token + decimals conversion rule |
| Khóa payout model (`direct` hoặc `merkle`)    | Product + Smart Contract Engineer | ADR short note           | Model được chọn với rationale và trade-off            |
| Khóa expiry và sweep policy                   | Product + Compliance + Tech Lead  | `policy-expiry-sweep.md` | Expiry và fund destination được approve                   |
| Khóa role model (`admin`, `relayer`, `pauser`) | Tech Lead                         | Access matrix            | Tất cả privileged actions được map với roles                 |
| Khóa funding source (`broker_wallets`)         | Tech Lead + Product               | Funding flow doc         | Treasury wallet là sole funder, relay wallet trả gas |


---

## Phase 1 - Thiết kế Contract Interface


| Task                             | Owner                             | Deliverable             | Exit Criteria                                        |
| -------------------------------- | --------------------------------- | ----------------------- | ---------------------------------------------------- |
| Định nghĩa state model cho payout    | Smart Contract Engineer           | State diagram           | Bao gồm `allocated`, `claimed`, `expired`, `swept`    |
| Định nghĩa function signatures       | Smart Contract Engineer           | `contract-interface.md` | Bao gồm params, auth, revert reasons                |
| Định nghĩa events cho DB mapping     | Backend + Smart Contract Engineer | Event schema            | `payoutId` maps 1:1 với `split_ledger.sc_payout_id` |
| Định nghĩa error codes/custom errors | Smart Contract Engineer           | Error list              | Mọi failure path có deterministic error           |


Minimum interface (MVP):

- `fund(uint256 amount)` — called by broker treasury wallet
- `allocate(bytes32 payoutId, address recipient, uint256 amount, uint256 expiry)`
- `claim(bytes32 payoutId)` hoặc `claimMany(bytes32[] payoutIds)`
- `pause()` / `unpause()`
- `sweepExpired(bytes32[] payoutIds, address to)` (nếu policy yêu cầu)

---

## Phase 2 - Môi trường Phát triển


| Task                        | Owner                   | Deliverable                      | Exit Criteria                                    |
| --------------------------- | ----------------------- | -------------------------------- | ------------------------------------------------ |
| Setup Foundry project       | Smart Contract Engineer | `contracts/`, `test/`, `script/` | `forge build` passes                             |
| Thêm static analysis tooling | Smart Contract Engineer | Slither config                   | Local static scan runs clean for critical issues |
| Thêm CI checks              | DevOps                  | CI workflow                      | PR requires build + tests + static scan          |


---

## Phase 3 - Triển khai Contract


| Task                         | Owner                   | Deliverable                      | Exit Criteria                                    |
| ---------------------------- | ----------------------- | -------------------------------- | ------------------------------------------------ |
| Implement access control     | Smart Contract Engineer | Role-guarded methods             | Unauthorized calls revert correctly              |
| Implement allocation storage | Smart Contract Engineer | `payoutId -> allocation` mapping | Duplicate `payoutId` rejected                    |
| Implement claim flow         | Smart Contract Engineer | `claim` logic                    | Double-claim impossible                          |
| Implement pause/emergency    | Smart Contract Engineer | Pause guards                     | Claim/allocate blocked when paused (as designed) |
| Implement expiry/sweep       | Smart Contract Engineer | Expiry logic                     | Expired payout không thể claimed                 |


Implementation constraints:

- Sử dụng `SafeERC20`.
- Sử dụng `nonReentrant` on claim paths.
- Sử dụng custom errors thay vì revert strings where possible.
- Giữ arithmetic integer-only, no floating logic.

---

## Phase 4 - Chiến lược Testing


| Task                         | Owner                   | Deliverable       | Exit Criteria                                |
| ---------------------------- | ----------------------- | ----------------- | -------------------------------------------- |
| Unit tests cho happy paths   | Smart Contract Engineer | `test/*.t.sol`    | Allocate và claim pass                      |
| Unit tests cho failure paths | Smart Contract Engineer | Negative test set | Mọi invalid states revert as expected        |
| Invariant tests              | Smart Contract Engineer | Invariant suite   | `claimed <= allocated <= funded` luôn true |
| Fuzz tests                   | Smart Contract Engineer | Fuzz suite        | Randomized input không break invariants   |


Required test matrix:

- Allocate success
- Allocate duplicate payoutId fail
- Claim success
- Claim duplicate fail
- Claim wrong recipient fail
- Claim expired fail
- Unauthorized allocate fail
- Pause behavior for allocate/claim
- Sweep only expired payouts

---

## Phase 5 - Tích hợp với Backend


| Task                                       | Owner                             | Deliverable              | Exit Criteria                                 |
| ------------------------------------------ | --------------------------------- | ------------------------ | --------------------------------------------- |
| Định nghĩa deterministic `payoutId` generation | Backend + Smart Contract Engineer | Shared utility spec      | Same input -> same `payoutId` in all services |
| Implement relayer call flow                | Backend Engineer                  | `chain-sync` integration | `sc_sync_log` gets tx hash và final status   |
| Implement event listener / indexer         | Backend Engineer                  | Sync worker              | `Allocated`/`Claimed` reflected in DB         |
| Add reconciliation job                     | Backend Engineer                  | Cron/worker              | Any DB-chain drift detected và patched       |


Critical mapping rule:

- `split_ledger.sc_payout_id` là primary key bridge to on-chain allocation state.

---

## Phase 6 - Security Review


| Task                        | Owner                               | Deliverable   | Exit Criteria                              |
| --------------------------- | ----------------------------------- | ------------- | ------------------------------------------ |
| Internal security checklist | Smart Contract Engineer + Tech Lead | Review report | No unresolved critical findings            |
| External audit (nếu budget)  | External auditor                    | Audit report  | Critical/high issues fixed và re-verified |
| Key management review      | DevOps + Security                   | Runbook       | Multisig + relayer key policy approved     |


Security checklist:

- Replay và duplicate allocation protection
- Strict role enforcement
- Reentrancy protection
- Pause path hoạt động during incident
- Sweep không thể drain non-expired funds

---

## Phase 7 - Testnet Rollout


| Task                             | Owner                   | Deliverable              | Exit Criteria                                |
| -------------------------------- | ----------------------- | ------------------------ | -------------------------------------------- |
| Deploy to testnet                | Smart Contract Engineer | Deployment artifacts     | Verified contract và addresses published    |
| Wire backend to testnet contract | Backend Engineer        | Env + integration branch | End-to-end test flow passes                  |
| Run E2E scenarios                | QA + Backend            | E2E report               | Tất cả critical user journeys pass              |
| Validate observability           | DevOps                  | Dashboards/alerts        | Alerts cho tx failures và sync drift active |


E2E path:

- webhook ingest -> split_ledger rows -> allocate tx -> claim tx -> DB sync final.

---

## Phase 8 - Mainnet Readiness và Launch


| Task                        | Owner                         | Deliverable        | Exit Criteria                         |
| --------------------------- | ----------------------------- | ------------------ | ------------------------------------- |
| Freeze release candidate    | Tech Lead                     | RC tag             | No pending schema/interface changes   |
| Mainnet deploy via multisig | Smart Contract Engineer + Ops | Mainnet addresses  | Deployment signed và verified        |
| Gradual traffic ramp-up     | Ops + Product                 | Rollout plan       | Brokers enabled in batches safely     |
| Incident drill              | Ops + Engineering             | Runbook simulation | Team có thể execute pause/recover in SLA |


---

## RACI Quick View

- Product: policy và business constraints
- Smart Contract Engineer: contract architecture, code, tests
- Backend Engineer: chain-sync integration và reconciliation
- DevOps/Security: CI, key management, monitoring
- QA: E2E và failure scenario validation

---

## Definition of Done (SMC Track)

SMC track hoàn thành khi:

- Contract functions và events được freeze và document.
- Test suite (unit + invariant + fuzz) passes trong CI.
- DB-chain mapping via `sc_payout_id` stable trong testnet E2E.
- Reconciliation job prove no unresolved drift.
- Security critical findings resolved.
- Mainnet deploy và controlled rollout complete.

---

## Các File Tham khảo

| File | Mục đích |
|------|---------|
| `docs/db.sql` | Lược đồ database đầy đủ (PostgreSQL 15+) |
| `docs/spec.md` | API Backend, quy tắc domain, background jobs |
| `docs/Roles.md` | User roles và quy tắc phân phối rebate |
| `docs/contract.md` | Luồng smart contract và ánh xạ DB |
