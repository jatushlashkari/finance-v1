// scripts/update-transaction-amounts.ts
import { MongoClient, Collection, Db } from 'mongodb';
import axios from 'axios';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env' });

interface TransactionDocument {
  _id?: any;
  id?: string;
  withdrawId: string;
  date: string;
  amount?: number | null;
  accountHolderName?: string;
  accountNumber?: string;
  ifscCode?: string;
  utr?: string;
  status: string;
  statusCode?: number;
  successDate?: string;
  account?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ApiTransaction {
  withdrawId: string;
  amount: number;
  status: number;
  created: string;
  modified?: string;
  utr?: string;
  withdrawRequest?: string;
}

interface ApiResponse {
  code: number;
  data: {
    records: ApiTransaction[];
    total: number;
    pages: number;
    page: number;
    size: number;
  };
  message?: string;
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

class TransactionAmountUpdater {
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private isConnected: boolean = false;

  async connect() {
    if (this.isConnected) return;

    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

    try {
      this.client = new MongoClient(process.env.MONGODB_URI);
      await this.client.connect();
      this.db = this.client.db('financeV1');
      this.isConnected = true;
      
      console.log('✅ Connected to MongoDB');
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error);
      throw error;
    }
  }

  async disconnect() {
    if (this.isConnected && this.client) {
      await this.client.close();
      this.isConnected = false;
      console.log('✅ MongoDB connection closed');
    }
  }

  private getCollection(account: keyof typeof API_CONFIGS): Collection<TransactionDocument> {
    if (!this.db) throw new Error('Database not connected');
    return this.db.collection<TransactionDocument>(`transactions_${account}`);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async callProducerApi(config: typeof API_CONFIGS[keyof typeof API_CONFIGS]): Promise<void> {
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

    try {
      await axios.post(PRODUCER_API_URL, payload, { headers });
      console.log(`✅ Producer API call successful for ${config.code}`);
    } catch (error) {
      console.error(`❌ Producer API call failed for ${config.code}:`, error);
      throw error;
    }
  }

  private async fetchTransactionsFromAPI(
    account: keyof typeof API_CONFIGS, 
    page: number = 1, 
    size: number = 15
  ): Promise<ApiTransaction[]> {
    const config = API_CONFIGS[account];
    
    try {
      // Call producer API first
      await this.callProducerApi(config);
      
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

      const payload = { page, size };
      
      console.log(`🔄 Fetching page ${page} (${size} records) for ${account.toUpperCase()}...`);
      
      const response = await axios.post<ApiResponse>(WITHDRAW_API_URL, payload, { headers });
      
      if (response.data.code === 0 && response.data.data?.records) {
        console.log(`✅ Fetched ${response.data.data.records.length} records from page ${page} for ${account.toUpperCase()}`);
        return response.data.data.records;
      } else {
        throw new Error(`API returned error code: ${response.data.code}, message: ${response.data.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error(`❌ Failed to fetch transactions from API for ${account}, page ${page}:`, error);
      return [];
    }
  }

  private async getTransactionsWithMissingAmounts(account: keyof typeof API_CONFIGS): Promise<TransactionDocument[]> {
    const collection = this.getCollection(account);
    
    // Find transactions that have missing or zero amounts
    const transactions = await collection.find({
      $or: [
        { amount: { $exists: false } },
        { amount: 0 },
        { amount: { $eq: null } }
      ]
    }).toArray();

    console.log(`📊 Found ${transactions.length} transactions with missing amounts in ${account.toUpperCase()}`);
    return transactions;
  }

  private async updateTransactionAmount(
    account: keyof typeof API_CONFIGS,
    withdrawId: string,
    amount: number,
    additionalData?: Partial<TransactionDocument>
  ): Promise<boolean> {
    const collection = this.getCollection(account);
    
    try {
      const updateData: any = {
        amount,
        updatedAt: new Date()
      };

      // Add any additional data from API
      if (additionalData) {
        if (additionalData.utr) updateData.utr = additionalData.utr;
        if (additionalData.status) updateData.status = additionalData.status;
        if (additionalData.statusCode) updateData.statusCode = additionalData.statusCode;
        if (additionalData.successDate) updateData.successDate = additionalData.successDate;
      }

      const result = await collection.updateOne(
        { withdrawId },
        { $set: updateData }
      );

      return result.modifiedCount > 0;
    } catch (error) {
      console.error(`❌ Failed to update transaction ${withdrawId}:`, error);
      return false;
    }
  }

  private getStatusText(statusCode: number): string {
    switch (statusCode) {
      case 2: return 'Processing';
      case 4: return 'Succeeded';
      default: return 'Failed';
    }
  }

  private parseAndFormatApiDate(dateString: string): string {
    if (!dateString) return '';
    
    try {
      let parsedDate: Date;
      
      // Check if it's already a timestamp (13 digits)
      if (/^\d{13}$/.test(dateString)) {
        parsedDate = new Date(parseInt(dateString));
      }
      // Check if it's a 10-digit timestamp (seconds)
      else if (/^\d{10}$/.test(dateString)) {
        parsedDate = new Date(parseInt(dateString) * 1000);
      }
      // Handle space-separated date format like "2025-08-17 13:12:13" - treat as IST
      else if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(dateString)) {
        // API gives us IST time without timezone info, so add IST offset
        parsedDate = new Date(dateString + '+05:30');
      }
      else {
        parsedDate = new Date(dateString);
      }

      if (isNaN(parsedDate.getTime())) {
        console.warn(`Could not parse API date: ${dateString}`);
        return dateString;
      }
      
      return parsedDate.toISOString();
    } catch (error) {
      console.error(`Error parsing API date ${dateString}:`, error);
      return dateString;
    }
  }

  async updateAmountsForAccount(account: keyof typeof API_CONFIGS): Promise<void> {
    console.log(`\n🚀 Starting amount update for ${account.toUpperCase()}`);
    console.log('═'.repeat(50));

    const stats = {
      totalChecked: 0,
      missingAmounts: 0,
      updated: 0,
      notFound: 0,
      errors: 0
    };

    try {
      // Get transactions with missing amounts from database
      const dbTransactions = await this.getTransactionsWithMissingAmounts(account);
      stats.missingAmounts = dbTransactions.length;

      if (dbTransactions.length === 0) {
        console.log(`✅ No transactions with missing amounts found for ${account.toUpperCase()}`);
        return;
      }

      // Create a map for quick lookup of database transactions
      const dbTransactionMap = new Map<string, TransactionDocument>();
      dbTransactions.forEach(tx => {
        dbTransactionMap.set(tx.withdrawId, tx);
      });

      // Fetch transactions from API in pages
      let currentPage = 1;
      const pageSize = 15;
      let hasMorePages = true;
      const processedWithdrawIds = new Set<string>();
      let remainingToUpdate = dbTransactions.length;

      while (hasMorePages && remainingToUpdate > 0 && currentPage <= 200) { // Continue until no more pages, all updated, or 200 pages max (3000 records)
        const apiTransactions = await this.fetchTransactionsFromAPI(account, currentPage, pageSize);
        
        if (apiTransactions.length === 0) {
          console.log(`📄 No more transactions found at page ${currentPage}`);
          hasMorePages = false;
          break;
        }

        stats.totalChecked += apiTransactions.length;

        // Process each API transaction
        for (const apiTx of apiTransactions) {
          if (processedWithdrawIds.has(apiTx.withdrawId)) {
            continue; // Skip duplicates
          }
          processedWithdrawIds.add(apiTx.withdrawId);

          const dbTx = dbTransactionMap.get(apiTx.withdrawId);
          
          if (dbTx) {
            // Check if DB transaction actually needs updating (has missing or zero amount)
            const dbAmount = Number(dbTx.amount || 0);
            const apiAmount = Number(apiTx.amount || 0);
            
            // Only update if DB has missing/zero amount AND API has non-zero amount
            if (dbAmount === 0 && apiAmount > 0) {
              // Prepare additional data from API
              const additionalData: Partial<TransactionDocument> = {
                utr: apiTx.utr || dbTx.utr,
                status: this.getStatusText(apiTx.status),
                statusCode: apiTx.status,
                successDate: apiTx.modified ? this.parseAndFormatApiDate(apiTx.modified) : dbTx.successDate
              };

              const updated = await this.updateTransactionAmount(
                account,
                apiTx.withdrawId,
                apiAmount,
                additionalData
              );

              if (updated) {
                stats.updated++;
                remainingToUpdate--;
                console.log(`✅ Updated ${apiTx.withdrawId}: DB=₹${dbAmount} → API=₹${apiAmount} (${remainingToUpdate} remaining)`);
              } else {
                stats.errors++;
                console.log(`❌ Failed to update ${apiTx.withdrawId}`);
              }
            } else if (dbAmount > 0 && apiAmount === 0) {
              console.log(`⚠️ Skipping ${apiTx.withdrawId}: DB has amount ₹${dbAmount} but API shows ₹0 - keeping DB value`);
            } else if (dbAmount > 0 && apiAmount > 0) {
              console.log(`ℹ️ Both have amounts ${apiTx.withdrawId}: DB=₹${dbAmount}, API=₹${apiAmount} - no update needed`);
            } else {
              console.log(`⚠️ Both missing amounts ${apiTx.withdrawId}: DB=₹${dbAmount}, API=₹${apiAmount} - cannot update`);
            }
          }
        }

        console.log(`📊 Processed page ${currentPage}: ${apiTransactions.length} records | Updates: ${stats.updated}/${stats.missingAmounts}`);
        
        // Check if we should continue
        if (apiTransactions.length < pageSize) {
          console.log(`📄 Reached end of API data (page ${currentPage} had ${apiTransactions.length} records)`);
          hasMorePages = false;
        } else if (remainingToUpdate === 0) {
          console.log(`✅ All missing amounts have been updated!`);
          hasMorePages = false;
        } else {
          currentPage++;
          
          // Add delay between pages to avoid rate limiting
          const delayTime = Math.floor(Math.random() * 10000) + 15000; // 15-25 seconds
          console.log(`⏳ Waiting ${Math.round(delayTime/1000)}s before next page... (${remainingToUpdate} transactions still need updates)`);
          await this.delay(delayTime);
        }
      }

      // Calculate not found transactions
      stats.notFound = stats.missingAmounts - stats.updated;

      // Print summary
      console.log(`\n📊 Summary for ${account.toUpperCase()}`);
      console.log('═'.repeat(50));
      console.log(`Total API records checked: ${stats.totalChecked}`);
      console.log(`DB transactions missing amounts: ${stats.missingAmounts}`);
      console.log(`Successfully updated: ${stats.updated}`);
      console.log(`Not found in API: ${stats.notFound}`);
      console.log(`Errors: ${stats.errors}`);
      console.log('═'.repeat(50));

    } catch (error) {
      console.error(`❌ Error updating amounts for ${account}:`, error);
    }
  }

  async updateAllAccounts(): Promise<void> {
    const startTime = new Date();
    console.log(`🚀 Starting Transaction Amount Update Script`);
    console.log(`⏰ Started at: ${startTime.toLocaleString()}`);
    console.log('═'.repeat(60));

    try {
      await this.connect();

      // Update DOA6PS account
      await this.updateAmountsForAccount('doa6ps');
      
      // Wait before processing next account
      const accountDelayTime = Math.floor(Math.random() * 10000) + 20000; // 20-30 seconds
      console.log(`\n⏳ Waiting ${Math.round(accountDelayTime/1000)}s before processing next account...`);
      await this.delay(accountDelayTime);
      
      // Update FWXEQK account
      await this.updateAmountsForAccount('fwxeqk');

      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();
      
      console.log(`\n🎉 Script completed successfully!`);
      console.log(`⏰ Total time: ${Math.round(duration / 1000)} seconds`);
      console.log(`📅 Finished at: ${endTime.toLocaleString()}`);

    } catch (error) {
      console.error('❌ Script failed:', error);
    } finally {
      await this.disconnect();
    }
  }
}

// CLI execution
async function main() {
  const updater = new TransactionAmountUpdater();
  
  // Handle process termination gracefully
  process.on('SIGINT', async () => {
    console.log('\n🛑 Received interrupt signal, closing connections...');
    await updater.disconnect();
    process.exit(0);
  });

  try {
    await updater.updateAllAccounts();
  } catch (error) {
    console.error('❌ Main execution failed:', error);
    await updater.disconnect();
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main();
}

export default TransactionAmountUpdater;
