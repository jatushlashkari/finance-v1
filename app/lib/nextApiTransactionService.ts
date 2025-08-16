import { Transaction } from '../types/transaction';

interface PaginatedResult {
  transactions: Transaction[];
  total: number;
  totalPages: number;
  currentPage: number;
  hasMore: boolean;
}

interface TransactionStats {
  total: number;
  succeeded: number;
  processing: number;
  failed: number;
}

class NextApiTransactionService {
  private baseURL: string;

  constructor() {
    // For Next.js, API routes are served from the same origin
    this.baseURL = '/api';
  }

  async fetchTransactionsPaginated(
    account: 'doa6ps' | 'fwxeqk',
    page: number = 1,
    pageSize: number = 15
  ): Promise<PaginatedResult> {
    try {
      const response = await fetch(
        `${this.baseURL}/transactions/${account}?page=${page}&size=${pageSize}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error fetching transactions for ${account}:`, error);
      throw new Error('Failed to fetch transactions from API');
    }
  }

  async getAllTransactions(account: 'doa6ps' | 'fwxeqk'): Promise<Transaction[]> {
    try {
      // For export, we'll fetch all pages
      let allTransactions: Transaction[] = [];
      let currentPage = 1;
      let hasMore = true;

      while (hasMore) {
        const result = await this.fetchTransactionsPaginated(account, currentPage, 100);
        allTransactions = [...allTransactions, ...result.transactions];
        hasMore = result.hasMore;
        currentPage++;
      }

      return allTransactions;
    } catch (error) {
      console.error(`Error fetching all transactions for ${account}:`, error);
      throw new Error('Failed to fetch all transactions');
    }
  }

  async getTransactionStats(account: 'doa6ps' | 'fwxeqk'): Promise<TransactionStats> {
    try {
      const response = await fetch(`${this.baseURL}/stats/${account}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error fetching stats for ${account}:`, error);
      throw new Error('Failed to fetch statistics');
    }
  }

  async checkHealth(): Promise<{ status: string; timestamp: string; database: string }> {
    try {
      const response = await fetch(`${this.baseURL}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error checking API health:', error);
      throw new Error('API server is not available');
    }
  }
}

export default NextApiTransactionService;
