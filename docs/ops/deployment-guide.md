# Deployment & Infrastructure Guide

Hướng dẫn thiết lập môi trường chạy Zentrix Backend MVP.

## 1. Yêu cầu hệ thống (Prerequisites)

- **Docker & Docker Compose** (Khuyến khích)
- **Node.js 20+**
- **PostgreSQL 15+**
- **Redis 7+** (Dùng cho BullMQ)

---

## 2. Thiết lập môi trường (.env)

Tạo file `.env` từ `.env.example` với các tham số sau:

```bash
# App
PORT=3000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=zentrix_user
DB_PASS=zentrix_pass
DB_NAME=zentrix_db

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Auth
JWT_SECRET=super_secret_key_change_me
JWT_EXPIRY=1h

# Broker Webhooks
WEBHOOK_DRIFT_WINDOW=300 # 5 minutes in seconds

# Blockchain (Phase 2)
PROVIDER_URL=https://bsc-dataseed.binance.org/
VAULT_CONTRACT_ADDRESS=0x...
RELAYER_PRIVATE_KEY=0x...
```

---

## 3. Chạy bằng Docker Compose (Khuyên dùng)

Dự án đi kèm file `docker-compose.yml` để khởi tạo nhanh toàn bộ stack:

```bash
docker-compose up -d
```

Stack bao gồm:
1. **API Service**: NestJS app.
2. **Worker Service**: Tiến trình chạy ngầm (Rebate Distributor).
3. **Database**: PostgreSQL (đã mount volume).
4. **Cache**: Redis.
5. **PgBouncer**: (Production only) Để quản lý connection pool.

---

## 4. Database Migrations

Sử dụng TypeORM Migrations để quản lý schema:

```bash
# Tạo migration mới
npm run migration:generate src/database/migrations/InitialSchema

# Chạy migration
npm run migration:run

# Revert migration
npm run migration:revert
```

---

## 5. Quy trình CI/CD (Gợi ý)

1. **Lint & Test**: Chạy `npm run lint` và `npm run test` trên GitHub Actions.
2. **Build Image**: Build Docker image và đẩy lên Registry (Docker Hub/GHCR).
3. **Deploy**: 
   - Sử dụng **Watchtower** để tự động cập nhật container trên server.
   - Hoặc sử dụng **Ansible/Terraform** để deploy lên VPS.
