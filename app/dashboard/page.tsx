'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '../components/ui/pagination';
import { 
  RefreshCw, 
  AlertCircle, 
  CheckCircle, 
  FileSpreadsheet,
  Calendar,
  Hash,
  User,
  CreditCard,
  Building,
  LogOut,
  ChevronDown,
  Download,
  Receipt
} from 'lucide-react';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import Link from 'next/link';
import NextApiTransactionService from '../lib/nextApiTransactionService';
import { Transaction, TransactionStatus } from '../types/transaction';
import { useAuth } from '../contexts/AuthContext';
import SyncStatusIndicator from '../components/SyncStatusIndicator';
import TransactionFilters from '../components/TransactionFilters';
import AccountSummaryCard from '../components/AccountSummaryCard';
import LoginPage from '../components/LoginPage';

// Account configurations for UI display
const ACCOUNTS = {
  all: { name: 'All Accounts', icon: '🌐' },
  doa6ps: { name: 'DOA6PS', icon: '🏢' },
  fwxeqk: { name: 'FWXEQK', icon: '📱' }
} as const;

const TransactionDashboard: React.FC = () => {
  const { logout, isAuthenticated, loading: authLoading } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedAccount, setSelectedAccount] = useState<keyof typeof ACCOUNTS>('all');
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [filters, setFilters] = useState({
    accountNumber: '',
    status: 'all',
    startDate: '',
    endDate: ''
  });
  
  // Page size state
  const [pageSize, setPageSize] = useState(15);
  
  // Page size options
  const pageSizeOptions = [15, 50, 100, 200, 500, 1000, 5000];

  // Summary state (for account number filter)
  const [summaryData, setSummaryData] = useState<{
    accountNumber: string;
    totalAmount: number;
    totalTransactions: number;
    status: string;
    account: string;
  } | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Account summary state (for selected account totals)
  const [accountSummary, setAccountSummary] = useState<{
    totalAmount: number;
    totalTransactions: number;
    succeededTransactions: number;
    failedTransactions: number;
    account: string;
  } | null>(null);
  const [accountSummaryLoading, setAccountSummaryLoading] = useState(false);

  // Load transactions for current page
  const loadTransactions = async (page: number = 1, applyFilters: boolean = false) => {
    if (loading) return; // Prevent multiple simultaneous requests
    
    setLoading(true);
    setError(null);
    
    try {
      const service = new NextApiTransactionService();
      
      // Prepare filter object - only include non-empty filters
      const filterParams = applyFilters ? {
        accountNumber: filters.accountNumber || undefined,
        status: filters.status !== 'all' ? filters.status : undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined
      } : undefined;
      
      const result = await service.fetchTransactionsPaginated(
        selectedAccount, 
        page, 
        pageSize, 
        filterParams
      );
      
      // Always update state for successful requests
      setTransactions(result.transactions);
      setTotalPages(result.totalPages);
      setTotal(result.total);
      setCurrentPage(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load transactions');
      console.error('Error loading transactions:', err);
    } finally {
      // Always set loading to false when request completes
      setLoading(false);
    }
  };

  // Load account summary data (total amount for selected account)
  const loadAccountSummary = useCallback(async () => {
    if (selectedAccount === 'all') {
      setAccountSummary(null);
      return;
    }

    setAccountSummaryLoading(true);
    try {
      // Get actual account totals from the new API endpoint
      const totalResponse = await fetch(`/api/account-total/${selectedAccount}`);
      if (!totalResponse.ok) {
        throw new Error('Failed to fetch account totals');
      }
      const totals = await totalResponse.json();

      setAccountSummary({
        totalAmount: totals.totalAmount,
        totalTransactions: totals.totalTransactions,
        succeededTransactions: totals.succeededTransactions,
        failedTransactions: totals.failedTransactions,
        account: selectedAccount
      });
    } catch (error) {
      console.error('Error loading account summary:', error);
      setAccountSummary(null);
    } finally {
      setAccountSummaryLoading(false);
    }
  }, [selectedAccount]);

  // Load initial data
  useEffect(() => {
    let mounted = true;
    const abortController = new AbortController();
    
    const fetchData = async () => {
      if (!mounted) return;
      
      setLoading(true);
      setError(null);
      
      // Clear filters when switching accounts
      setFilters({
        accountNumber: '',
        status: 'all',
        startDate: '',
        endDate: ''
      });
      
      try {
        const service = new NextApiTransactionService();
        const result = await service.fetchTransactionsPaginated(selectedAccount, 1, pageSize);
        
        // Check if component is still mounted and request wasn't aborted
        if (mounted && !abortController.signal.aborted) {
          setTransactions(result.transactions);
          setTotalPages(result.totalPages);
          setTotal(result.total);
          setCurrentPage(1);
          
          // Load account summary after transactions are loaded
          if (selectedAccount !== 'all') {
            setTimeout(() => loadAccountSummary(), 100);
          } else {
            setAccountSummary(null);
          }
        }
      } catch (err) {
        // Only show error if component is still mounted and request wasn't aborted
        if (mounted && !abortController.signal.aborted) {
          setError(err instanceof Error ? err.message : 'Failed to load transactions');
          console.error('Error loading transactions:', err);
        }
      } finally {
        // Only set loading to false if component is still mounted
        if (mounted && !abortController.signal.aborted) {
          setLoading(false);
        }
      }
    };
    
    // Small delay to prevent rapid successive calls
    const timeoutId = setTimeout(fetchData, 100);
    
    return () => {
      mounted = false;
      abortController.abort();
      clearTimeout(timeoutId);
    };
  }, [selectedAccount, pageSize, loadAccountSummary]);

  // Handle page navigation
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      loadTransactions(page, true); // Apply filters when navigating pages
    }
  };

  // Filter handlers
  const handleFiltersChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
  };

  const handleApplyFilters = () => {
    setCurrentPage(1); // Reset to first page when applying filters
    loadTransactions(1, true);
    loadSummaryData(); // Load summary data when filters are applied
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      accountNumber: '',
      status: 'all',
      startDate: '',
      endDate: ''
    };
    setFilters(clearedFilters);
    setCurrentPage(1);
    loadTransactions(1, false); // Load without filters
    setSummaryData(null); // Clear summary data when filters are cleared
  };

  // Handle page size change
  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  // Load summary data when account number filter is applied
  const loadSummaryData = async () => {
    if (!filters.accountNumber) {
      setSummaryData(null);
      return;
    }

    setSummaryLoading(true);
    try {
      const service = new NextApiTransactionService();
      const summary = await service.getTransactionSummary(
        selectedAccount,
        filters.accountNumber,
        {
          status: filters.status !== 'all' ? filters.status : 'Succeeded',
          startDate: filters.startDate || undefined,
          endDate: filters.endDate || undefined
        }
      );
      setSummaryData(summary);
    } catch (error) {
      console.error('Error loading summary data:', error);
      setSummaryData(null);
    } finally {
      setSummaryLoading(false);
    }
  };

  // Get status badge variant
  const getStatusVariant = (status: TransactionStatus) => {
    switch (status) {
      case 'Succeeded':
        return 'default';
      case 'Failed':
        return 'destructive';
      case 'Processing':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  // Get status icon
  const getStatusIcon = (status: TransactionStatus) => {
    switch (status) {
      case 'Succeeded':
        return <CheckCircle className="h-4 w-4" />;
      case 'Failed':
        return <AlertCircle className="h-4 w-4" />;
      case 'Processing':
        return <RefreshCw className="h-4 w-4" />;
      default:
        return null;
    }
  };

  // Format date - consistent format for both date and success date
  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  // Format date for Excel export - YYYY-MM-DD HH:MM:SS format
  const formatDateForExcel = (dateString: string) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    } catch {
      return dateString;
    }
  };

  // Copy text to clipboard on double-click
  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      console.log(`Copied ${fieldName}: ${text}`);
    } catch (err) {
      console.error('Failed to copy text: ', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        console.log(`Copied ${fieldName}: ${text}`);
      } catch (fallbackErr) {
        console.error('Fallback copy failed: ', fallbackErr);
      }
      document.body.removeChild(textArea);
    }
  };

  // Export to Excel using ExcelJS (secure alternative)
  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Transactions');

    // Define columns - conditionally include Account column when showing all accounts
    const baseColumns = [
      { header: 'S.No', key: 'sno', width: 8 },
      { header: 'Date', key: 'date', width: 20 }
    ];

    const accountColumn = { header: 'Account', key: 'account', width: 15 };

    const remainingColumns = [
      { header: 'Withdraw ID', key: 'withdrawId', width: 15 },
      { header: 'Account Holder', key: 'accountHolder', width: 25 },
      { header: 'Account Number', key: 'accountNumber', width: 20 },
      { header: 'IFSC Code', key: 'ifscCode', width: 15 },
      { header: 'UTR', key: 'utr', width: 20 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Success Date', key: 'successDate', width: 20 }
    ];

    // Combine columns based on whether we're showing all accounts
    worksheet.columns = selectedAccount === 'all' 
      ? [...baseColumns, accountColumn, ...remainingColumns]
      : [...baseColumns, ...remainingColumns];

    // Add data rows
    transactions.forEach((transaction, index) => {
      const baseRowData = {
        sno: index + 1,
        date: formatDateForExcel(transaction.date)
      };

      const accountData = selectedAccount === 'all' ? {
        account: ACCOUNTS[transaction.source as keyof typeof ACCOUNTS]?.name || transaction.source?.toUpperCase() || 'Unknown'
      } : {};

      const remainingRowData = {
        withdrawId: transaction.withdrawId,
        accountHolder: transaction.accountHolderName || '-',
        accountNumber: transaction.accountNumber || '-',
        ifscCode: transaction.ifscCode || '-',
        utr: transaction.utr || '-',
        status: transaction.status,
        successDate: transaction.successDate ? formatDateForExcel(transaction.successDate) : '-'
      };

      worksheet.addRow({
        ...baseRowData,
        ...accountData,
        ...remainingRowData
      });
    });

    // Style the header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E6FF' }
    };

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const filename = `transactions_${selectedAccount}_page_${currentPage}_${timestamp}.xlsx`;

    // Generate buffer and save file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, filename);
  };

  // Generate page numbers for pagination
  const generatePageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 7;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 4) {
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  // Authentication loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // Authentication check - redirect to login if not authenticated
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile-First Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Mobile Header - Compact */}
          <div className="flex justify-between items-center h-14 md:h-16">
            {/* Logo & Title */}
            <div className="flex items-center space-x-2 md:space-x-4">
              <div className="flex items-center space-x-2 md:space-x-3">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-gray-900 rounded-lg md:rounded-xl flex items-center justify-center">
                  <FileSpreadsheet className="w-4 h-4 md:w-6 md:h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-lg md:text-xl font-semibold text-gray-900">Finance</h1>
                  <p className="text-xs text-gray-500 hidden sm:block">Transaction Management</p>
                </div>
              </div>
            </div>

            {/* Mobile Actions - Icon Only */}
            <div className="flex items-center space-x-1 md:space-x-3">
              {/* Mobile Export Button */}
              <Button
                onClick={exportToExcel}
                disabled={loading || transactions.length === 0}
                size="sm"
                variant="outline"
                className="md:hidden p-2"
                title="Export to Excel"
              >
                <Download className="w-4 h-4" />
              </Button>
              
              {/* Desktop Export Button */}
              <Button
                onClick={exportToExcel}
                disabled={loading || transactions.length === 0}
                size="sm"
                variant="outline"
                className="hidden md:flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </Button>

              {/* Accounts Button */}
              <Link href="/accounts">
                <Button
                  size="sm"
                  variant="outline"
                  className="p-2 md:px-3"
                  title="View Accounts"
                >
                  <User className="w-4 h-4" />
                  <span className="hidden md:inline ml-2">Accounts</span>
                </Button>
              </Link>

              {/* Desktop Sync Button */}
              <div className="hidden md:block">
                <SyncStatusIndicator />
              </div>

              {/* Refresh Button */}
              <Button
                onClick={() => loadTransactions(currentPage)}
                disabled={loading}
                size="sm"
                variant="outline"
                className="p-2 md:px-3"
                title="Refresh Data"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden md:inline ml-2">Refresh</span>
              </Button>

              {/* Logout Button */}
              <Button
                onClick={logout}
                size="sm"
                variant="ghost"
                className="p-2 md:px-3"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden md:inline ml-2">Logout</span>
              </Button>
            </div>
          </div>

          {/* Mobile Stats Bar - Below Header */}
          <div className="md:hidden border-t border-gray-100 px-4 py-2 bg-gray-50">
            <div className="flex justify-between items-center text-xs">
              <div className="flex items-center space-x-4">
                <div>
                  <span className="font-medium text-gray-900">{total.toLocaleString()}</span>
                  <span className="text-gray-500 ml-1">records</span>
                </div>
                <div>
                  <span className="font-medium text-gray-900">{currentPage}/{totalPages}</span>
                  <span className="text-gray-500 ml-1">pages</span>
                </div>
              </div>
              <SyncStatusIndicator />
            </div>
          </div>

          {/* Desktop Stats - Below Header */}
          <div className="hidden md:block bg-gray-50 border-t border-gray-100 px-4 py-2">
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center space-x-6">
                <div>
                  <span className="font-medium text-gray-900">{total.toLocaleString()}</span>
                  <span className="text-gray-500 ml-1">total records</span>
                </div>
                <div>
                  <span className="font-medium text-gray-900">{currentPage} / {totalPages}</span>
                  <span className="text-gray-500 ml-1">pages</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-gray-600 text-xs">Last synced: {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Controls Section */}
        <div className="mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Transactions</h2>
                <p className="text-sm text-gray-500 mt-1">View and manage all financial transactions</p>
              </div>
              
              {/* Account Selector */}
              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium text-gray-700">Account:</label>
                <div className="relative">
                  <select
                    value={selectedAccount}
                    onChange={(e) => setSelectedAccount(e.target.value as keyof typeof ACCOUNTS)}
                    className="bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent appearance-none"
                    disabled={loading}
                  >
                    <option value="all">All Accounts</option>
                    <option value="doa6ps">DOA6PS</option>
                    <option value="fwxeqk">FWXEQK</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Transaction Filters */}
            <TransactionFilters
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onApplyFilters={handleApplyFilters}
              onClearFilters={handleClearFilters}
              isLoading={loading}
            />

            {/* Account Summary Card (for account number filter) */}
            {(summaryData || summaryLoading) && filters.accountNumber && (
              <div className="mt-6">
                <AccountSummaryCard
                  accountNumber={filters.accountNumber}
                  totalAmount={summaryData?.totalAmount || 0}
                  totalTransactions={summaryData?.totalTransactions || 0}
                  status={summaryData?.status || 'Succeeded'}
                  _account={selectedAccount}
                  isLoading={summaryLoading}
                />
              </div>
            )}

            {/* Account Total Summary Card (for selected account) */}
            {(accountSummary || accountSummaryLoading) && selectedAccount !== 'all' && !filters.accountNumber && (
              <div className="mt-6">
                <AccountSummaryCard
                  accountNumber={`All ${ACCOUNTS[selectedAccount].name} Transactions`}
                  totalAmount={accountSummary?.totalAmount || 0}
                  totalTransactions={accountSummary?.totalTransactions || 0}
                  succeededTransactions={accountSummary?.succeededTransactions || 0}
                  failedTransactions={accountSummary?.failedTransactions || 0}
                  status="Total Summary"
                  _account={selectedAccount}
                  isLoading={accountSummaryLoading}
                />
              </div>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-8 bg-red-50 border border-red-200 rounded-xl p-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-red-900">Error Loading Transactions</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Transactions Display */}
        <div>
          {/* Mobile Card Layout */}
          <div className="md:hidden">
            {loading ? (
              <div className="p-12 text-center">
                <div className="flex flex-col items-center space-y-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <div>
                    <h3 className="text-base font-medium text-gray-900">Loading transactions...</h3>
                    <p className="text-sm text-gray-500 mt-1">Please wait while we fetch the latest data</p>
                  </div>
                </div>
              </div>
            ) : transactions.length === 0 ? (
              <div className="p-12 text-center">
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                    <FileSpreadsheet className="w-8 h-8 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">No Transactions Found</h3>
                    <p className="text-sm text-gray-500 mt-1">Try selecting a different account or refreshing the data</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 transactions-container">
                {transactions.map((transaction, index) => (
                  <div 
                    key={transaction.id} 
                    className="transaction-card mobile-transaction-item bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-lg hover:border-gray-300 transition-all duration-200"
                    style={{ 
                      animationDelay: `${index * 50}ms`,
                      animation: 'fadeInUp 0.3s ease-out forwards'
                    }}
                  >
                    {/* Date and Time with Status */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
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
                      <Badge 
                        variant={getStatusVariant(transaction.status)}
                        className="border-none font-medium"
                      >
                        {getStatusIcon(transaction.status)}
                        <span className="ml-1">{transaction.status}</span>
                      </Badge>
                    </div>

                    {/* Account Holder */}
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-gray-900 truncate">
                          {transaction.accountHolderName || 'Unknown Account'}
                        </h3>
                        <p className="text-xs text-gray-500">Account Holder</p>
                      </div>
                    </div>

                    {/* Transaction Details */}
                    <div className="space-y-3 pt-3 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <CreditCard className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">Account:</span>
                        </div>
                        <span className="text-sm font-mono text-gray-900 bg-gray-50 px-3 py-1 rounded-lg">
                          {transaction.accountNumber || 'N/A'}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Hash className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">Transaction ID:</span>
                        </div>
                        <span className="text-sm font-mono text-gray-900 bg-gray-50 px-3 py-1 rounded-lg">
                          {transaction.withdrawId}
                        </span>
                      </div>
                      
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
                      
                      {selectedAccount === 'all' && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 flex items-center justify-center">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            </div>
                            <span className="text-sm text-gray-600">Source:</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm">
                              {ACCOUNTS[transaction.source as keyof typeof ACCOUNTS]?.icon || '📄'}
                            </span>
                            <Badge variant="outline" className="text-xs font-medium">
                              {ACCOUNTS[transaction.source as keyof typeof ACCOUNTS]?.name || transaction.source?.toUpperCase() || 'Unknown'}
                            </Badge>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Clean Modern Table */}
          <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <Table className="w-full">
                <TableHeader>
                  <TableRow className="bg-gray-50 border-b border-gray-200">
                    {/* Date Column */}
                    <TableHead className="px-3 py-3 text-left text-sm font-medium text-gray-700 w-32">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span>Date & Time</span>
                      </div>
                    </TableHead>
                    
                    {/* Source Column (Conditional) */}
                    {selectedAccount === 'all' && (
                      <TableHead className="px-3 py-3 text-left text-sm font-medium text-gray-700 w-24">
                        <div className="flex items-center space-x-2">
                          <Building className="w-4 h-4 text-gray-500" />
                          <span>Source</span>
                        </div>
                      </TableHead>
                    )}
                    
                    {/* Transaction ID */}
                    <TableHead className="px-3 py-3 text-left text-sm font-medium text-gray-700 w-28">
                      <div className="flex items-center space-x-2">
                        <Hash className="w-4 h-4 text-gray-500" />
                        <span>Transaction ID</span>
                      </div>
                    </TableHead>
                    
                    {/* Account Holder */}
                    <TableHead className="px-3 py-3 text-left text-sm font-medium text-gray-700">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <span>Account Holder</span>
                      </div>
                    </TableHead>
                    
                    {/* Account Number */}
                    <TableHead className="px-3 py-3 text-left text-sm font-medium text-gray-700 w-36">
                      <div className="flex items-center space-x-2">
                        <CreditCard className="w-4 h-4 text-gray-500" />
                        <span>Account Number</span>
                      </div>
                    </TableHead>
                    
                    {/* UTR */}
                    <TableHead className="px-3 py-3 text-left text-sm font-medium text-gray-700 w-32">
                      <div className="flex items-center space-x-2">
                        <Hash className="w-4 h-4 text-gray-500" />
                        <span>UTR Reference</span>
                      </div>
                    </TableHead>
                    
                    {/* Status */}
                    <TableHead className="px-3 py-3 text-center text-sm font-medium text-gray-700 w-24">
                      <div className="flex items-center justify-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-gray-500" />
                        <span>Status</span>
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={selectedAccount === 'all' ? 7 : 6} className="text-center py-12">
                        <div className="flex flex-col items-center space-y-4">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                          <div>
                            <h3 className="text-sm font-medium text-gray-900">Loading transactions...</h3>
                            <p className="text-sm text-gray-500 mt-1">Please wait while we fetch the data</p>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : transactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={selectedAccount === 'all' ? 7 : 6} className="text-center py-12">
                        <div className="flex flex-col items-center space-y-4">
                          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                            <FileSpreadsheet className="w-6 h-6 text-gray-400" />
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-gray-900">No transactions found</h3>
                            <p className="text-sm text-gray-500 mt-1">Try selecting a different account or refreshing the data</p>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    transactions.map((transaction) => (
                      <TableRow 
                        key={transaction.id} 
                        className="hover:bg-gray-50 transition-colors"
                      >
                        {/* Date Column */}
                        <TableCell 
                          className="px-3 py-3 cursor-copy w-32" 
                          onDoubleClick={() => copyToClipboard(formatDate(transaction.date), 'Date')}
                          title="Double-click to copy date"
                        >
                          <div className="text-sm">
                            <div className="font-medium text-gray-900">
                              {new Date(transaction.date).toLocaleDateString('en-IN', { 
                                day: '2-digit', 
                                month: 'short',
                                year: 'numeric'
                              })}
                            </div>
                            <div className="text-gray-500">
                              {new Date(transaction.date).toLocaleTimeString('en-IN', { 
                                hour: '2-digit', 
                                minute: '2-digit', 
                                hour12: true 
                              })}
                            </div>
                          </div>
                        </TableCell>

                        {/* Source Column (Conditional) */}
                        {selectedAccount === 'all' && (
                          <TableCell 
                            className="px-3 py-3 cursor-copy w-24" 
                            onDoubleClick={() => copyToClipboard(ACCOUNTS[transaction.source as keyof typeof ACCOUNTS]?.name || transaction.source?.toUpperCase() || 'Unknown', 'Source')}
                            title="Double-click to copy source"
                          >
                            <div className="flex items-center space-x-2">
                              <span className="text-sm">{ACCOUNTS[transaction.source as keyof typeof ACCOUNTS]?.icon || '📄'}</span>
                              <span className="text-sm font-medium text-gray-900 truncate">
                                {ACCOUNTS[transaction.source as keyof typeof ACCOUNTS]?.name || transaction.source?.toUpperCase() || 'Unknown'}
                              </span>
                            </div>
                          </TableCell>
                        )}

                        {/* Transaction ID */}
                        <TableCell 
                          className="px-3 py-3 cursor-copy w-28" 
                          onDoubleClick={() => copyToClipboard(transaction.withdrawId, 'Transaction ID')}
                          title="Double-click to copy ID"
                        >
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-sm font-mono bg-gray-100 text-gray-800">
                            {transaction.withdrawId}
                          </span>
                        </TableCell>

                        {/* Account Holder */}
                        <TableCell 
                          className="px-3 py-3 cursor-copy" 
                          onDoubleClick={() => copyToClipboard(transaction.accountHolderName || '-', 'Account Holder')}
                          title="Double-click to copy account holder name"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                              <User className="w-4 h-4 text-gray-600" />
                            </div>
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {transaction.accountHolderName || 'Unknown Account'}
                            </div>
                          </div>
                        </TableCell>

                        {/* Account Number */}
                        <TableCell 
                          className="px-3 py-3 cursor-copy w-36" 
                          onDoubleClick={() => copyToClipboard(transaction.accountNumber || '-', 'Account Number')}
                          title="Double-click to copy account number"
                        >
                          <span className="text-sm font-mono text-gray-900">
                            {transaction.accountNumber || 'N/A'}
                          </span>
                        </TableCell>

                        {/* UTR */}
                        <TableCell 
                          className="px-3 py-3 cursor-copy w-32" 
                          onDoubleClick={() => copyToClipboard(transaction.utr || '-', 'UTR')}
                          title="Double-click to copy UTR"
                        >
                          <span className="text-sm font-mono text-gray-600 truncate">
                            {transaction.utr || 'N/A'}
                          </span>
                        </TableCell>

                        {/* Status */}
                        <TableCell 
                          className="px-3 py-3 text-center cursor-copy w-24" 
                          onDoubleClick={() => copyToClipboard(transaction.status, 'Status')}
                          title="Double-click to copy status"
                        >
                          <Badge 
                            variant={getStatusVariant(transaction.status)}
                            className="text-sm px-2.5 py-0.5"
                          >
                            <span className="flex items-center space-x-1">
                              {getStatusIcon(transaction.status)}
                              <span>{transaction.status}</span>
                            </span>
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        {/* Mobile-Optimized Pagination & Controls */}
        {!loading && transactions.length > 0 && (
          <div className="mt-6 md:mt-8 space-y-4 md:space-y-0">
            {/* Mobile Layout - Stacked */}
            <div className="md:hidden space-y-4">
              {/* Summary and Page Size */}
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, total)} of {total}
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-700">Per page:</span>
                  <div className="relative">
                    <select
                      value={pageSize}
                      onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                      className="bg-white border border-gray-300 rounded-lg px-3 py-2 pr-8 text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent appearance-none"
                      disabled={loading}
                    >
                      {pageSizeOptions.map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Mobile Pagination Controls */}
              <div className="flex items-center justify-center">
                <div className="bg-white border border-gray-200 rounded-lg px-4 py-2">
                  <Pagination>
                    <PaginationContent className="gap-1">
                      <PaginationItem>
                        <PaginationPrevious 
                          href="#" 
                          onClick={(e) => {
                            e.preventDefault();
                            handlePageChange(currentPage - 1);
                          }}
                          className={`transition-colors h-10 w-10 p-0 ${
                            currentPage <= 1 
                              ? 'pointer-events-none opacity-50' 
                              : 'hover:bg-gray-100'
                          }`}
                        />
                      </PaginationItem>
                      
                      {/* Mobile simplified pagination - only show current and total */}
                      <PaginationItem>
                        <div className="flex items-center space-x-2 px-3 py-2">
                          <span className="text-sm font-medium text-gray-900">{currentPage}</span>
                          <span className="text-sm text-gray-500">of</span>
                          <span className="text-sm font-medium text-gray-900">{totalPages}</span>
                        </div>
                      </PaginationItem>
                      
                      <PaginationItem>
                        <PaginationNext 
                          href="#" 
                          onClick={(e) => {
                            e.preventDefault();
                            handlePageChange(currentPage + 1);
                          }}
                          className={`transition-colors h-10 w-10 p-0 ${
                            currentPage >= totalPages 
                              ? 'pointer-events-none opacity-50' 
                              : 'hover:bg-gray-100'
                          }`}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              </div>
            </div>

            {/* Desktop Layout - Original Horizontal */}
            <div className="hidden md:flex flex-col lg:flex-row items-center justify-between gap-4">
              {/* Page Size Selector */}
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-700">Rows per page:</span>
                <div className="relative">
                  <select
                    value={pageSize}
                    onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                    className="bg-white border border-gray-300 rounded-lg px-3 py-2 pr-8 text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent appearance-none"
                    disabled={loading}
                  >
                    {pageSizeOptions.map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Pagination */}
              <div className="bg-white border border-gray-200 rounded-lg px-4 py-2">
                <Pagination>
                  <PaginationContent className="gap-1">
                    <PaginationItem>
                      <PaginationPrevious 
                        href="#" 
                        onClick={(e) => {
                          e.preventDefault();
                          handlePageChange(currentPage - 1);
                        }}
                        className={`transition-colors ${
                          currentPage <= 1 
                            ? 'pointer-events-none opacity-50' 
                            : 'hover:bg-gray-100'
                        }`}
                      />
                    </PaginationItem>
                    
                    {generatePageNumbers().map((page, index) => (
                      <PaginationItem key={index}>
                        {page === '...' ? (
                          <PaginationEllipsis className="text-gray-500" />
                        ) : (
                          <PaginationLink
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              handlePageChange(page as number);
                            }}
                            isActive={page === currentPage}
                            className={`transition-colors ${
                              page === currentPage
                                ? 'bg-gray-900 text-white hover:bg-gray-800'
                                : 'hover:bg-gray-100'
                            }`}
                          >
                            {page}
                          </PaginationLink>
                        )}
                      </PaginationItem>
                    ))}
                    
                    <PaginationItem>
                      <PaginationNext 
                        href="#" 
                        onClick={(e) => {
                          e.preventDefault();
                          handlePageChange(currentPage + 1);
                        }}
                        className={`transition-colors ${
                          currentPage >= totalPages 
                            ? 'pointer-events-none opacity-50' 
                            : 'hover:bg-gray-100'
                        }`}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>

              {/* Summary Info */}
              <div className="text-sm text-gray-500">
                Showing {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, total)} of {total} transactions
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span>Connected to {ACCOUNTS[selectedAccount].name}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span>Page {currentPage} of {totalPages}</span>
              </div>
            </div>
            <div className="text-center">
              <p>&copy; 2025 Finance Dashboard - Modern Transaction Management</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TransactionDashboard;
