# Quick Start Guide

## 🚀 Fastest Way to Get Started (5 minutes)

### Step 1: Prerequisites
```bash
# Verify Docker is installed
docker --version
docker-compose --version
```

### Step 2: Clone and Navigate
```bash
cd wallet-service
```

### Step 3: Start All Services
```bash
# Using the setup script (Recommended)
chmod +x setup.sh
./setup.sh

# OR using docker-compose directly
docker-compose up -d
sleep 10
npm run seed  # or: docker exec wallet-service-app npm run seed
```

### Step 4: Verify Setup
```bash
# Check health
curl http://localhost:3000/api/v1/health

# Should return:
# {"status":"ok","timestamp":"2024-02-18T10:00:00.000Z"}
```

## 📝 Create Your First Transaction

### Get User ID (from seed data)
Alice Johnson: `550e8400-e29b-41d4-a716-446655440000`
Bob Smith: `550e8400-e29b-41d4-a716-446655440001`

### 1. Top-up Wallet
```bash
curl -X POST http://localhost:3000/api/v1/wallet/topup \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "assetSymbol": "GOLD_COINS",
    "amount": 100,
    "idempotencyKey": "topup-001"
  }'
```

### 2. Issue Bonus
```bash
curl -X POST http://localhost:3000/api/v1/wallet/bonus \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "assetSymbol": "LOYALTY_POINTS",
    "amount": 500,
    "idempotencyKey": "bonus-001",
    "reason": "Welcome bonus"
  }'
```

### 3. Spend Credits
```bash
curl -X POST http://localhost:3000/api/v1/wallet/spend \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "assetSymbol": "GOLD_COINS",
    "amount": 30,
    "idempotencyKey": "spend-001"
  }'
```

### 4. Check Balance
```bash
curl http://localhost:3000/api/v1/wallet/balance/550e8400-e29b-41d4-a716-446655440000/GOLD_COINS
```

### 5. View Transaction History
```bash
curl http://localhost:3000/api/v1/wallet/transactions/550e8400-e29b-41d4-a716-446655440000?limit=10
```

## 🛑 Stop All Services
```bash
docker-compose down

# Or keep data:
docker-compose down --volumes
```

## 📊 Database Access

### Connect to PostgreSQL
```bash
# Using psql
psql -h localhost -U wallet_user -d wallet_service

# Password: wallet_password
```

### Connect to Redis
```bash
# Using redis-cli
redis-cli -h localhost -p 6379

# Test connection
PING  # Should return PONG
```

## 🔍 Logs

### View Application Logs
```bash
docker logs wallet-service-app -f
```

### View PostgreSQL Logs
```bash
docker logs wallet-service-postgres -f
```

### View Redis Logs
```bash
docker logs wallet-service-redis -f
```

## 🧪 Load Testing (Concurrent Requests)

### Test Idempotency (Same request twice)
```bash
# Request 1
curl -X POST http://localhost:3000/api/v1/wallet/topup \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "assetSymbol": "GOLD_COINS",
    "amount": 100,
    "idempotencyKey": "idem-test-1"
  }' | jq '.data.transactionId'

# Request 2 (same idempotency key)
# Should return the SAME transaction ID (no double charge)
curl -X POST http://localhost:3000/api/v1/wallet/topup \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "assetSymbol": "GOLD_COINS",
    "amount": 100,
    "idempotencyKey": "idem-test-1"
  }' | jq '.data.transactionId'
```

### Test Concurrent Requests (using Apache Bench)
```bash
# Install if needed
# Mac: brew install httpd

# Create a JSON file
cat > payload.json <<'EOF'
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "assetSymbol": "GOLD_COINS",
  "amount": 10,
  "idempotencyKey": "concurrent-$timestamp"
}
EOF

# Run 100 concurrent requests
ab -n 100 -c 10 -T 'application/json' -p payload.json http://localhost:3000/api/v1/wallet/topup
```

## 📚 Full Documentation
See [README.md](./README.md) for complete API documentation and architecture details.

## 🆘 Troubleshooting

### Issue: Port 3000 already in use
```bash
# Change port in .env
APP_PORT=3001

# Or kill the process
lsof -ti:3000 | xargs kill -9
```

### Issue: PostgreSQL connection failed
```bash
# Wait longer and retry
docker-compose up -d
sleep 15
npm run seed
```

### Issue: Services not starting
```bash
# Clean up
docker-compose down -v
docker system prune -f

# Start fresh
docker-compose up -d
```

---

**Need help?** Check the detailed [README.md](./README.md) or examine the logs with `docker logs <container-name>`
