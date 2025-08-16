import axios from 'axios';
import { 
  Transaction, 
  ApiResponse, 
  ProducerApiPayload, 
  WithdrawApiPayload, 
  RawTransaction,
  TransactionStatus
} from '@/types/transaction';

// Configuration for different demo accounts
export const API_CONFIGS = {
  doa6ps: {
    code: "doa6ps",
    channel: "slm_1900304",
    aid: "e132ca14-8368-4f4f-8178-e1ce23bfbb7d",
    token: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJzdWIiOiIxMTIwOTQ2MTg3NyIsImlhdCI6MTc1NDQxNjI3OSwiZXhwIjoxNTY5Mzk2MDE2Mjc5fQ.KQW6l2JRpm4IivmfiD2mSd68KRjUsWvTU1UTo5nZ_32EOcHeC-ixHG-yaDRujq8ubEBlwhYc4O4P7WJzdkFV7g",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
    pkg: "",
    gaid: null as string | null,
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

// Base URLs
const PRODUCER_API_URL = "https://report.taurus.cash/reportclient/producerController/send";
const WITHDRAW_API_URL = "https://landscape-api.taurus.cash/awclient/landscape/withdraw/withdrawDetail";

class TransactionService {
  private config: typeof API_CONFIGS.doa6ps | typeof API_CONFIGS.fwxeqk;

  constructor(configKey: keyof typeof API_CONFIGS = 'doa6ps') {
    this.config = API_CONFIGS[configKey];
  }

  /**
   * Call the producer API before making withdrawal requests
   */
  async callProducerApi(): Promise<boolean> {
    const currentTs = Date.now();
    
    const payload: ProducerApiPayload = {
      code: this.config.code,
      ts: currentTs,
      cts: "",
      pkg: this.config.pkg || "",
      channel: this.config.channel,
      pn: "hy",
      ip: "",
      platform: "vungo",
      aid: this.config.aid,
      gaid: this.config.gaid || null,
      taurus_stat_uuid: null,
      uid: this.config.uid || "",
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
      "user-agent": this.config.userAgent
    };

    try {
      const response = await axios.post(PRODUCER_API_URL, payload, { headers });
      console.log(`Producer API called successfully. Status: ${response.status}`);
      return true;
    } catch (error) {
      console.error('Error calling producer API:', error);
      return false;
    }
  }

  /**
   * Fetch withdrawal data for a specific page
   */
  async fetchWithdrawData(page: number, size: number = 15): Promise<{
    transactions: Transaction[];
    total: number;
    pages: number;
    currentPage: number;
  }> {
    // Call producer API before fetching withdrawal data
    await this.callProducerApi();
    
    // Add delay to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    const payload: WithdrawApiPayload = { page, size };

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
      "token": this.config.token,
      "Referer": "https://h5-share.agent61.com/",
      "user-agent": this.config.userAgent
    };

    try {
      const response = await axios.post<ApiResponse<RawTransaction>>(
        WITHDRAW_API_URL, 
        payload, 
        { headers }
      );

      if (response.data.code === 0 && response.data.data?.records) {
        const processedTransactions = this.processTransactions(response.data.data.records);
        return {
          transactions: processedTransactions,
          total: response.data.data.total || 0,
          pages: response.data.data.pages || 1,
          currentPage: response.data.data.page || page
        };
      }

      throw new Error(`API returned error code: ${response.data.code}`);
    } catch (error) {
      console.error(`Error fetching withdrawal data for page ${page}:`, error);
      throw error;
    }
  }

  /**
   * Process raw transaction data into our Transaction format
   */
  private processTransactions(rawTransactions: RawTransaction[]): Transaction[] {
    return rawTransactions.map((record, index) => {
      let withdrawRequest: Record<string, unknown> = {};
      
      if (record.withdrawRequest) {
        try {
          withdrawRequest = JSON.parse(record.withdrawRequest);
        } catch (error) {
          console.warn(`Could not parse withdrawRequest for record: ${record.withdrawId}`);
        }
      }

      // Map status codes to descriptions
      const statusMapping: Record<number, TransactionStatus> = {
        2: "Processing",
        4: "Succeeded"
      };

      const status = statusMapping[record.status] || "Failed";

      return {
        id: record.withdrawId || `transaction-${index}`,
        date: record.created || '',
        successDate: record.modified || undefined,
        amount: record.amount || 0,
        withdrawId: record.withdrawId || '',
        utr: record.utr || undefined,
        accountNumber: (withdrawRequest.bankAccountNumber as string) || undefined,
        accountHolderName: (withdrawRequest.bankAccountHolderName as string) || undefined,
        ifscCode: (withdrawRequest.bankAccountIfscCode as string) || undefined,
        status
      };
    });
  }

  /**
   * Fetch transactions with built-in pagination support
   */
  async fetchTransactionsPaginated(page: number, pageSize: number = 15): Promise<{
    transactions: Transaction[];
    hasMore: boolean;
    totalPages: number;
    total: number;
  }> {
    try {
      const result = await this.fetchWithdrawData(page, pageSize);
      
      // Use actual API response data for pagination
      const hasMore = result.currentPage < result.pages;

      return {
        transactions: result.transactions,
        hasMore,
        totalPages: result.pages,
        total: result.total
      };
    } catch (error) {
      console.error('Error in fetchTransactionsPaginated:', error);
      return {
        transactions: [],
        hasMore: false,
        totalPages: 1,
        total: 0
      };
    }
  }
}

export default TransactionService;
