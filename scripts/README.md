# Scripts

This directory contains various utility scripts for the finance dashboard.

## Available Scripts

### 1. Transaction Amount Updater (`update-transaction-amounts.ts`)

**Purpose**: Updates missing amounts for existing transactions by fetching data from third-party APIs.

**What it does**:
- Scans your database for transactions with missing or zero amounts
- Calls third-party APIs page by page (15 records per page) for both accounts (DOA6PS and FWXEQK)
- Matches transactions by `withdrawId` and updates the amount field
- Also updates other fields like UTR, status, and success date if available

**Usage**:
```bash
npm run update-amounts
```

**Features**:
- ✅ Processes both accounts (DOA6PS and FWXEQK) sequentially
- ✅ Fetches pages until all missing amounts are updated or API data is exhausted (up to 200 pages / 3000 records per account)
- ✅ **Smart rate limiting** to prevent API blocks:
  - 15-25 seconds between API pages
  - 20-30 seconds between accounts
  - No delays for database updates (fast processing)
- ✅ Comprehensive logging and progress tracking
- ✅ Error handling and graceful failure recovery
- ✅ Statistics reporting (updated count, errors, etc.)
- ✅ Safe updates (only updates transactions that exist in your database)

**Output Example**:
```
🚀 Starting Transaction Amount Update Script
⏰ Started at: 8/19/2025, 10:30:00 AM

🚀 Starting amount update for DOA6PS
══════════════════════════════════════════════════
📊 Found 45 transactions with missing amounts in DOA6PS
🔄 Fetching page 1 (15 records) for DOA6PS...
✅ Fetched 15 records from page 1 for DOA6PS
✅ Updated WD123456: Amount = ₹1500
✅ Updated WD123457: Amount = ₹2500
...

📊 Summary for DOA6PS
══════════════════════════════════════════════════
Total API records checked: 45
DB transactions missing amounts: 45
Successfully updated: 43
Not found in API: 2
Errors: 0
```

### 2. Migration Scripts

#### migrate-transactions.ts
Migrates transaction data between database collections or formats.

#### run-migration.ts
Runner script to execute the migration.

## Environment Setup

Make sure you have the necessary environment variables set in `.env.local`:

```env
MONGODB_URI=your_mongodb_connection_string
```

## Notes

- All scripts include proper error handling and connection management
- **The amount updater script uses smart rate limiting** to avoid API blocks:
  - Only delays between API calls (not database updates)
  - Much faster processing while still respecting API limits
- Scripts can be safely interrupted with Ctrl+C - they will clean up connections gracefully
- Always backup your database before running any scripts in production
- **Timing**: For 100 transactions across both accounts, expect ~15-20 minutes runtime