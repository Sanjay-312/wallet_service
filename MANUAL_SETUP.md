# Manual Setup Guide

## Prerequisites
- Docker and Docker Compose installed
- Node.js 20+ installed
- PostgreSQL client tools (psql) - optional but helpful

---

## Step 1: Start PostgreSQL and Redis

```bash
docker-compose up -d postgres redis
```

Wait for services to be ready:
```bash
docker-compose ps
# Both postgres and redis should show "healthy"
```

---

## Step 2: Run Database Migrations

```bash
npm run migration:run
```

Expected output:
```
Migration CreateUsersTable1708340400000 has been executed successfully.
```

---

## Step 3: Seed Initial Data

```bash
npm run seed
```

Expected output:
```
✓ Database connection established
✓ Created asset type: GOLD_COINS
✓ Created asset type: DIAMONDS
✓ Created asset type: LOYALTY_POINTS
✓ Created system account
✓ Created user: user1@example.com
✓ Created user: user2@example.com
✓ Initialized user1@example.com with 1000 GOLD_COINS
...
✓ Database seeding completed successfully!
```

---

## Step 4: Start the Application

### Option A: Development Mode (with hot reload)
```bash
npm run start:dev
```

### Option B: Production Mode
```bash
npm run build
npm run start:prod
```

### Option C: Docker Mode
```bash
docker-compose up -d app
docker-compose logs -f app
```

---

## Step 5: Verify Setup

```bash
# Check API health
curl http://localhost:3000/api/v1/health

# Expected response:
# {
#   "success": true,
#   "timestamp": "2026-02-18T13:30:00.000Z",
#   "uptime": "0.123s"
# }
```

---

## Troubleshooting

### PostgreSQL Connection Error
If you get "database does not exist" error:
```bash
# Create the database manually
psql -h localhost -U sanjay -c "CREATE DATABASE wallet_service;"
```

### PostgreSQL Password Authentication Failed
Verify .env file has correct credentials:
```bash
cat .env | grep DB_
```

Should show:
```
DB_HOST=localhost
DB_PORT=5432
DB_USER=sanjay
DB_PASSWORD=306312
DB_NAME=wallet_service
```

### Port Already in Use
If port 3000, 5432, or 6379 is already in use:
```bash
# See what's using the port
lsof -i :3000   # for app
lsof -i :5432   # for postgres
lsof -i :6379   # for redis

# Kill the process
kill -9 <PID>
```

### Clear Everything and Start Fresh
```bash
# Stop all services
docker-compose down

# Remove data volumes
docker-compose down -v

# Remove compiled code
rm -rf dist

# Reinstall dependencies
npm install

# Start over from Step 1
```

---

## Quick Commands Reference

```bash
# Database
npm run migration:run          # Run migrations
npm run migration:generate     # Generate new migration
npm run migration:revert       # Revert last migration
npm run seed                   # Seed data

# Development
npm run start:dev              # Development server
npm run build                  # Compile code
npm run start:prod             # Production server

# Code Quality
npm run lint                   # ESLint
npm run format                 # Prettier
npm test                       # Run tests

# Docker
docker-compose up -d           # Start all services
docker-compose down            # Stop all services
docker-compose logs -f app     # View app logs
docker-compose ps              # Show service status
```

---

## Testing the API

### 1. Health Check
```bash
curl http://localhost:3000/api/v1/health
```

### 2. Get User Balance
```bash
# First, get a user ID from the seed data
# Then query balance:
curl http://localhost:3000/api/v1/wallet/balance/USER_ID/GOLD_COINS
```

### 3. Topup Wallet
```bash
curl -X POST http://localhost:3000/api/v1/wallet/topup \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "USER_ID",
    "assetSymbol": "GOLD_COINS",
    "amount": 100,
    "idempotencyKey": "unique-key-123"
  }'
```

### 4. View Transactions
```bash
curl http://localhost:3000/api/v1/wallet/transactions/USER_ID
```

---

## Initial Test Data

After seeding, you have:

**Users:**
- user1@example.com (Alice Johnson) - ID: `{alice_uuid}`
- user2@example.com (Bob Smith) - ID: `{bob_uuid}`

**Assets:**
- GOLD_COINS: 1000 each
- DIAMONDS: 500 each  
- LOYALTY_POINTS: 5000 each

**System Account:**
- Email: system@wallet-service.local
- Each asset: 1,000,000 balance

---

## Support & Documentation

- **API Reference**: See API_DOCUMENTATION.md
- **Architecture**: See README.md
- **Development Guide**: See DEVELOPMENT.md
- **Requirements Fulfillment**: See IMPLEMENTATION_SUMMARY.md

---

**Next Steps:**
1. ✅ Start services
2. ✅ Run migrations
3. ✅ Seed data
4. ✅ Start app
5. ⏭️ Test API endpoints
6. ⏭️ Customize for your needs
7. ⏭️ Deploy to production
