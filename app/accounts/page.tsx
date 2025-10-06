'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { 
  User, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Eye,
  ArrowLeft,
  Search,
  Bookmark,
  BookmarkCheck,
  X,
  Calendar,
  DollarSign,
  Hash,
  Receipt,
  Download
} from 'lucide-react';
import Link from 'next/link';
import TransactionInvoice from '../components/TransactionInvoice';
import AccountStatementPDF from '../components/AccountStatementPDF';
import { useAuth } from '../contexts/AuthContext';
import LoginPage from '../components/LoginPage';

interface AccountStats {
  accountHolderName: string;
  accountNumber: string;
  totalTransactions: number;
  successTransactions: number;
  failedTransactions: number;
  processingTransactions: number;
  totalAmount: number;
  lastTransactionDate: string;
  isBookmarked: boolean;
}

interface Transaction {
  id: string;
  date: string;
  successDate?: string;
  amount: number;
  withdrawId: string;
  utr?: string;
  accountNumber?: string;
  accountHolderName?: string;
  ifscCode?: string;
  status: 'Succeeded' | 'Failed' | 'Processing';
  source?: string;
}

const AccountsPage: React.FC = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [accounts, setAccounts] = useState<AccountStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState<AccountStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [bookmarking, setBookmarking] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [transactionsPage, setTransactionsPage] = useState(1);
  const [transactionsTotal, setTransactionsTotal] = useState(0);
  const [hasMoreTransactions, setHasMoreTransactions] = useState(false);
  const [selectedTransactionForPrint, setSelectedTransactionForPrint] = useState<Transaction | null>(null);
  const [showStatementModal, setShowStatementModal] = useState(false);
  const [statementTransactions, setStatementTransactions] = useState<Transaction[]>([]);
  const [loadingStatement, setLoadingStatement] = useState(false);

  const fetchBookmarkedAccounts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/accounts/bookmarked');
      if (response.ok) {
        const data = await response.json();
        setAccounts(data.accounts || []);
      }
    } catch (error) {
      console.error('Failed to fetch bookmarked accounts:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAccountTransactions = useCallback(async (accountNumber: string, page: number = 1) => {
    try {
      setTransactionsLoading(true);
      const response = await fetch(`/api/transactions/account/${encodeURIComponent(accountNumber)}?page=${page}&size=10`);
      if (response.ok) {
        const data = await response.json();
        if (page === 1) {
          setTransactions(data.transactions || []);
        } else {
          setTransactions(prev => [...prev, ...(data.transactions || [])]);
        }
        setTransactionsTotal(data.total || 0);
        setHasMoreTransactions(data.hasMore || false);
        setTransactionsPage(page);
      }
    } catch (error) {
      console.error('Failed to fetch account transactions:', error);
    } finally {
      setTransactionsLoading(false);
    }
  }, []);

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setIsSearchMode(false);
      fetchBookmarkedAccounts();
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/accounts/search?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        setAccounts(data.accounts || []);
        setIsSearchMode(true);
      }
    } catch (error) {
      console.error('Failed to search accounts:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchBookmarkedAccounts]);

  // Debounce search
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchQuery.trim()) {
        handleSearch(searchQuery);
      } else {
        setIsSearchMode(false);
        // Small delay to ensure state is updated before fetch
        setTimeout(() => {
          fetchBookmarkedAccounts();
        }, 50);
      }
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [searchQuery, handleSearch, fetchBookmarkedAccounts]);

  useEffect(() => {
    fetchBookmarkedAccounts();
  }, [fetchBookmarkedAccounts]);

  const toggleBookmark = async (account: AccountStats, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent card click
    
    setBookmarking(account.accountNumber);
    
    try {
      if (account.isBookmarked) {
        // Remove bookmark
        const response = await fetch(`/api/bookmarks?accountNumber=${encodeURIComponent(account.accountNumber)}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          // Update local state
          setAccounts(prevAccounts => 
            prevAccounts.map(acc => 
              acc.accountNumber === account.accountNumber 
                ? { ...acc, isBookmarked: false }
                : acc
            )
          );
          
          // If in bookmarked view, remove the account from list
          if (!isSearchMode) {
            setAccounts(prevAccounts => 
              prevAccounts.filter(acc => acc.accountNumber !== account.accountNumber)
            );
          }
        }
      } else {
        // Add bookmark
        const response = await fetch('/api/bookmarks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            accountNumber: account.accountNumber,
            accountHolderName: account.accountHolderName
          })
        });
        
        if (response.ok) {
          // Update local state
          setAccounts(prevAccounts => 
            prevAccounts.map(acc => 
              acc.accountNumber === account.accountNumber 
                ? { ...acc, isBookmarked: true }
                : acc
            )
          );
          
          // If in search mode, we should refresh bookmarked accounts in background
          // so when user goes back to bookmarked view, the new bookmark appears
          if (isSearchMode) {
            // Silently refresh bookmarked accounts in background
            fetch('/api/accounts/bookmarked')
              .then(res => res.json())
              .catch(() => {}); // Silent fail, just for cache refresh
          }
        }
      }
    } catch (error) {
      console.error('Failed to toggle bookmark:', error);
    } finally {
      setBookmarking(null);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setIsSearchMode(false);
    // Force refresh bookmarked accounts to show any new bookmarks
    setTimeout(() => {
      fetchBookmarkedAccounts();
    }, 100);
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleAccountSelect = (account: AccountStats) => {
    setSelectedAccount(account);
    setTransactions([]);
    setTransactionsPage(1);
    fetchAccountTransactions(account.accountNumber, 1);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Succeeded':
        return 'default'; // Green
      case 'Failed':
        return 'destructive'; // Red
      case 'Processing':
        return 'secondary'; // Gray
      default:
        return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Succeeded':
        return 'text-green-600 bg-green-50';
      case 'Failed':
        return 'text-red-600 bg-red-50';
      case 'Processing':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const handleDownloadTransaction = (transaction: Transaction, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedTransactionForPrint(transaction);
  };

  const handleDownloadStatement = async () => {
    if (!selectedAccount) return;
    
    setLoadingStatement(true);
    try {
      const response = await fetch(`/api/transactions/account/${encodeURIComponent(selectedAccount.accountNumber)}/successful`);
      if (response.ok) {
        const data = await response.json();
        setStatementTransactions(data.transactions || []);
        setShowStatementModal(true);
      } else {
        alert('Failed to fetch successful transactions. Please try again.');
      }
    } catch (error) {
      console.error('Failed to fetch successful transactions:', error);
      alert('Failed to fetch successful transactions. Please try again.');
    } finally {
      setLoadingStatement(false);
    }
  };

  // Authentication check
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  if (selectedAccount) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex flex-col space-y-3 md:flex-row md:items-center md:justify-between md:space-y-0 mb-4 md:mb-6">
            <div className="flex items-center space-x-3 md:space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedAccount(null)}
                className="flex items-center space-x-2 text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back to Accounts</span>
                <span className="sm:hidden">Back</span>
              </Button>
              <h1 className="text-lg md:text-2xl font-bold text-gray-900">Account Details</h1>
            </div>
            <Button
              onClick={handleDownloadStatement}
              disabled={loadingStatement || selectedAccount.successTransactions === 0}
              className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white text-sm"
            >
              {loadingStatement ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span className="hidden sm:inline">Loading...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Download Statement</span>
                  <span className="sm:inline md:hidden">Statement</span>
                </>
              )}
            </Button>
          </div>

          {/* Account Details Card */}
          <Card className="mb-4 md:mb-6">
            <CardHeader className="pb-3 md:pb-6">
              <CardTitle className="flex items-center space-x-3">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg md:text-xl font-bold truncate">{selectedAccount.accountHolderName}</h2>
                  <p className="text-sm md:text-base text-gray-600 font-mono truncate">{selectedAccount.accountNumber}</p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                <div className="text-center">
                  <div className="text-xl md:text-2xl font-bold text-green-600">
                    {selectedAccount.successTransactions}
                  </div>
                  <div className="text-xs md:text-sm text-gray-600">Success</div>
                </div>
                <div className="text-center">
                  <div className="text-xl md:text-2xl font-bold text-red-600">
                    {selectedAccount.failedTransactions}
                  </div>
                  <div className="text-xs md:text-sm text-gray-600">Failed</div>
                </div>
                <div className="text-center">
                  <div className="text-xl md:text-2xl font-bold text-yellow-600">
                    {selectedAccount.processingTransactions}
                  </div>
                  <div className="text-xs md:text-sm text-gray-600">Processing</div>
                </div>
                <div className="text-center">
                  <div className="text-xl md:text-2xl font-bold text-blue-600">
                    {formatAmount(selectedAccount.totalAmount)}
                  </div>
                  <div className="text-xs md:text-sm text-gray-600">Total Amount</div>
                </div>
              </div>

              <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-gray-200">
                <div className="text-center md:text-left">
                  <p className="text-xs md:text-sm text-gray-600">Last Transaction</p>
                  <p className="text-base md:text-lg font-semibold">
                    {new Date(selectedAccount.lastTransactionDate).toLocaleDateString('en-IN')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transactions Table */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5" />
                  <span>Transaction History</span>
                </div>
                <span className="text-sm font-normal text-gray-500">
                  ({transactionsTotal} total)
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6">
              {transactionsLoading && transactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
                  <span className="text-gray-600 text-center">Loading transactions...</span>
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Calendar className="w-16 h-16 mx-auto mb-6 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Transactions Found</h3>
                  <p className="text-gray-500">This account doesn&apos;t have any transactions yet.</p>
                </div>
              ) : (
                <>
                  {/* Mobile Card View (visible on screens smaller than md) */}
                  <div className="block md:hidden space-y-3 transactions-container">
                    {transactions.map((transaction, index) => (
                      <div 
                        key={transaction.id} 
                        className="transaction-card mobile-transaction-item bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-lg hover:border-gray-300 transition-all duration-200"
                        style={{ 
                          animationDelay: `${index * 50}ms`,
                          animation: 'fadeInUp 0.3s ease-out forwards'
                        }}
                      >
                        {/* Header Row: Amount and Status */}
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center space-x-2">
                            <DollarSign className="w-5 h-5 text-green-600" />
                            <span className="text-lg font-bold text-gray-900">
                              {formatAmount(transaction.amount)}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => handleDownloadTransaction(transaction, e)}
                              className="h-9 w-9 p-0 hover:bg-gray-100"
                              title="Download Invoice"
                            >
                              <Download className="w-5 h-5 text-gray-600" />
                            </Button>
                            <Badge 
                              variant={getStatusBadgeVariant(transaction.status)}
                              className={`${getStatusColor(transaction.status)} border-none font-medium`}
                            >
                              {transaction.status}
                            </Badge>
                          </div>
                        </div>

                        {/* Date and Time */}
                        <div className="flex items-center space-x-2 mb-3">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-900">
                              {new Date(transaction.date).toLocaleDateString('en-IN', { 
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(transaction.date).toLocaleTimeString('en-IN', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        </div>

                        {/* Transaction Details */}
                        <div className="space-y-3 pt-3 border-t border-gray-100">
                          {transaction.withdrawId && (
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <Hash className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-600">Withdraw ID:</span>
                              </div>
                              <span className="text-sm font-mono text-gray-900 bg-gray-50 px-3 py-1 rounded-lg">
                                {transaction.withdrawId}
                              </span>
                            </div>
                          )}
                          
                          {transaction.utr && (
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <Receipt className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-600">UTR:</span>
                              </div>
                              <span className="text-sm font-mono text-gray-900 bg-gray-50 px-3 py-1 rounded-lg">
                                {transaction.utr}
                              </span>
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div className="w-4 h-4 flex items-center justify-center">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              </div>
                              <span className="text-sm text-gray-600">Source:</span>
                            </div>
                            <Badge variant="outline" className="text-xs font-medium">
                              {transaction.source?.toUpperCase() || 'Unknown'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop Table View (visible on md screens and larger) */}
                  <div className="hidden md:block overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Withdraw ID</TableHead>
                          <TableHead>UTR</TableHead>
                          <TableHead>Source</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions.map((transaction) => (
                          <TableRow key={transaction.id}>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {new Date(transaction.date).toLocaleDateString('en-IN')}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {new Date(transaction.date).toLocaleTimeString('en-IN')}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-1">
                                <DollarSign className="w-4 h-4 text-green-600" />
                                <span className="font-semibold">
                                  {formatAmount(transaction.amount)}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={getStatusBadgeVariant(transaction.status)}
                                className={`${getStatusColor(transaction.status)} border-none font-medium`}
                              >
                                {transaction.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className="font-mono text-sm">
                                {transaction.withdrawId || '-'}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="font-mono text-sm">
                                {transaction.utr || '-'}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {transaction.source?.toUpperCase() || 'Unknown'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => handleDownloadTransaction(transaction, e)}
                                className="h-10 w-10 p-0 hover:bg-gray-100"
                                title="Download Invoice"
                              >
                                <Download className="w-5 h-5 text-gray-600" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Load More Button */}
                  {hasMoreTransactions && (
                    <div className="mt-6 px-3 sm:px-0">
                      <Button
                        variant="outline"
                        onClick={() => fetchAccountTransactions(selectedAccount.accountNumber, transactionsPage + 1)}
                        disabled={transactionsLoading}
                        className="w-full py-3 text-sm font-medium border-2 hover:bg-gray-50 transition-colors"
                      >
                        {transactionsLoading ? (
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                            Loading More Transactions...
                          </div>
                        ) : (
                          <div className="flex items-center justify-center space-x-2">
                            <span>Load More Transactions</span>
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                              +{Math.min(10, transactionsTotal - transactions.length)}
                            </span>
                          </div>
                        )}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Transaction Invoice Modal */}
        {selectedTransactionForPrint && (
          <TransactionInvoice
            transaction={selectedTransactionForPrint}
            account={selectedAccount}
            onClose={() => setSelectedTransactionForPrint(null)}
          />
        )}
        
        {/* Account Statement Modal */}
        {showStatementModal && statementTransactions.length > 0 && (
          <AccountStatementPDF
            transactions={statementTransactions}
            account={selectedAccount}
            onClose={() => setShowStatementModal(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col space-y-4 mb-4 md:mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl md:text-3xl font-bold text-gray-900">Account Overview</h1>
              <p className="text-sm md:text-base text-gray-600 mt-1">
                {isSearchMode 
                  ? `Search results for "${searchQuery}"` 
                  : "Bookmarked accounts with transaction summaries"
                }
              </p>
            </div>
            <Link href="/dashboard">
              <Button variant="outline" className="flex items-center space-x-2 text-sm">
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back to Dashboard</span>
                <span className="sm:hidden">Back</span>
              </Button>
            </Link>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-lg">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by account name or number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`pl-10 pr-12 transition-all duration-200 ${
                  isSearchMode 
                    ? 'ring-2 ring-blue-500 border-blue-500' 
                    : 'focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                }`}
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSearch}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100"
                  title="Clear search"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
              {loading && searchQuery && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                </div>
              )}
            </div>
            {isSearchMode && accounts.length > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                Found {accounts.length} account{accounts.length !== 1 ? 's' : ''} matching &quot;{searchQuery}&quot;
              </p>
            )}
          </div>

          {isSearchMode && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>Showing search results</span>
              <Button variant="link" onClick={clearSearch} className="p-0 h-auto text-blue-600">
                View bookmarked accounts
              </Button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <Card key={index} className="animate-pulse">
                <CardContent className="p-4 pt-5 md:p-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 md:w-10 md:h-10 bg-gray-300 rounded-full"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 mt-4">
                      <div className="text-center space-y-1">
                        <div className="h-4 bg-gray-300 rounded w-8 mx-auto"></div>
                        <div className="h-3 bg-gray-300 rounded w-12 mx-auto"></div>
                      </div>
                      <div className="text-center space-y-1">
                        <div className="h-4 bg-gray-300 rounded w-8 mx-auto"></div>
                        <div className="h-3 bg-gray-300 rounded w-12 mx-auto"></div>
                      </div>
                      <div className="text-center space-y-1">
                        <div className="h-4 bg-gray-300 rounded w-8 mx-auto"></div>
                        <div className="h-3 bg-gray-300 rounded w-16 mx-auto"></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : accounts.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                {isSearchMode ? <Search className="w-8 h-8 text-gray-400" /> : <Bookmark className="w-8 h-8 text-gray-400" />}
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {isSearchMode ? 'No Search Results' : 'No Bookmarked Accounts'}
              </h3>
              <p className="text-gray-600 mb-4">
                {isSearchMode 
                  ? `No accounts found matching "${searchQuery}". Try a different search term.`
                  : 'No bookmarked accounts yet. Search for accounts and bookmark them to see them here.'
                }
              </p>
              {isSearchMode ? (
                <div className="space-y-2">
                  <Button 
                    onClick={clearSearch}
                    variant="outline"
                    className="mr-2"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Bookmarks
                  </Button>
                  <p className="text-sm text-gray-500">
                    Try searching with account holder name or account number
                  </p>
                </div>
              ) : (
                <Button 
                  onClick={() => {
                    const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
                    searchInput?.focus();
                  }} 
                  className="mt-2"
                  variant="outline"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Search Accounts
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {accounts.map((account, index) => (
              <Card 
                key={`${account.accountNumber}-${index}`} 
                className={`hover:shadow-md transition-shadow cursor-pointer ${
                  account.isBookmarked 
                    ? 'border-blue-200 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleAccountSelect(account)}
              >
                <CardContent className="p-4">
                  {/* Bookmark Badge */}
                  {account.isBookmarked && (
                    <div className="mb-3">
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                        <BookmarkCheck className="w-4 h-4 mr-1" />
                        Bookmarked
                      </span>
                    </div>
                  )}
                  
                  {/* Account Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-semibold text-gray-900 truncate mb-1">
                          {account.accountHolderName}
                        </h3>
                        <p className="text-xs text-gray-500 font-mono truncate">
                          {account.accountNumber}
                        </p>
                      </div>
                    </div>
                    
                    {/* Bookmark Toggle Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => toggleBookmark(account, e)}
                      disabled={bookmarking === account.accountNumber}
                      className="h-9 w-9 p-0"
                      title={account.isBookmarked ? 'Remove from bookmarks' : 'Add to bookmarks'}
                    >
                      {bookmarking === account.accountNumber ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
                      ) : account.isBookmarked ? (
                        <BookmarkCheck className="w-5 h-5 text-blue-600" />
                      ) : (
                        <Bookmark className="w-5 h-5 text-gray-400" />
                      )}
                    </Button>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-1 mb-1">
                        <CheckCircle className="w-3 h-3 text-green-600" />
                        <span className="text-sm font-semibold text-green-700">
                          {account.successTransactions}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">Success</p>
                    </div>
                    
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-1 mb-1">
                        <AlertCircle className="w-3 h-3 text-red-600" />
                        <span className="text-sm font-semibold text-red-700">
                          {account.failedTransactions}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">Failed</p>
                    </div>
                    
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-1 mb-1">
                        <Clock className="w-3 h-3 text-yellow-600" />
                        <span className="text-sm font-semibold text-yellow-700">
                          {account.processingTransactions}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">Processing</p>
                    </div>
                  </div>

                  {/* Success Amount */}
                  <div className="border-t pt-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Success Amount</p>
                        <p className="text-lg font-bold text-gray-900">
                          {formatAmount(account.totalAmount)}
                        </p>
                      </div>
                      <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4 mr-1" />
                        View Details
                      </Button>
                    </div>
                  </div>

                  {/* Last Transaction */}
                  <div className="flex items-center justify-between pt-3 border-t mt-3">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-gray-400" />
                      <p className="text-xs text-gray-600">
                        Last: {new Date(account.lastTransactionDate).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                    <div className="text-xs text-gray-500">
                      {account.totalTransactions} total
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountsPage;
