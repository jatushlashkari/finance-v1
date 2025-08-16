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
    
    try {
      // Call producer API first
      await this.callProducerApi(config);
      
      // Wait 2 seconds before calling withdraw API
      await this.delay(2000);
      
      // Fetch only page 1 (latest data)
      const payload = { page: 1, size: 15 };

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

      const response = await axios.post(WITHDRAW_API_URL, payload, { headers });
      
      if (response.data.code === 0 && response.data.data?.records) {
        return this.processTransactionData(response.data.data.records, account);
      }

      throw new Error(`API returned error code: ${response.data.code}`);
    } catch (error) {
      console.error(`❌ NextJS-CronSync: Failed to fetch latest data for ${account}:`, error);
      return [];
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

      return {
        id: String(record.withdrawId || record.id || ''),
        withdrawId: String(record.withdrawId || ''),
        date: this.formatDate(String(record.created || record.date || '')),
        accountHolderName: String(withdrawRequest.bankAccountHolderName || ''),
        accountNumber: String(withdrawRequest.bankAccountNumber || ''),
        ifscCode: String(withdrawRequest.bankAccountIfscCode || ''),
        utr: String(record.utr || ''),
        status: this.getStatusText(Number(record.status || 0)),
        statusCode: parseInt(String(record.status || '0')),
        successDate: String(record.modified || record.success_date || ''),
        account: account,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    });
  }

  private formatDate(dateString: string) {
    if (!dateString) return '';
    try {
      return new Date(dateString).toISOString();
    } catch {
      return dateString;
    }
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
            // Check if any important fields have changed
            const hasChanges = 
              existingTransaction.status !== transaction.status ||
              existingTransaction.statusCode !== transaction.statusCode ||
              existingTransaction.successDate !== transaction.successDate ||
              existingTransaction.utr !== transaction.utr ||
              (!existingTransaction.utr && transaction.utr) ||
              (!existingTransaction.successDate && transaction.successDate);

            if (hasChanges) {
              // Update the existing record
              await collection.updateOne(
                { withdrawId: transaction.withdrawId },
                { 
                  $set: {
                    status: transaction.status,
                    statusCode: transaction.statusCode,
                    successDate: transaction.successDate,
                    utr: transaction.utr,
                    updatedAt: new Date()
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
    const startTime = new Date();
    console.log(`\n🚀 NextJS-CronSync: Starting scheduled sync at ${startTime.toISOString()}`);

    try {
      await this.connect();
      
      // Sync both accounts
      const [doa6psStats, fwxeqkStats] = await Promise.all([
        this.syncAccount('doa6ps'),
        this.syncAccount('fwxeqk')
      ]);

      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      console.log(`\n📊 NextJS-CronSync: Sync Summary (${duration}ms)`);
      console.log('═══════════════════════════════════════');
      console.log(`DOA6PS: +${doa6psStats.inserted} new, ~${doa6psStats.updated} updated, ❌${doa6psStats.errors} errors`);
      console.log(`FWXEQK: +${fwxeqkStats.inserted} new, ~${fwxeqkStats.updated} updated, ❌${fwxeqkStats.errors} errors`);
      console.log(`Total: +${doa6psStats.inserted + fwxeqkStats.inserted} new, ~${doa6psStats.updated + fwxeqkStats.updated} updated`);
      console.log('═══════════════════════════════════════');
      console.log(`⏰ Next sync scheduled in 30 minutes\n`);
      
    } catch (error) {
      console.error('❌ NextJS-CronSync: Sync operation failed:', error);
    }
  }

  startCronJob() {
    // Only start if we're in a server environment (not during build)
    if (typeof window !== 'undefined') return;

    // Schedule to run every 30 minutes: '0 */30 * * * *'
    this.syncJob = cron.schedule('0 */30 * * * *', async () => {
      await this.performSync();
    }, {
      timezone: "UTC"
    });

    console.log('🕐 NextJS-CronSync: Integrated cron job started - running every 30 minutes');
    
    // Run initial sync after 10 seconds
    setTimeout(() => {
      this.performSync();
    }, 10000);

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
if (typeof window === 'undefined' && process.env.NODE_ENV !== 'production') {
  // Only auto-start in development mode
  const service = getCronSyncService();
  service.startCronJob();
  
  console.log('🚀 NextJS Finance-v1 Integrated Data Sync Service');
  console.log('📋 Configuration:');
  console.log('   - Sync Interval: Every 30 minutes');
  console.log('   - Accounts: DOA6PS, FWXEQK');
  console.log('   - Database: MongoDB Cloud');
  console.log('   - Mode: Integrated with Next.js');
  console.log('');
}
