# Finance Dashboard API Documentation

## Overview
This API provides comprehensive financial transaction management with automated data synchronization capabilities. The system manages transactions for multiple accounts (DOA6PS and FWXEQK) with real-time sync and filtering options.

**Base URL:** `http://localhost:3000/api` (development) or `https://your-domain.com/api` (production)

**Authentication:** Currently using token-based authentication (managed in frontend)

---

## API Endpoints

### 1. Health Check
**GET** `/health`

Check the health status of the application and database connection.

#### Response
```json
{
  "status": "ok",
  "timestamp": "2025-08-17T20:30:00.000Z",
  "database": "connected"
}
```

#### Error Response
```json
{
  "status": "error",
  "timestamp": "2025-08-17T20:30:00.000Z",
  "database": "disconnected",
  "error": "Database connection failed"
}
```

---

### 2. Sync Management
**GET** `/sync`

Get the current sync service status.

#### Response
```json
{
  "success": true,
  "message": "Cron sync service is integrated with Next.js",
  "status": "running",
  "schedule": "Daily at 1 AM IST",
  "accounts": ["DOA6PS", "FWXEQK"],
  "mode": "Integrated",
  "platform": "Self-hosted",
  "timestamp": "2025-08-17T20:30:00.000Z"
}
```

**POST** `/sync`

Trigger a manual data synchronization for all accounts.

#### Response
```json
{
  "success": true,
  "message": "Manual sync completed successfully",
  "timestamp": "2025-08-17T20:30:00.000Z"
}
```

#### Error Response
```json
{
  "success": false,
  "error": "Manual sync failed",
  "timestamp": "2025-08-17T20:30:00.000Z"
}
```

---

### 3. All Transactions
**GET** `/transactions/all`

Retrieve transactions from all accounts with pagination and filtering.

#### Query Parameters
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | number | No | 1 | Page number for pagination |
| `size` | number | No | 15 | Number of transactions per page |
| `accountNumber` | string | No | - | Filter by account number (partial match) |
| `status` | string | No | - | Filter by transaction status (`Succeeded`, `Failed`, `Processing`) |
| `startDate` | string | No | - | Start date filter (ISO format) |
| `endDate` | string | No | - | End date filter (ISO format) |

#### Example Request
```
GET /api/transactions/all?page=1&size=20&status=Succeeded&accountNumber=40604
```

#### Response
```json
{
  "transactions": [
    {
      "id": "64f7a1b2c3d4e5f6g7h8i9j0",
      "withdrawId": "HPAY20250817195245f4WFo",
      "date": "2025-08-17T19:52:45.000Z",
      "successDate": "2025-08-17T19:53:00.000Z",
      "amount": 0,
      "accountHolderName": "Solanki Poojaben Vipulbhai",
      "accountNumber": "40604227633",
      "ifscCode": "SBIN0060256",
      "utr": "UTR123456789",
      "status": "Succeeded",
      "source": "doa6ps"
    }
  ],
  "total": 1345,
  "totalPages": 90,
  "currentPage": 1,
  "hasMore": true
}
```

---

### 4. Account-Specific Transactions
**GET** `/transactions/{account}`

Retrieve transactions for a specific account.

#### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `account` | string | Yes | Account identifier (`doa6ps` or `fwxeqk`) |

#### Query Parameters
Same as `/transactions/all` endpoint.

#### Example Request
```
GET /api/transactions/doa6ps?page=1&size=15&status=Failed
```

#### Response
```json
{
  "transactions": [
    {
      "id": "64f7a1b2c3d4e5f6g7h8i9j0",
      "withdrawId": "HPAY20250817170032fwxEU",
      "date": "2025-08-17T17:00:32.000Z",
      "amount": 0,
      "accountHolderName": "Solanki Poojaben Vipulbhai",
      "accountNumber": "40604227633",
      "ifscCode": "SBIN0060256",
      "utr": null,
      "status": "Failed"
    }
  ],
  "total": 245,
  "totalPages": 17,
  "currentPage": 1,
  "hasMore": true
}
```

#### Error Response
```json
{
  "error": "Invalid account. Must be doa6ps or fwxeqk"
}
```

---

### 5. Transaction Summary
**GET** `/summary`

Get transaction summary statistics for a specific account number.

#### Query Parameters
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `accountNumber` | string | Yes | - | Account number to get summary for |
| `account` | string | No | all | Account filter (`all`, `doa6ps`, `fwxeqk`) |
| `status` | string | No | Succeeded | Transaction status filter |
| `startDate` | string | No | - | Start date filter (ISO format) |
| `endDate` | string | No | - | End date filter (ISO format) |

#### Example Request
```
GET /api/summary?accountNumber=40604227633&account=all&status=Succeeded
```

#### Response
```json
{
  "success": true,
  "data": {
    "accountNumber": "40604227633",
    "status": "Succeeded",
    "totalAmount": 2600000,
    "totalTransactions": 130,
    "account": "all",
    "filters": {
      "startDate": null,
      "endDate": null
    }
  }
}
```

#### Error Response
```json
{
  "success": false,
  "error": "Account number is required for summary"
}
```

---

### 6. Account Statistics
**GET** `/stats/{account}`

Get statistical overview for a specific account.

#### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `account` | string | Yes | Account identifier (`doa6ps` or `fwxeqk`) |

#### Example Request
```
GET /api/stats/doa6ps
```

#### Response
```json
{
  "total": 1234,
  "succeeded": 987,
  "processing": 123,
  "failed": 124
}
```

#### Error Response
```json
{
  "error": "Invalid account. Must be doa6ps or fwxeqk"
}
```

---

### 7. Cron Sync (Vercel)
**GET** `/cron/sync`  
**POST** `/cron/sync`

Internal endpoint for Vercel's cron system to trigger scheduled synchronization.

#### Headers
| Header | Required | Description |
|--------|----------|-------------|
| `Authorization` | Yes | `Bearer {CRON_SECRET}` |

#### Response
```json
{
  "success": true,
  "message": "Vercel cron sync completed successfully",
  "timestamp": "2025-08-17T20:30:00.000Z"
}
```

#### Error Responses
```json
{
  "error": "Unauthorized"
}
```

```json
{
  "success": false,
  "error": "Sync failed",
  "timestamp": "2025-08-17T20:30:00.000Z"
}
```

---

## Data Models

### Transaction Object
```typescript
{
  id: string;                    // Unique transaction identifier
  withdrawId: string;            // Withdrawal ID from payment system
  date: string;                  // Transaction creation date (ISO format)
  successDate?: string;          // Success timestamp (ISO format)
  amount: number;                // Transaction amount (default: 0)
  accountHolderName?: string;    // Account holder's name
  accountNumber?: string;        // Bank account number
  ifscCode?: string;             // Bank IFSC code
  utr?: string;                  // Unique Transaction Reference
  status: TransactionStatus;     // Transaction status
  source?: string;               // Source account (doa6ps/fwxeqk)
}
```

### Transaction Status
```typescript
type TransactionStatus = "Succeeded" | "Failed" | "Processing";
```

---

## Status Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 400 | Bad Request (Invalid parameters) |
| 401 | Unauthorized (Invalid cron secret) |
| 500 | Internal Server Error |

---

## Rate Limiting
Currently, there are no explicit rate limits implemented. However, the sync endpoints have built-in throttling to prevent excessive API calls to external services.

---

## Error Handling
All endpoints return consistent error responses with appropriate HTTP status codes. Error messages are descriptive and include timestamps for debugging purposes.

---

## Sync Schedule
- **Automatic Sync:** Daily at 1:00 AM IST
- **Manual Sync:** Available via POST `/sync` endpoint
- **Cron Sync:** Triggered by Vercel cron system (production only)

---

## Supported Accounts
- **DOA6PS** (🏢): Business account
- **FWXEQK** (📱): Mobile/personal account

---

## Environment Variables Required
```env
MONGODB_URI=mongodb://...
CRON_SECRET=your-secret-key
VERCEL=1 (for production)
```

---

## Usage Examples

### Get All Recent Transactions
```bash
curl -X GET "http://localhost:3000/api/transactions/all?page=1&size=10"
```

### Filter Failed Transactions for Specific Account
```bash
curl -X GET "http://localhost:3000/api/transactions/doa6ps?status=Failed&page=1&size=20"
```

### Search by Account Number
```bash
curl -X GET "http://localhost:3000/api/transactions/all?accountNumber=40604&page=1"
```

### Get Transaction Summary
```bash
curl -X GET "http://localhost:3000/api/summary?accountNumber=40604227633&account=all"
```

### Trigger Manual Sync
```bash
curl -X POST "http://localhost:3000/api/sync"
```

### Check Application Health
```bash
curl -X GET "http://localhost:3000/api/health"
```

---

**Last Updated:** August 17, 2025  
**API Version:** 1.0  
**Documentation Generated:** Automatically from source code analysis
