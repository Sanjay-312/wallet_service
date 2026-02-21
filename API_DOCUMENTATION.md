# API Documentation

## Base URL
```
http://localhost:3000/api/v1
```

## Authentication
Currently no authentication required. In production, add JWT/OAuth2.

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response-specific data
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": "ERROR_CODE"
}
```

---

## Endpoints

### 1. Health Check

Check if the service is running and healthy.

**Request**
```http
GET /health
```

**Response (200 OK)**
```json
{
  "status": "ok",
  "timestamp": "2024-02-18T10:00:00.000Z"
}
```

---

### 2. Top-up Wallet (Purchase Credits)

Purchase credits using real money. This is an idempotent operation.

**Request**
```http
POST /wallet/topup
Content-Type: application/json

{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "assetSymbol": "GOLD_COINS",
  "amount": 100,
  "idempotencyKey": "topup-order-12345",
  "metadata": {
    "paymentMethod": "credit_card",
    "orderId": "ORDER-123",
    "transactionId": "TXN-456"
  }
}
```

**Parameters**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| userId | UUID | Yes | User ID |
| assetSymbol | String | Yes | Asset symbol (e.g., GOLD_COINS, DIAMONDS) |
| amount | Number | Yes | Amount to topup (minimum 1) |
| idempotencyKey | String | Yes | Unique key for this request (prevents duplicates) |
| metadata | Object | No | Additional context data |

**Response (201 Created)**
```json
{
  "success": true,
  "message": "Wallet topup successful",
  "data": {
    "transactionId": "550e8400-e29b-41d4-a716-446655440011",
    "status": "COMPLETED",
    "amount": 100,
    "createdAt": "2024-02-18T10:00:00.000Z"
  }
}
```

**Status Codes**
- `201 Created`: Topup successful
- `400 Bad Request`: Invalid input
- `404 Not Found`: User or asset not found
- `409 Conflict`: Duplicate request (same idempotencyKey)
- `500 Internal Server Error`: Server error

**Example cURL**
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

---

### 3. Issue Bonus (Award Free Credits)

Issue bonus/incentive credits to a user. Idempotent operation.

**Request**
```http
POST /wallet/bonus
Content-Type: application/json

{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "assetSymbol": "LOYALTY_POINTS",
  "amount": 500,
  "idempotencyKey": "bonus-referral-2024",
  "reason": "Referral program reward"
}
```

**Parameters**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| userId | UUID | Yes | User ID |
| assetSymbol | String | Yes | Asset symbol |
| amount | Number | Yes | Bonus amount (minimum 1) |
| idempotencyKey | String | Yes | Unique key for idempotency |
| reason | String | No | Reason for bonus |

**Response (201 Created)**
```json
{
  "success": true,
  "message": "Bonus issued successfully",
  "data": {
    "transactionId": "550e8400-e29b-41d4-a716-446655440012",
    "status": "COMPLETED",
    "amount": 500,
    "createdAt": "2024-02-18T10:00:00.000Z"
  }
}
```

**Example cURL**
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

---

### 4. Spend Credits (Purchase In-App)

Spend/deduct credits from user account. Idempotent operation.

**Request**
```http
POST /wallet/spend
Content-Type: application/json

{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "assetSymbol": "GOLD_COINS",
  "amount": 50,
  "idempotencyKey": "spend-item-001",
  "description": "Purchased: Gold Shield"
}
```

**Parameters**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| userId | UUID | Yes | User ID |
| assetSymbol | String | Yes | Asset symbol |
| amount | Number | Yes | Amount to spend (minimum 1) |
| idempotencyKey | String | Yes | Unique key for idempotency |
| description | String | No | Item or service description |

**Response (201 Created)**
```json
{
  "success": true,
  "message": "Credits spent successfully",
  "data": {
    "transactionId": "550e8400-e29b-41d4-a716-446655440013",
    "status": "COMPLETED",
    "amount": 50,
    "createdAt": "2024-02-18T10:00:00.000Z"
  }
}
```

**Error Response (Insufficient Balance)**
```json
{
  "success": false,
  "message": "Insufficient balance",
  "error": "INSUFFICIENT_BALANCE"
}
```

**Example cURL**
```bash
curl -X POST http://localhost:3000/api/v1/wallet/spend \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "assetSymbol": "GOLD_COINS",
    "amount": 50,
    "idempotencyKey": "spend-001",
    "description": "Purchased: Gold Shield"
  }'
```

---

### 5. Get Balance

Get current balance for a specific user and asset.

**Request**
```http
GET /wallet/balance/{userId}/{assetSymbol}
```

**Parameters**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| userId | UUID | Yes | User ID (in URL path) |
| assetSymbol | String | Yes | Asset symbol (in URL path) |

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "assetSymbol": "GOLD_COINS",
    "balance": 1050
  }
}
```

**Example cURL**
```bash
curl http://localhost:3000/api/v1/wallet/balance/550e8400-e29b-41d4-a716-446655440000/GOLD_COINS
```

---

### 6. Get All Balances

Get all asset balances for a specific user.

**Request**
```http
GET /wallet/balances/{userId}
```

**Parameters**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| userId | UUID | Yes | User ID (in URL path) |

**Response (200 OK)**
```json
{
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
      },
      {
        "assetSymbol": "LOYALTY_POINTS",
        "amount": 5500,
        "lockedAmount": 0,
        "availableAmount": 5500
      }
    ]
  }
}
```

**Example cURL**
```bash
curl http://localhost:3000/api/v1/wallet/balances/550e8400-e29b-41d4-a716-446655440000
```

---

### 7. Get Transaction History

Get all transactions for a user (paginated).

**Request**
```http
GET /wallet/transactions/{userId}?limit=50&offset=0
```

**Query Parameters**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| limit | Number | 50 | Number of records to return |
| offset | Number | 0 | Starting position |

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "transactions": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440013",
        "type": "SPEND",
        "amount": 50,
        "status": "COMPLETED",
        "assetSymbol": "GOLD_COINS",
        "createdAt": "2024-02-18T10:05:00.000Z",
        "completedAt": "2024-02-18T10:05:01.000Z"
      },
      {
        "id": "550e8400-e29b-41d4-a716-446655440012",
        "type": "BONUS",
        "amount": 500,
        "status": "COMPLETED",
        "assetSymbol": "LOYALTY_POINTS",
        "createdAt": "2024-02-18T10:02:00.000Z",
        "completedAt": "2024-02-18T10:02:01.000Z"
      },
      {
        "id": "550e8400-e29b-41d4-a716-446655440011",
        "type": "TOPUP",
        "amount": 100,
        "status": "COMPLETED",
        "assetSymbol": "GOLD_COINS",
        "createdAt": "2024-02-18T10:00:00.000Z",
        "completedAt": "2024-02-18T10:00:01.000Z"
      }
    ]
  }
}
```

**Example cURL**
```bash
curl "http://localhost:3000/api/v1/wallet/transactions/550e8400-e29b-41d4-a716-446655440000?limit=10&offset=0"
```

---

### 8. Get Ledger Entries (Audit Trail)

Get complete audit trail (ledger entries) for a user. This shows debit/credit entries for complete transparency.

**Request**
```http
GET /wallet/ledger/{userId}?limit=100&offset=0&assetId={assetId}
```

**Query Parameters**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| limit | Number | 100 | Number of records to return |
| offset | Number | 0 | Starting position |
| assetId | UUID | - | Filter by asset ID (optional) |

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "entries": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440020",
        "transactionType": "SPEND",
        "direction": "DEBIT",
        "amount": 50,
        "balanceAfter": 1000,
        "status": "COMPLETED",
        "description": "Credits spent",
        "createdAt": "2024-02-18T10:05:00.000Z"
      },
      {
        "id": "550e8400-e29b-41d4-a716-446655440021",
        "transactionType": "TOPUP",
        "direction": "CREDIT",
        "amount": 100,
        "balanceAfter": 1050,
        "status": "COMPLETED",
        "description": "Topup received from system",
        "createdAt": "2024-02-18T10:00:00.000Z"
      }
    ]
  }
}
```

**Example cURL**
```bash
curl "http://localhost:3000/api/v1/wallet/ledger/550e8400-e29b-41d4-a716-446655440000?limit=100&offset=0"
```

---

## Error Codes

| Code | Status | Description |
|------|--------|-------------|
| INSUFFICIENT_BALANCE | 400 | Not enough balance to spend |
| USER_NOT_FOUND | 404 | User doesn't exist |
| ASSET_NOT_FOUND | 404 | Asset type doesn't exist |
| INVALID_REQUEST | 400 | Invalid request parameters |
| DUPLICATE_REQUEST | 409 | Same idempotencyKey already processed |
| INTERNAL_ERROR | 500 | Server error |

---

## Request/Response Examples

### Example 1: Complete Purchase Flow

1. **Check Balance**
```bash
curl http://localhost:3000/api/v1/wallet/balance/550e8400-e29b-41d4-a716-446655440000/GOLD_COINS
```
Response: `1000` GOLD_COINS

2. **Top-up Credits**
```bash
curl -X POST http://localhost:3000/api/v1/wallet/topup \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "assetSymbol": "GOLD_COINS",
    "amount": 500,
    "idempotencyKey": "topup-shop-001"
  }'
```

3. **Spend Credits**
```bash
curl -X POST http://localhost:3000/api/v1/wallet/spend \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "assetSymbol": "GOLD_COINS",
    "amount": 100,
    "idempotencyKey": "purchase-sword-001"
  }'
```

4. **Verify Balance**
```bash
curl http://localhost:3000/api/v1/wallet/balance/550e8400-e29b-41d4-a716-446655440000/GOLD_COINS
```
Response: `1400` GOLD_COINS (1000 + 500 - 100)

---

## Rate Limiting

Currently no rate limiting. In production, implement:
- Per-user: 100 requests/minute
- Per-IP: 1000 requests/minute

---

## Pagination

All list endpoints support pagination:
- `limit`: Number of items (default: 50, max: 1000)
- `offset`: Skip this many items (default: 0)

---

## Best Practices

1. **Always use idempotencyKey**: Protects against duplicate charges
2. **Validate amount before request**: Prevents unnecessary API calls
3. **Handle 409 Conflicts**: Retry might have succeeded
4. **Implement exponential backoff**: For failed requests
5. **Use server-generated IDs**: Don't rely on client-generated UUIDs alone

---

## Testing the API

### Using Postman
Import `Postman-Collection.json` into Postman for pre-built requests.

### Using cURL
All examples above can be directly run in terminal.

### Using Thunder Client / REST Client
Copy the examples and use in your IDE extension.

---

For more details, see [README.md](./README.md) and [QUICKSTART.md](./QUICKSTART.md).
