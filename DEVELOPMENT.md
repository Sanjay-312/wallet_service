# Development Guide

## Project Overview

This is a production-grade Internal Wallet Service built with enterprise standards.

### Technology Stack
- **Framework**: NestJS 10
- **Language**: TypeScript 5
- **Database**: PostgreSQL 15
- **ORM**: TypeORM 0.3
- **Queue**: Bull 4 + Redis 7
- **Runtime**: Node.js 20

---

## Local Development Setup

### Prerequisites
- Node.js 20+
- PostgreSQL 15+ (or Docker)
- Redis 7+ (or Docker)
- npm or yarn

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Setup Environment
```bash
cp .env .env.local

# Edit .env.local with your local settings
DB_HOST=localhost
DB_PORT=5432
DB_USER=wallet_user
DB_PASSWORD=wallet_password
DB_NAME=wallet_service
```

### Step 3: Start Database Services

**Option A: Using Docker**
```bash
docker run -d -p 5432:5432 \
  -e POSTGRES_USER=wallet_user \
  -e POSTGRES_PASSWORD=wallet_password \
  -e POSTGRES_DB=wallet_service \
  postgres:15-alpine

docker run -d -p 6379:6379 redis:7-alpine
```

**Option B: Using Existing Services**
Ensure PostgreSQL and Redis are running on configured ports.

### Step 4: Run Migrations & Seed
```bash
npm run migration:run
npm run seed
```

### Step 5: Start Development Server
```bash
npm run start:dev
```

Server runs at `http://localhost:3000`

---

## Project Structure

```
src/
├── entities/              # Database models
│   ├── user.entity.ts
│   ├── asset-type.entity.ts
│   ├── balance.entity.ts
│   ├── ledger.entity.ts
│   └── transaction.entity.ts
├── controllers/           # API endpoints
│   ├── wallet.controller.ts
│   └── health.controller.ts
├── services/              # Business logic
│   ├── wallet.service.ts       # Balance management
│   └── ledger.service.ts       # Transaction processing
├── dtos/                  # Request/Response DTOs
│   └── wallet.dto.ts
├── config/                # Configuration
│   └── typeorm.config.ts
├── database/
│   ├── seeds/
│   │   └── seed.ts
│   └── migrations/
│       └── *Migration.ts
├── app.module.ts          # Root module
└── main.ts                # Entry point
```

---

## Development Workflows

### Adding a New Endpoint

1. **Create DTO** in `src/dtos/wallet.dto.ts`:
```typescript
export class MyNewDto {
  @IsString()
  someField: string;
}
```

2. **Add Service Method** in `src/services/wallet.service.ts`:
```typescript
async myMethod(param: string): Promise<any> {
  // Implementation
}
```

3. **Add Controller Endpoint** in `src/controllers/wallet.controller.ts`:
```typescript
@Get('endpoint')
async myEndpoint(@Query() query: MyNewDto) {
  return this.service.myMethod(query.someField);
}
```

### Creating a Database Migration

1. **Generate Migration** (after modifying entity):
```bash
npm run migration:generate -- -n CreateNewTable
```

2. **Edit Migration** in `src/migrations/`:
```typescript
public async up(queryRunner: QueryRunner): Promise<void> {
  // Create table logic
}

public async down(queryRunner: QueryRunner): Promise<void> {
  // Drop table logic
}
```

3. **Run Migration**:
```bash
npm run migration:run
```

### Adding a New Service

1. Create file: `src/services/my-service.ts`
2. Add to `src/app.module.ts` providers:
```typescript
providers: [WalletService, LedgerService, MyNewService]
```

---

## Testing

### Unit Tests
```bash
npm run test
```

### Test with Coverage
```bash
npm run test:cov
```

### Watch Mode
```bash
npm run test:watch
```

### E2E Tests
```bash
npm run test:e2e
```

### Manual Testing

#### Using cURL
```bash
curl -X POST http://localhost:3000/api/v1/wallet/topup \
  -H "Content-Type: application/json" \
  -d '{"userId":"...","assetSymbol":"GOLD_COINS","amount":100,"idempotencyKey":"test-1"}'
```

#### Using Postman
Import `Postman-Collection.json` and test endpoints.

---

## Debugging

### Enable Database Logging
In `.env`:
```
NODE_ENV=development  # Enables TypeORM logging
```

### View TypeORM Queries
```typescript
// In typeorm.config.ts
logging: true,  // Set to ['query'] for only SELECT, INSERT, UPDATE, DELETE
```

### Debug Mode
```bash
npm run start:debug
```

Attach debugger at `localhost:9229`

### Browser DevTools Debugging
```bash
node --inspect-brk -r ts-node/register src/main.ts
```

### Console Logs
The app uses NestJS Logger:
```typescript
import { Logger } from '@nestjs/common';

private readonly logger = new Logger(MyService.name);

this.logger.log('Message');
this.logger.error('Error message');
this.logger.warn('Warning message');
this.logger.debug('Debug message');
```

---

## Code Quality

### Linting
```bash
npm run lint
```

### Format Code
```bash
npm run format
```

### Type Checking
```bash
npx tsc --noEmit
```

---

## Database Transactions & Locking

### Pessimistic Lock Example
```typescript
const balance = await manager
  .createQueryBuilder(Balance, 'balance')
  .setLock('pessimistic_write')
  .where('balance.user_id = :userId', { userId })
  .getOne();
```

### Optimistic Lock (Version-based)
```typescript
@Column()
version: number;

// Check version before update
if (entity.version !== expectedVersion) {
  throw new ConflictException('Entity was modified');
}
```

### Transaction Rollback
```typescript
try {
  await this.dataSource.transaction(async (manager) => {
    // Operations
    if (errorCondition) {
      throw new Error('Rollback transaction');
    }
  });
} catch (error) {
  // Transaction auto-rolled back
}
```

---

## Common Issues & Solutions

### Issue: Port Already in Use
```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>
```

### Issue: Database Connection Failed
```bash
# Check PostgreSQL is running
psql -h localhost -U wallet_user -d wallet_service

# Or using Docker
docker exec wallet-service-postgres psql -U wallet_user -d wallet_service
```

### Issue: Redis Connection Failed
```bash
# Test Redis connection
redis-cli ping  # Should return PONG

# Or using Docker
docker exec wallet-service-redis redis-cli ping
```

### Issue: Migration Already Applied
```bash
# Check migration history
npm run typeorm migration:show

# Revert last migration
npm run migration:revert
```

### Issue: Duplicate idempotencyKey Error
This is expected behavior - means the same request was processed before.
Return the previous transaction ID.

---

## Performance Optimization

### 1. Add Indexes
```typescript
@Index('idx_user_email', ['email'])
export class User {
  @Column()
  email: string;
}
```

### 2. Use Query Optimization
```typescript
// Use .select() to fetch only needed columns
.select(['balance.id', 'balance.amount'])

// Use pagination for large datasets
.take(limit).skip(offset)
```

### 3. Connection Pooling
Increase in production:
```typescript
extra: {
  max: 20,  // Default: 10
  min: 5,
}
```

### 4. Caching
With Redis:
```typescript
const cached = await this.redis.get(`balance:${userId}:${assetId}`);
if (cached) return JSON.parse(cached);

// ... calculate

await this.redis.setex(`balance:${userId}:${assetId}`, 300, JSON.stringify(result));
```

---

## Production Deployment

### Build for Production
```bash
npm run build
```

### Run Production Build
```bash
npm run start:prod
```

### Using Docker
```bash
# Build image
docker build -t wallet-service .

# Run container
docker run -p 3000:3000 \
  -e DB_HOST=postgres \
  -e REDIS_HOST=redis \
  wallet-service
```

### Environment Variables for Production
```env
NODE_ENV=production
DB_SSL=true
REDIS_PASSWORD=strong_password
LOG_LEVEL=info
```

### Security Checklist
- [ ] HTTPS enabled
- [ ] Environment variables configured
- [ ] Database backups setup
- [ ] Rate limiting enabled
- [ ] CORS configured
- [ ] Authentication/Authorization implemented
- [ ] Secrets encrypted
- [ ] Logging centralized
- [ ] Monitoring enabled
- [ ] Alerting configured

---

## Git Workflow

### Branch Naming
- `feature/description` - New features
- `fix/description` - Bug fixes
- `refactor/description` - Code refactoring
- `docs/description` - Documentation

### Commit Messages
```
feat: Add new feature
fix: Fix bug description
refactor: Refactor component
docs: Update documentation
test: Add tests for feature
```

### Pull Request Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Feature
- [ ] Bug Fix
- [ ] Refactoring

## Testing
How to test these changes

## Checklist
- [ ] Tests pass
- [ ] Code formatted
- [ ] Types checked
```

---

## Documentation

### Update API Documentation
Edit `API_DOCUMENTATION.md` when adding/modifying endpoints.

### Update README
Edit `README.md` for architecture or setup changes.

### Update This Guide
Edit `DEVELOPMENT.md` for new development patterns.

---

## Resources

- [NestJS Docs](https://docs.nestjs.com)
- [TypeORM Docs](https://typeorm.io)
- [PostgreSQL Docs](https://www.postgresql.org/docs)
- [Bull Docs](https://github.com/OptimalBits/bull)
- [Redis Docs](https://redis.io/documentation)

---

## Getting Help

1. Check existing documentation
2. Search GitHub issues
3. Check NestJS community Discord
4. Create GitHub issue with reproducible example

---

**Happy coding! 🚀**
