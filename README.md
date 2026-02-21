# Internal Wallet Service - Backend Implementation

A production-grade internal wallet service built with NestJS, TypeORM, PostgreSQL, and Redis. Designed to handle high-traffic scenarios with data integrity guarantees and advanced concurrency handling.

## 📋 Features

### Core Functionality
- **Wallet Top-up (Purchase)**: Users purchase credits using real money
- **Bonus/Incentive**: System issues free credits to users
- **Purchase/Spend**: Users spend credits on in-app services

### Advanced Features
- ✅ **Double-Entry Ledger System**: Complete audit trail with debits and credits
- ✅ **Idempotent Operations**: Safe retry with `idempotencyKey`
- ✅ **Pessimistic Locking**: Prevents race conditions with row-level database locks
- ✅ **ACID Transactions**: Guaranteed data consistency with PostgreSQL transactions
- ✅ **Deadlock Avoidance**: Ordered resource acquisition pattern
- ✅ **Balance Validation**: Real-time insufficient balance detection
- ✅ **Multi-Asset Support**: Handle multiple asset types (Gold, Diamonds, Loyalty Points)

## 🏗️ Architecture

### Technology Stack
- **Runtime**: Node.js (NestJS)
- **Language**: TypeScript
- **Database**: PostgreSQL 15 (ACID compliant, row-level locking)
- **ORM**: TypeORM with migrations
- **Message Queue**: Bull + Redis (for async operations)
- **Containerization**: Docker & Docker Compose

### Why These Choices?

| Component | Why |
|-----------|-----|
| **PostgreSQL** | ACID transactions, row-level locking, reliable under high concurrency |
| **TypeORM** | Native transaction support, pessimistic locking, type-safe queries |
| **NestJS** | Enterprise-grade architecture, built-in dependency injection, modular design |
| **Redis** | In-memory data store for queue management, fast access |
| **Bull** | Reliable job processing with retry mechanisms |

### Database Schema

#### Entities
1. **User** - System and regular users
   - `id` (UUID): Primary key
   - `email` (String): Unique identifier
   - `name` (String): User name
   - `walletType` (String): 'user' or 'system'

2. **AssetType** - Supported currencies
   - `id` (UUID): Primary key
   - `symbol` (String): Unique identifier (e.g., 'GOLD_COINS')
   - `name` (String): Display name
   - `status` (String): 'ACTIVE' or 'INACTIVE'

3. **Balance** - Current balance per user-asset
   - `id` (UUID): Primary key
   - `user_id` (FK): Reference to User
   - `asset_id` (FK): Reference to AssetType
   - `amount` (BigInt): Current balance
   - `lockedAmount` (BigInt): Amount locked in pending transactions
   - **Unique Constraint**: (user_id, asset_id)

4. **Transaction** - Transaction records (one-to-many with ledgers)
   - `id` (UUID): Primary key
   - `from_user_id` (FK): Source user
   - `to_user_id` (FK): Destination user
   - `asset_id` (FK): Asset being transferred
   - `type` (String): 'TOPUP', 'BONUS', 'SPEND'
   - `amount` (BigInt): Amount
   - `status` (String): 'PENDING', 'COMPLETED', 'FAILED'
   - `idempotencyKey` (String): Unique per request
   - **Unique Constraint**: idempotencyKey

5. **Ledger** - Double-entry ledger (audit trail)
   - `id` (UUID): Primary key
   - `user_id` (FK): User account
   - `asset_id` (FK): Asset
   - `transactionType` (String): 'TOPUP', 'BONUS', 'SPEND'
   - `direction` (String): 'DEBIT' or 'CREDIT'
   - `amount` (BigInt): Amount
   - `balanceAfter` (BigInt): Balance after transaction
   - `status` (String): 'COMPLETED', 'FAILED', 'REVERSED'
   - `idempotencyKey` (String): Unique for idempotency
   - **Unique Constraint**: idempotencyKey

## 🔒 Concurrency & Data Integrity Strategy

### 1. Race Condition Prevention
- **Pessimistic Locking**: `setLock('pessimistic_write')` on balance queries
- **Row-Level Locks**: Database locks prevent concurrent modifications
- **Transaction Isolation**: PostgreSQL SERIALIZABLE isolation level support

```typescript
// Example: Locked balance retrieval
const balance = await manager
  .createQueryBuilder(Balance, 'balance')
  .setLock('pessimistic_write')  // Acquires exclusive lock
  .where('balance.user_id = :userId', { userId })
  .andWhere('balance.asset_id = :assetId', { assetId })
  .getOne();
```

### 2. Idempotency Implementation
- **Idempotency Key**: Unique identifier per request (`idempotencyKey`)
- **Duplicate Detection**: Check before processing
- **Deterministic Response**: Same key returns same result

```typescript
// Example: Idempotent topup
const existingTransaction = await this.transactionRepository.findOne({
  where: { idempotencyKey }
});

if (existingTransaction) {
  return existingTransaction; // Return cached result
}
```

### 3. Deadlock Avoidance
- **Ordered Resource Acquisition**: Always acquire locks in consistent order
- **Short Transactions**: Minimize lock hold duration
- **No Circular Dependencies**: Clear resource hierarchy

**Lock Order Pattern**:
1. System Account (if applicable)
2. User Account
3. Balance records (ordered by asset ID)

### 4. Double-Entry Ledger
Every transaction creates two ledger entries:
- **DEBIT**: Money leaves an account
- **CREDIT**: Money enters an account

```
Topup Transaction:
System Account: -100 (DEBIT)
User Account:   +100 (CREDIT)

Spend Transaction:
User Account:    -50 (DEBIT)
System Account:  +50 (CREDIT)
```

This ensures:
- Complete audit trail
- Balance reconciliation
- Fraud detection

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- Docker & Docker Compose (for containerized setup)
- PostgreSQL 15+ (for manual setup)
- Redis 7+ (for manual setup)

### Installation

#### Option 1: Using Docker Compose (Recommended)

```bash
# Clone the repository
git clone <repository-url>
cd wallet-service

# Start all services (PostgreSQL, Redis, App)
docker-compose up -d

# Run database migrations and seed
docker exec wallet-service-app npm run seed

# Verify setup
curl http://localhost:3000/api/v1/health
```

#### Option 2: Manual Setup

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env

# Start PostgreSQL (ensure it's running)
# Start Redis (ensure it's running)

# Run migrations
npm run migration:run

# Seed database
npm run seed

# Start the application
npm run start:dev
```

### Environment Configuration

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=wallet_user
DB_PASSWORD=wallet_password
DB_NAME=wallet_service

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Application
NODE_ENV=development
APP_PORT=3000
```

## 📡 API Endpoints

### Health Check
```http
GET /api/v1/health
```

### Wallet Operations

#### 1. Top-up Wallet (Purchase Credits)
```http
POST /api/v1/wallet/topup

{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "assetSymbol": "GOLD_COINS",
  "amount": 100,
  "idempotencyKey": "topup-001-2024",
  "metadata": {
    "paymentMethod": "credit_card",
    "orderId": "ORDER-123"
  }
}

Response:
{
  "success": true,
  "message": "Wallet topup successful",
  "data": {
    "transactionId": "uuid",
    "status": "COMPLETED",
    "amount": 100,
    "createdAt": "2024-02-18T10:00:00Z"
  }
}
```

#### 2. Issue Bonus (Free Credits)
```http
POST /api/v1/wallet/bonus

{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "assetSymbol": "LOYALTY_POINTS",
  "amount": 500,
  "idempotencyKey": "bonus-referral-001",
  "reason": "Referral program reward"
}

Response:
{
  "success": true,
  "message": "Bonus issued successfully",
  "data": {
    "transactionId": "uuid",
    "status": "COMPLETED",
    "amount": 500,
    "createdAt": "2024-02-18T10:00:00Z"
  }
}
```

#### 3. Spend Credits (Purchase)
```http
POST /api/v1/wallet/spend

{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "assetSymbol": "GOLD_COINS",
  "amount": 50,
  "idempotencyKey": "spend-item-001",
  "description": "Purchased in-game item: Gold Shield"
}

Response:
{
  "success": true,
  "message": "Credits spent successfully",
  "data": {
    "transactionId": "uuid",
    "status": "COMPLETED",
    "amount": 50,
    "createdAt": "2024-02-18T10:00:00Z"
  }
}
```

#### 4. Get Balance
```http
GET /api/v1/wallet/balance/{userId}/{assetSymbol}

Response:
{
  "success": true,
  "data": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "assetSymbol": "GOLD_COINS",
    "balance": 1050
  }
}
```

#### 5. Get All Balances for User
```http
GET /api/v1/wallet/balances/{userId}

Response:
  "success": true,
  "data": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "balances": [
      {
        "assetSymbol": "GOLD_COINS",
        "amount": 1050,
        "lockedAmount": 0,
        "availableAmount": 1050
      },
      {
        "assetSymbol": "DIAMONDS",
        "amount": 500,
        "lockedAmount": 0,
        "availableAmount": 500
      }
    ]
  }
}
```

#### 6. Get Transaction History
```http
GET /api/v1/wallet/transactions/{userId}?limit=50&offset=0

Response:
{
  "success": true,
  "data": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "transactions": [
      {
        "id": "uuid",
        "type": "TOPUP",
        "amount": 100,
        "status": "COMPLETED",
        "assetSymbol": "GOLD_COINS",
        "createdAt": "2024-02-18T10:00:00Z",
        "completedAt": "2024-02-18T10:00:01Z"
      }
    ]
  }
}
```

#### 7. Get Ledger Entries (Audit Trail)
```http
GET /api/v1/wallet/ledger/{userId}?limit=100&offset=0&assetId={assetId}

Response:
{
  "success": true,
  "data": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "entries": [
      {
        "id": "uuid",
        "transactionType": "TOPUP",
        "direction": "CREDIT",
        "amount": 100,
        "balanceAfter": 1050,
        "status": "COMPLETED",
        "description": "Topup received from system",
        "createdAt": "2024-02-18T10:00:00Z"
      }
    ]
  }
}
```

## 📊 Initial Seed Data

The seed script creates:

### Asset Types
- **GOLD_COINS**: In-game premium currency
- **DIAMONDS**: Rare premium currency
- **LOYALTY_POINTS**: Earned through gameplay

### System Account
- Email: `system@wallet-service.local`
- Role: Treasury/Revenue account
- Initial Balance: 1,000,000 per asset (for distribution)

### User Accounts
1. **Alice Johnson** (`user1@example.com`)
   - GOLD_COINS: 1,000
   - DIAMONDS: 500
   - LOYALTY_POINTS: 5,000

2. **Bob Smith** (`user2@example.com`)
   - GOLD_COINS: 1,000
   - DIAMONDS: 500
   - LOYALTY_POINTS: 5,000

## 🔄 Handling High Concurrency

### Scenario: 1000 Concurrent Top-up Requests

```typescript
// The pessimistic lock ensures:
// 1. Only one request modifies a balance at a time
// 2. Others wait their turn (FIFO queue by database)
// 3. No balance corruption
// 4. No lost updates

await this.dataSource.transaction(async (manager) => {
  const balance = await manager
    .createQueryBuilder(Balance, 'balance')
    .setLock('pessimistic_write')  // Atomic lock acquisition
    .where('balance.user_id = :userId', { userId })
    .andWhere('balance.asset_id = :assetId', { assetId })
    .getOne();
  
  // Modify balance
  // Database ensures serialization
});
```

### Performance Considerations
- **Indexes**: Created on frequently queried columns (user_id, asset_id, status, created_at)
- **Batch Operations**: Redis queue for async operations
- **Connection Pooling**: Database connection pool (default: 10 connections)

## 🧪 Testing Examples

### Test 1: Concurrent Top-ups
```bash
# Request 1 (should succeed)
curl -X POST http://localhost:3000/api/v1/wallet/topup \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "assetSymbol": "GOLD_COINS",
    "amount": 100,
    "idempotencyKey": "topup-concurrent-1"
  }'

# Request 2 (same user, concurrent, should succeed)
curl -X POST http://localhost:3000/api/v1/wallet/topup \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "assetSymbol": "DIAMONDS",
    "amount": 50,
    "idempotencyKey": "topup-concurrent-2"
  }'
```

### Test 2: Idempotency
```bash
# Request 1
curl -X POST http://localhost:3000/api/v1/wallet/topup \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "assetSymbol": "GOLD_COINS",
    "amount": 100,
    "idempotencyKey": "idempotent-key-1"
  }'

# Request 2 (identical request with same idempotencyKey)
# Should return the exact same result (no double debit/credit)
curl -X POST http://localhost:3000/api/v1/wallet/topup \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "assetSymbol": "GOLD_COINS",
    "amount": 100,
    "idempotencyKey": "idempotent-key-1"
  }'
```

### Test 3: Insufficient Balance
```bash
# Get current balance
curl http://localhost:3000/api/v1/wallet/balance/550e8400-e29b-41d4-a716-446655440000/GOLD_COINS

# Try to spend more than balance (should fail gracefully)
curl -X POST http://localhost:3000/api/v1/wallet/spend \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "assetSymbol": "GOLD_COINS",
    "amount": 10000,
    "idempotencyKey": "spend-fail-1"
  }'
```

## 📈 Scalability Considerations

### Horizontal Scaling
1. **Stateless Application**: No session state, easy to scale
2. **Database**: Use read replicas for balances, write to primary
3. **Redis**: Cluster Redis for high-volume queue operations
4. **Load Balancer**: Distribute requests across multiple app instances

### Vertical Scaling
1. **Connection Pooling**: Increase database connection pool
2. **Cache**: Implement balance caching with TTL
3. **Indexing**: Add more indexes for frequently queried columns

## 🐛 Troubleshooting

### Issue: Deadlock detected
**Solution**: Ensure locks are always acquired in the same order (system -> user -> balance)

### Issue: Insufficient balance errors
**Solution**: Check that `lockedAmount` is properly decremented after transaction completion

### Issue: Duplicate transactions
**Solution**: Verify `idempotencyKey` is unique and transaction is rolled back on error

## 📚 Additional Resources

- [NestJS Documentation](https://docs.nestjs.com)
- [TypeORM Documentation](https://typeorm.io)
- [PostgreSQL Documentation](https://www.postgresql.org/docs)
- [Bull Documentation](https://github.com/OptimalBits/bull)

## 📝 License

MIT

## 👤 Author

Dino Ventures Backend Team

---

**Built with ❤️ for high-traffic, mission-critical applications**
# wallet_service