// app/lib/cronService.ts
import cron, { ScheduledTask } from 'node-cron';
import { MongoClient, Collection, Db } from 'mongodb';
import axios from 'axios';

interface TransactionData {
  id?: string;
  withdrawId?: string;
  transaction_id?: string;
  amount?: number;
  date: string;
  status: string;
  accountHolderName?: string;
  accountNumber?: string;
  ifscCode?: string;
  utr?: string;
  statusCode?: number;
  successDate?: string;
  account?: string;
  createdAt?: Date;
  updatedAt?: Date;
  [key: string]: unknown;
}



// API Configurations
const API_CONFIGS = {
  doa6ps: {
    code: "doa6ps",
    channel: "slm_1900304",
    aid: "e132ca14-8368-4f4f-8178-e1ce23bfbb7d",
    token: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJzdWIiOiIxMTIwOTQ2MTg3NyIsImlhdCI6MTc1NDQxNjI3OSwiZXhwIjoxNTY5Mzk2MDE2Mjc5fQ.KQW6l2JRpm4IivmfiD2mSd68KRjUsWvTU1UTo5nZ_32EOcHeC-ixHG-yaDRujq8ubEBlwhYc4O4P7WJzdkFV7g",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
    pkg: "",
    gaid: null,
    uid: ""
  },
  fwxeqk: {
    code: "fwxeqk",
    channel: "slm_1100014",
    aid: "92337cb6ce3ec1fa",
    gaid: "396124e8-87ce-46f4-a5ef-a6205ad8d2ef",
    uid: "105632431",
    pkg: "com.bauk.nibwf",
    token: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJzdWIiOiIxMTEyMDMyNTkwMyIsImlhdCI6MTczNzMwMzcyNCwiZXhwIjoxNTY5Mzc4OTAzNzI0fQ.p7EBWCIFM2yRgWvFLJTdoqmk2pFcf7kCE_iDsXIwMcJP8kztBdiXmRHKLrLy0WndaYnOyjf0Y0Pp_RS4njU4mw",
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1"
  }
} as const;

// API URLs
const PRODUCER_API_URL = "https://report.taurus.cash/reportclient/producerController/send";
const WITHDRAW_API_URL = "https://landscape-api.taurus.cash/awclient/landscape/withdraw/withdrawDetail";

export class IntegratedDataSyncService {
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private doa6psCollection: Collection<TransactionData> | null = null;
  private fwxeqkCollection: Collection<TransactionData> | null = null;
  private isConnected: boolean = false;
  private syncJob: ScheduledTask | null = null;

  async connect() {
    if (this.isConnected) return;

    try {
      this.client = new MongoClient(process.env.MONGODB_URI!);
      await this.client.connect();
      this.db = this.client.db('financeV1');
      this.doa6psCollection = this.db.collection('transactions_doa6ps');
      this.fwxeqkCollection = this.db.collection('transactions_fwxeqk');
      this.isConnected = true;
      
      console.log('✅ NextJS-CronSync: Connected to MongoDB');
    } catch (error) {
      console.error('❌ NextJS-CronSync: MongoDB connection failed:', error);
      throw error;
    }
  }

  private getCollection(account: keyof typeof API_CONFIGS) {
    return account === 'doa6ps' ? this.doa6psCollection : this.fwxeqkCollection;
  }

  private async callProducerApi(config: typeof API_CONFIGS[keyof typeof API_CONFIGS]) {
    const currentTs = Date.now();
    
    const payload = {
      code: config.code,
      ts: currentTs,
      cts: "",
      pkg: config.pkg || "",
      channel: config.channel,
      pn: "hy",
      ip: "",
      platform: "vungo",
      aid: config.aid,
      gaid: config.gaid || null,
      taurus_stat_uuid: null,
      uid: config.uid || "",
      type: "event",
      listJson: [
        {
          ts: Math.floor(currentTs / 1000).toString(),
          eventKey: "tcpa_w/d_Historical",
          eventValue: ""
        }
      ]
    };

    const headers = {
      "accept": "application/json, text/plain, */*",
      "accept-language": "en-US,en;q=0.9",
      "content-type": "application/json",
      "origin": "https://h5-share.agent61.com",
      "priority": "u=1, i",
      "referer": "https://h5-share.agent61.com/",
      "sec-ch-ua": '"Not)A;Brand";v="8", "Chromium";v="138", "Google Chrome";v="138"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "cross-site",
      "user-agent": config.userAgent
    };

    await axios.post(PRODUCER_API_URL, payload, { headers });
  }

  private async fetchLatestTransactions(account: keyof typeof API_CONFIGS) {
    const config = API_CONFIGS[account];
    const allTransactions: TransactionData[] = [];
    
    try {
      // Call producer API first
      await this.callProducerApi(config);
      
      // Wait 2 seconds before calling withdraw API
      await this.delay(2000);
      
      const headers = {
        "accept": "application/json, text/plain, */*",
        "accept-language": "en-US,en;q=0.9",
        "content-type": "application/json;charset=UTF-8",
        "priority": "u=1, i",
        "sec-ch-ua": '"Not)A;Brand";v="8", "Chromium";v="138", "Google Chrome";v="138"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "cross-site",
        "sec-fetch-storage-access": "active",
        "token": config.token,
        "Referer": "https://h5-share.agent61.com/",
        "user-agent": config.userAgent
      };

      // Fetch page 1 (latest data)
      console.log(`🔄 NextJS-CronSync: Fetching page 1 for ${account.toUpperCase()}...`);
      const page1Payload = { page: 1, size: 15 };
      const page1Response = await axios.post(WITHDRAW_API_URL, page1Payload, { headers });
      
      if (page1Response.data.code === 0 && page1Response.data.data?.records) {
        const page1Transactions = this.processTransactionData(page1Response.data.data.records, account);
        allTransactions.push(...page1Transactions);
        console.log(`✅ NextJS-CronSync: Fetched ${page1Transactions.length} records from page 1 for ${account.toUpperCase()}`);
      } else {
        throw new Error(`Page 1 API returned error code: ${page1Response.data.code}`);
      }

      // Wait 5-10 seconds before fetching page 2 (random delay to avoid rate limiting)
      const delayTime = Math.floor(Math.random() * 5000) + 5000; // Random between 5-10 seconds
      console.log(`⏳ NextJS-CronSync: Waiting ${delayTime}ms before fetching page 2 for ${account.toUpperCase()}...`);
      await this.delay(delayTime);
      
      // Fetch page 2
      console.log(`🔄 NextJS-CronSync: Fetching page 2 for ${account.toUpperCase()}...`);
      const page2Payload = { page: 2, size: 15 };
      const page2Response = await axios.post(WITHDRAW_API_URL, page2Payload, { headers });
      
      if (page2Response.data.code === 0 && page2Response.data.data?.records) {
        const page2Transactions = this.processTransactionData(page2Response.data.data.records, account);
        allTransactions.push(...page2Transactions);
        console.log(`✅ NextJS-CronSync: Fetched ${page2Transactions.length} records from page 2 for ${account.toUpperCase()}`);
      } else {
        console.warn(`⚠️ NextJS-CronSync: Page 2 API returned error code: ${page2Response.data.code} for ${account.toUpperCase()}`);
        // Don't throw error for page 2 failures, just log and continue with page 1 data
      }

      console.log(`📊 NextJS-CronSync: Total ${allTransactions.length} records fetched from both pages for ${account.toUpperCase()}`);
      return allTransactions;
      
    } catch (error) {
      console.error(`❌ NextJS-CronSync: Failed to fetch data for ${account}:`, error);
      return allTransactions; // Return whatever we managed to fetch
    }
  }

  private processTransactionData(rawData: Record<string, unknown>[], account: keyof typeof API_CONFIGS) {
    return rawData.map((record) => {
      let withdrawRequest: Record<string, unknown> = {};
      
      if (record.withdrawRequest && typeof record.withdrawRequest === 'string') {
        try {
          withdrawRequest = JSON.parse(record.withdrawRequest);
        } catch (error) {
          console.warn(`NextJS-CronSync: Could not parse withdrawRequest for record: ${record.withdrawId}`);
        }
      }

      // Get raw dates from API - try multiple fields for the transaction date
      const possibleDateFields = [record.created, record.date, record.createdTime, record.created_at];
      const rawTransactionDate = possibleDateFields.find(date => date && String(date).trim() !== '') || '';
      
      // Get raw success date from API - try multiple fields
      const possibleSuccessDateFields = [record.modified, record.success_date, record.successDate, record.updated];
      const rawSuccessDate = possibleSuccessDateFields.find(date => date && String(date).trim() !== '') || '';

      const processedTransaction = {
        id: String(record.withdrawId || record.id || ''),
        withdrawId: String(record.withdrawId || ''),
        date: this.parseAndFormatApiDate(String(rawTransactionDate)), // Store exact API date
        amount: Number(record.amount || 0), // Extract amount from API
        accountHolderName: String(withdrawRequest.bankAccountHolderName || ''),
        accountNumber: String(withdrawRequest.bankAccountNumber || ''),
        ifscCode: String(withdrawRequest.bankAccountIfscCode || ''),
        utr: String(record.utr || ''),
        status: this.getStatusText(Number(record.status || 0)),
        statusCode: parseInt(String(record.status || '0')),
        successDate: rawSuccessDate ? this.parseAndFormatApiDate(String(rawSuccessDate)) : '', // Store exact API success date
        account: account,
        createdAt: this.getCurrentISTDate(), // Only system timestamps use IST
        updatedAt: this.getCurrentISTDate()
      };



      return processedTransaction;
    });
  }

  private parseAndFormatApiDate(dateString: string): string {
    if (!dateString) return '';
    
    try {
      // Handle different date formats from the API
      let parsedDate: Date;
      
      // Check if it's already a timestamp (13 digits)
      if (/^\d{13}$/.test(dateString)) {
        parsedDate = new Date(parseInt(dateString));
      }
      // Check if it's a 10-digit timestamp (seconds)
      else if (/^\d{10}$/.test(dateString)) {
        parsedDate = new Date(parseInt(dateString) * 1000);
      }
      // Check if it's already an ISO date string with timezone
      else if (dateString.includes('T') && (dateString.includes('Z') || dateString.includes('+'))) {
        parsedDate = new Date(dateString);
      }
      // Handle space-separated date format like "2025-08-17 13:12:13" - treat as IST
      else if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(dateString)) {
        // API gives us IST time without timezone info, so add IST offset
        parsedDate = new Date(dateString + '+05:30');
      }
      // Try direct parsing for other formats
      else {
        parsedDate = new Date(dateString);
      }

      if (isNaN(parsedDate.getTime())) {
        console.warn(`NextJS-CronSync: Could not parse API date: ${dateString}, returning original`);
        return dateString; // Return original if can't parse
      }
      
      // Return as ISO string for consistent storage format
      return parsedDate.toISOString();
    } catch (error) {
      console.error(`NextJS-CronSync: Error parsing API date ${dateString}:`, error);
      return dateString; // Return original if error
    }
  }

  private formatDateIST(dateString: string) {
    if (!dateString) return '';
    
    try {
      // Handle different date formats from the API
      let parsedDate: Date;
      
      // Check if it's already a timestamp (13 digits)
      if (/^\d{13}$/.test(dateString)) {
        parsedDate = new Date(parseInt(dateString));
      }
      // Check if it's a timestamp in seconds (10 digits)
      else if (/^\d{10}$/.test(dateString)) {
        parsedDate = new Date(parseInt(dateString) * 1000);
      }
      // Check if it's in format like "2025-08-17 14:30:25" or "2025-08-17T14:30:25"
      else if (/^\d{4}-\d{2}-\d{2}[\sT]\d{2}:\d{2}:\d{2}/.test(dateString)) {
        // Replace space with T for proper ISO format
        const isoString = dateString.replace(' ', 'T');
        // Assume the date is in IST if no timezone info is provided
        if (!isoString.includes('Z') && !isoString.includes('+') && !isoString.includes('-', 10)) {
          // Treat as IST time and convert to UTC for storage
          parsedDate = new Date(isoString + '+05:30');
        } else {
          parsedDate = new Date(isoString);
        }
      }
      // Try direct parsing for other formats
      else {
        parsedDate = new Date(dateString);
      }
      
      // Validate the parsed date
      if (isNaN(parsedDate.getTime())) {
        console.warn(`⚠️ Invalid date format: ${dateString}, using current IST date`);
        return this.getCurrentISTDate().toISOString();
      }
      
      // Store as ISO string (UTC) but ensure the original time was interpreted correctly
      return parsedDate.toISOString();
    } catch (error) {
      console.warn(`⚠️ Date parsing error for: ${dateString}, using current IST date. Error:`, error);
      return this.getCurrentISTDate().toISOString();
    }
  }

  private getCurrentISTDate(): Date {
    // Get current time in IST (UTC+5:30)
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30 in milliseconds
    return new Date(now.getTime() + istOffset);
  }

  private getStatusText(statusCode: number) {
    switch (statusCode) {
      case 2: return 'Processing';
      case 4: return 'Succeeded';
      default: return 'Failed';
    }
  }

  private delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async syncAccount(account: keyof typeof API_CONFIGS) {
    const collection = this.getCollection(account);
    const stats = { inserted: 0, updated: 0, errors: 0 };

    try {
      console.log(`🔄 NextJS-CronSync: Syncing latest data for ${account.toUpperCase()}...`);
      
      const latestTransactions = await this.fetchLatestTransactions(account);
      
      if (latestTransactions.length === 0) {
        console.log(`⚠️ NextJS-CronSync: No new data received for ${account}`);
        return stats;
      }

      if (!collection) {
        console.error(`❌ NextJS-CronSync: Collection not available for ${account}`);
        return stats;
      }

      for (const transaction of latestTransactions) {
        try {
          const existingTransaction = await collection.findOne({ withdrawId: transaction.withdrawId });
          
          if (existingTransaction) {
            // Check if any important fields have changed - prioritize success date and status
            const hasStatusChange = existingTransaction.status !== transaction.status || 
                                  existingTransaction.statusCode !== transaction.statusCode;
            
            const hasSuccessDateChange = existingTransaction.successDate !== transaction.successDate;
            
            const hasDateChange = existingTransaction.date !== transaction.date;
            
            const hasAmountChange = existingTransaction.amount !== transaction.amount;
            
            const hasUtrChange = (existingTransaction.utr || '') !== (transaction.utr || '') ||
                               (!existingTransaction.utr && transaction.utr);

            const hasNewSuccessDate = !existingTransaction.successDate && transaction.successDate;

            const hasChanges = hasStatusChange || hasSuccessDateChange || hasDateChange || hasAmountChange || hasUtrChange || hasNewSuccessDate;



            if (hasChanges) {
              // Log the changes for debugging
              if (process.env.NODE_ENV === 'development') {
                console.log(`🔄 Changes detected for ${transaction.withdrawId}:`, {
                  statusChange: hasStatusChange ? `${existingTransaction.status} → ${transaction.status}` : null,
                  successDateChange: hasSuccessDateChange ? `${existingTransaction.successDate} → ${transaction.successDate}` : null,
                  dateChange: hasDateChange ? `${existingTransaction.date} → ${transaction.date}` : null,
                  amountChange: hasAmountChange ? `${existingTransaction.amount} → ${transaction.amount}` : null,
                  utrChange: hasUtrChange ? `${existingTransaction.utr} → ${transaction.utr}` : null,
                  hasNewSuccessDate: hasNewSuccessDate
                });
              }

              // Update the existing record with all new data from API
              await collection.updateOne(
                { withdrawId: transaction.withdrawId },
                { 
                  $set: {
                    date: transaction.date, // Update with exact API date
                    amount: transaction.amount, // Update with exact API amount
                    status: transaction.status,
                    statusCode: transaction.statusCode,
                    successDate: transaction.successDate, // Update with exact API success date
                    utr: transaction.utr,
                    updatedAt: this.getCurrentISTDate() // Only system timestamp uses IST
                  }
                }
              );
              stats.updated++;
              console.log(`🔄 NextJS-CronSync: Updated transaction ${transaction.withdrawId} for ${account}`);
            }
          } else {
            // Insert new record
            await collection.insertOne(transaction);
            stats.inserted++;
            console.log(`➕ NextJS-CronSync: Inserted new transaction ${transaction.withdrawId} for ${account}`);
          }
        } catch (error) {
          console.error(`❌ NextJS-CronSync: Error processing transaction ${transaction.withdrawId}:`, error);
          stats.errors++;
        }
      }

      console.log(`✅ NextJS-CronSync: ${account.toUpperCase()} sync completed - Inserted: ${stats.inserted}, Updated: ${stats.updated}, Errors: ${stats.errors}`);
      
    } catch (error) {
      console.error(`❌ NextJS-CronSync: Account sync failed for ${account}:`, error);
    }

    return stats;
  }

  private async performSync() {
    const startTime = this.getCurrentISTDate();
    const startTimeIST = startTime.toLocaleString('en-IN', { 
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    console.log(`\n🚀 NextJS-CronSync: Starting scheduled sync at ${startTimeIST} IST`);

    try {
      await this.connect();
      
      // Sync accounts sequentially to avoid overwhelming the API
      console.log(`🔄 NextJS-CronSync: Syncing DOA6PS account...`);
      const doa6psStats = await this.syncAccount('doa6ps');
      
      // Wait 10-15 seconds before syncing the next account
      const accountDelayTime = Math.floor(Math.random() * 5000) + 10000; // Random between 10-15 seconds
      console.log(`⏳ NextJS-CronSync: Waiting ${accountDelayTime}ms before syncing next account...`);
      await this.delay(accountDelayTime);
      
      console.log(`🔄 NextJS-CronSync: Syncing FWXEQK account...`);
      const fwxeqkStats = await this.syncAccount('fwxeqk');

      const endTime = this.getCurrentISTDate();
      const duration = endTime.getTime() - startTime.getTime();

      const endTimeIST = endTime.toLocaleString('en-IN', { 
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });

      console.log(`\n📊 NextJS-CronSync: Sync Summary (${duration}ms) - Completed at ${endTimeIST} IST`);
      console.log('═══════════════════════════════════════');
      console.log(`DOA6PS: +${doa6psStats.inserted} new, ~${doa6psStats.updated} updated, ❌${doa6psStats.errors} errors`);
      console.log(`FWXEQK: +${fwxeqkStats.inserted} new, ~${fwxeqkStats.updated} updated, ❌${fwxeqkStats.errors} errors`);
      console.log(`Total: +${doa6psStats.inserted + fwxeqkStats.inserted} new, ~${doa6psStats.updated + fwxeqkStats.updated} updated`);
      console.log('═══════════════════════════════════════');
      console.log(`⏰ Next sync scheduled for tomorrow at 1 AM IST\n`);
      
    } catch (error) {
      console.error('❌ NextJS-CronSync: Sync operation failed:', error);
    }
  }

  startCronJob() {
    // Only start if we're in a server environment (not during build)
    if (typeof window !== 'undefined') return;

    // Check if we're on Vercel (serverless environment)
    const isVercel = process.env.VERCEL === '1';
    
    if (isVercel) {
      console.log('🚀 Vercel Environment: Cron jobs will be handled by Vercel Cron system');
      console.log('📝 Make sure vercel.json is configured with cron schedule');
      return null;
    }

    // Schedule to run every 30 minutes in dev (production uses Vercel cron: daily at 1 AM IST)
    this.syncJob = cron.schedule('0 */30 * * * *', async () => {
      await this.performSync();
    }, {
      timezone: "Asia/Kolkata"
    });

    console.log('🕐 NextJS-CronSync: Integrated cron job started - running daily at 1 AM IST');
    
    // Run initial sync after 10 seconds (only in development)
    if (process.env.NODE_ENV !== 'production') {
      setTimeout(() => {
        this.performSync();
      }, 10000);
    }

    return this.syncJob;
  }

  stopCronJob() {
    if (this.syncJob) {
      this.syncJob.stop();
      this.syncJob = null;
      console.log('🛑 NextJS-CronSync: Cron job stopped');
    }
  }

  async disconnect() {
    this.stopCronJob();
    
    if (this.isConnected && this.client) {
      await this.client.close();
      this.isConnected = false;
      console.log('✅ NextJS-CronSync: MongoDB connection closed');
    }
  }

  // Manual sync method for API endpoints
  async manualSync() {
    return await this.performSync();
  }
}

// Create a singleton instance
let syncServiceInstance: IntegratedDataSyncService | null = null;

export function getCronSyncService(): IntegratedDataSyncService {
  if (!syncServiceInstance) {
    syncServiceInstance = new IntegratedDataSyncService();
  }
  return syncServiceInstance;
}

// Auto-start the cron job when this module is imported in server environment
if (typeof window === 'undefined') {
  const isVercel = process.env.VERCEL === '1';
  
  if (!isVercel && process.env.NODE_ENV !== 'production') {
    // Only auto-start in development mode (non-Vercel)
    const service = getCronSyncService();
    service.startCronJob();
  }
  
  console.log('🚀 NextJS Finance-v1 Integrated Data Sync Service');
  console.log('📋 Configuration:');
  console.log('   - Sync Interval: Daily at 1 AM IST');
  console.log('   - Accounts: DOA6PS, FWXEQK');
  console.log('   - Pages: 1 & 2 (30 records per account)');
  console.log('   - Database: MongoDB Cloud');
  console.log('   - Delays: 5-10s between pages, 10-15s between accounts');
  console.log(`   - Mode: ${isVercel ? 'Vercel Serverless Cron' : 'Integrated with Next.js'}`);
  console.log('');
}
