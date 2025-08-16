const cron = require('node-cron');
const { MongoClient } = require('mongodb');
const axios = require('axios');
require('dotenv').config();

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
};

// API URLs
const PRODUCER_API_URL = "https://report.taurus.cash/reportclient/producerController/send";
const WITHDRAW_API_URL = "https://landscape-api.taurus.cash/awclient/landscape/withdraw/withdrawDetail";

class DataSyncService {
  constructor() {
    this.client = null;
    this.db = null;
    this.doa6psCollection = null;
    this.fwxeqkCollection = null;
    this.isConnected = false;
    this.syncJob = null;
  }

  async connect() {
    if (this.isConnected) return;

    try {
      this.client = new MongoClient(process.env.MONGODB_URI);
      await this.client.connect();
      this.db = this.client.db('financeV1');
      this.doa6psCollection = this.db.collection('transactions_doa6ps');
      this.fwxeqkCollection = this.db.collection('transactions_fwxeqk');
      this.isConnected = true;
      
      console.log('✅ DataSync: Connected to MongoDB');
    } catch (error) {
      console.error('❌ DataSync: MongoDB connection failed:', error);
      throw error;
    }
  }

  getCollection(account) {
    return account === 'doa6ps' ? this.doa6psCollection : this.fwxeqkCollection;
  }

  async callProducerApi(config) {
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

  async fetchLatestTransactions(account) {
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
      console.error(`❌ DataSync: Failed to fetch latest data for ${account}:`, error);
      return [];
    }
  }

  processTransactionData(rawData, account) {
    return rawData.map((record) => {
      let withdrawRequest = {};
      
      if (record.withdrawRequest) {
        try {
          withdrawRequest = JSON.parse(record.withdrawRequest);
        } catch (error) {
          console.warn(`DataSync: Could not parse withdrawRequest for record: ${record.withdrawId}`);
        }
      }

      return {
        id: record.withdrawId || record.id?.toString() || '',
        withdrawId: record.withdrawId || '',
        date: this.formatDate(record.created || record.date || ''),
        accountHolderName: withdrawRequest.bankAccountHolderName || '',
        accountNumber: withdrawRequest.bankAccountNumber || '',
        ifscCode: withdrawRequest.bankAccountIfscCode || '',
        utr: record.utr || '',
        status: this.getStatusText(record.status || 0),
        statusCode: parseInt(record.status?.toString() || '0'),
        successDate: record.modified || record.success_date || '',
        account: account,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    });
  }

  formatDate(dateString) {
    if (!dateString) return '';
    try {
      return new Date(dateString).toISOString();
    } catch {
      return dateString;
    }
  }

  getStatusText(statusCode) {
    switch (statusCode) {
      case 2: return 'Processing';
      case 4: return 'Succeeded';
      default: return 'Failed';
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async syncAccount(account) {
    const collection = this.getCollection(account);
    const stats = { inserted: 0, updated: 0, errors: 0 };

    try {
      console.log(`🔄 DataSync: Syncing latest data for ${account.toUpperCase()}...`);
      
      const latestTransactions = await this.fetchLatestTransactions(account);
      
      if (latestTransactions.length === 0) {
        console.log(`⚠️ DataSync: No new data received for ${account}`);
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
              console.log(`🔄 DataSync: Updated transaction ${transaction.withdrawId} for ${account}`);
            }
          } else {
            // Insert new record
            await collection.insertOne(transaction);
            stats.inserted++;
            console.log(`➕ DataSync: Inserted new transaction ${transaction.withdrawId} for ${account}`);
          }
        } catch (error) {
          console.error(`❌ DataSync: Error processing transaction ${transaction.withdrawId}:`, error);
          stats.errors++;
        }
      }

      console.log(`✅ DataSync: ${account.toUpperCase()} sync completed - Inserted: ${stats.inserted}, Updated: ${stats.updated}, Errors: ${stats.errors}`);
      
    } catch (error) {
      console.error(`❌ DataSync: Account sync failed for ${account}:`, error);
    }

    return stats;
  }

  async performSync() {
    const startTime = new Date();
    console.log(`\n🚀 DataSync: Starting scheduled sync at ${startTime.toISOString()}`);

    try {
      await this.connect();
      
      // Sync both accounts
      const [doa6psStats, fwxeqkStats] = await Promise.all([
        this.syncAccount('doa6ps'),
        this.syncAccount('fwxeqk')
      ]);

      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      console.log(`\n📊 DataSync: Sync Summary (${duration}ms)`);
      console.log('═══════════════════════════════════════');
      console.log(`DOA6PS: +${doa6psStats.inserted} new, ~${doa6psStats.updated} updated, ❌${doa6psStats.errors} errors`);
      console.log(`FWXEQK: +${fwxeqkStats.inserted} new, ~${fwxeqkStats.updated} updated, ❌${fwxeqkStats.errors} errors`);
      console.log(`Total: +${doa6psStats.inserted + fwxeqkStats.inserted} new, ~${doa6psStats.updated + fwxeqkStats.updated} updated`);
      console.log('═══════════════════════════════════════');
      console.log(`⏰ Next sync scheduled in 30 minutes\n`);
      
    } catch (error) {
      console.error('❌ DataSync: Sync operation failed:', error);
    }
  }

  startCronJob() {
    // Schedule to run every 30 minutes: '0 */30 * * * *'
    // For testing, use every 2 minutes: '*/2 * * * *'
    this.syncJob = cron.schedule('0 */30 * * * *', async () => {
      await this.performSync();
    }, {
      timezone: "UTC"
    });

    console.log('🕐 DataSync: Cron job started - running every 30 minutes');
    
    // Run initial sync after 10 seconds
    setTimeout(() => {
      this.performSync();
    }, 10000);
  }

  stopCronJob() {
    if (this.syncJob) {
      this.syncJob.stop();
      this.syncJob.destroy();
      this.syncJob = null;
      console.log('🛑 DataSync: Cron job stopped');
    }
  }

  async disconnect() {
    this.stopCronJob();
    
    if (this.isConnected && this.client) {
      await this.client.close();
      this.isConnected = false;
      console.log('✅ DataSync: MongoDB connection closed');
    }
  }
}

// Initialize the data sync service
const dataSyncService = new DataSyncService();

// Start the service
async function startDataSync() {
  try {
    await dataSyncService.connect();
    dataSyncService.startCronJob();
    
    console.log('🚀 Finance-v1 Data Sync Service Started');
    console.log('📋 Configuration:');
    console.log('   - Sync Interval: Every 30 minutes');
    console.log('   - Accounts: DOA6PS, FWXEQK');
    console.log('   - Database: MongoDB Cloud');
    console.log('   - Mode: Smart Updates (insert new, update changed)');
    console.log('');
    console.log('⏰ Service is now running...');
  } catch (error) {
    console.error('❌ Failed to start data sync service:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down data sync service...');
  await dataSyncService.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down data sync service...');
  await dataSyncService.disconnect();
  process.exit(0);
});

// Start the service
startDataSync();
