'use client';

import React, { useState, useEffect } from 'react';
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
  Filter, 
  FileSpreadsheet,
  Calendar,
  Hash,
  User,
  CreditCard,
  Building,
  LogOut
} from 'lucide-react';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
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

  // Summary state
  const [summaryData, setSummaryData] = useState<{
    accountNumber: string;
    totalAmount: number;
    totalTransactions: number;
    status: string;
    account: string;
  } | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

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
  }, [selectedAccount, pageSize]);

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
      // You could add a toast notification here if needed
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Authentication check - redirect to login if not authenticated
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex">
      {/* Redesigned Sidebar - Fixed Position */}
      <div className="w-72 fixed left-0 top-0 h-screen bg-gradient-to-b from-white via-slate-50/80 to-white shadow-2xl border-r border-slate-200/50 z-10">
        <div className="h-full flex flex-col">
          {/* Compact Header */}
          <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-blue-600 to-purple-700 text-white">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/10"></div>
            <div className="relative p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-8 w-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                  <FileSpreadsheet className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white">
                    Finance Dashboard
                  </h1>
                  <p className="text-xs text-white/70">
                    Transaction Management
                  </p>
                </div>
              </div>
              
              {/* Compact Stats */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 border border-white/20">
                  <div className="text-xs text-white/80">Records</div>
                  <div className="text-sm font-semibold text-white">{total.toLocaleString()}</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 border border-white/20">
                  <div className="text-xs text-white/80">Page</div>
                  <div className="text-sm font-semibold text-white">{currentPage}/{totalPages}</div>
                </div>
              </div>
              
              {/* Sync Status - Compact */}
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 border border-white/20">
                <SyncStatusIndicator />
              </div>
            </div>
          </div>

          {/* Sidebar Content - More Compact */}
          <div className="flex-1 min-h-0 p-4 space-y-4 overflow-y-auto">
            {/* Account Selector - Redesigned */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide flex items-center gap-1.5">
                <Building className="h-3 w-3" />
                Account
              </label>
              <div className="relative">
                <select
                  value={selectedAccount}
                  onChange={(e) => setSelectedAccount(e.target.value as keyof typeof ACCOUNTS)}
                  className="w-full appearance-none bg-white border border-slate-200 rounded-lg px-3 py-2.5 pr-8 text-sm font-medium shadow-sm transition-all duration-200 hover:shadow-md hover:border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  disabled={loading}
                >
                  <option value="all">{ACCOUNTS.all.icon} {ACCOUNTS.all.name}</option>
                  <option value="doa6ps">{ACCOUNTS.doa6ps.icon} Account {ACCOUNTS.doa6ps.name}</option>
                  <option value="fwxeqk">{ACCOUNTS.fwxeqk.icon} Account {ACCOUNTS.fwxeqk.name}</option>
                </select>
                <Filter className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Transaction Filters - Compact */}
            <TransactionFilters
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onApplyFilters={handleApplyFilters}
              onClearFilters={handleClearFilters}
              isLoading={loading}
            />

            {/* Account Summary Card - Show when account number filter is applied */}
            {(summaryData || summaryLoading) && filters.accountNumber && (
              <AccountSummaryCard
                accountNumber={filters.accountNumber}
                totalAmount={summaryData?.totalAmount || 0}
                totalTransactions={summaryData?.totalTransactions || 0}
                status={summaryData?.status || 'Succeeded'}
                _account={selectedAccount}
                isLoading={summaryLoading}
              />
            )}
          </div>
          
          {/* Action Buttons - Fixed at Bottom */}
          <div className="flex-shrink-0 p-4 bg-slate-50/50 border-t border-slate-200">
            <div className="space-y-2">
              <Button 
                onClick={exportToExcel} 
                disabled={loading || transactions.length === 0}
                size="sm"
                variant="outline"
                className="w-full bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-700 font-medium transition-all duration-200"
              >
                <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5" />
                Export Excel
              </Button>
              
              <Button 
                onClick={() => loadTransactions(currentPage)} 
                disabled={loading}
                size="sm"
                className="w-full bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white font-medium transition-all duration-200"
              >
                <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              
              <Button 
                onClick={logout}
                size="sm"
                variant="outline"
                className="w-full bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-700 font-medium transition-all duration-200"
              >
                <LogOut className="h-3.5 w-3.5 mr-1.5" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 ml-72 p-6 space-y-6 overflow-y-auto">
        {/* Error Display */}
        {error && (
          <div className="rounded-2xl bg-red-50 border border-red-200 p-6 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-red-900">Error Loading Transactions</h3>
                <p className="text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Modern Transactions Table */}
        <div className="rounded-2xl bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <Table className="relative">
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b border-slate-200">
                  <TableHead className="h-14 px-6 text-xs font-semibold text-slate-600 uppercase tracking-wider bg-slate-50/50">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Date
                    </div>
                  </TableHead>
                  {selectedAccount === 'all' && (
                    <TableHead className="h-14 px-6 text-xs font-semibold text-slate-600 uppercase tracking-wider bg-slate-50/50">
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        Account
                      </div>
                    </TableHead>
                  )}
                  <TableHead className="h-14 px-6 text-xs font-semibold text-slate-600 uppercase tracking-wider bg-slate-50/50">
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4" />
                      Withdraw ID
                    </div>
                  </TableHead>
                  <TableHead className="h-14 px-6 text-xs font-semibold text-slate-600 uppercase tracking-wider bg-slate-50/50">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Account Holder
                    </div>
                  </TableHead>
                  <TableHead className="h-14 px-6 text-xs font-semibold text-slate-600 uppercase tracking-wider bg-slate-50/50">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Account Number
                    </div>
                  </TableHead>
                  <TableHead className="h-14 px-6 text-xs font-semibold text-slate-600 uppercase tracking-wider bg-slate-50/50">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      IFSC Code
                    </div>
                  </TableHead>
                  <TableHead className="h-14 px-6 text-xs font-semibold text-slate-600 uppercase tracking-wider bg-slate-50/50">
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4" />
                      UTR
                    </div>
                  </TableHead>
                  <TableHead className="h-14 px-6 text-xs font-semibold text-slate-600 uppercase tracking-wider bg-slate-50/50">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Status
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={selectedAccount === 'all' ? 8 : 7} className="text-center py-16">
                      <div className="flex flex-col items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                          <RefreshCw className="h-6 w-6 text-white animate-spin" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900">Loading transactions...</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            Please wait while we fetch the latest data
                          </p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={selectedAccount === 'all' ? 8 : 7} className="text-center py-16">
                      <div className="flex flex-col items-center gap-4">
                        <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center">
                          <FileSpreadsheet className="h-8 w-8 text-slate-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900">No transactions found</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            Try selecting a different account or refreshing the data
                          </p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((transaction) => (
                    <TableRow 
                      key={transaction.id} 
                      className="border-b border-slate-100 hover:bg-slate-50/50 transition-all duration-200 group"
                    >
                      <TableCell 
                        className="px-6 py-4 cursor-copy" 
                        onDoubleClick={() => copyToClipboard(formatDate(transaction.date), 'Date')}
                        title="Double-click to copy"
                      >
                        <span className="font-mono text-sm font-medium text-slate-900">
                          {formatDate(transaction.date)}
                        </span>
                      </TableCell>
                      {selectedAccount === 'all' && (
                        <TableCell 
                          className="px-6 py-4 cursor-copy" 
                          onDoubleClick={() => copyToClipboard(ACCOUNTS[transaction.source as keyof typeof ACCOUNTS]?.name || transaction.source?.toUpperCase() || 'Unknown', 'Account')}
                          title="Double-click to copy"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{ACCOUNTS[transaction.source as keyof typeof ACCOUNTS]?.icon || '📄'}</span>
                            <span className="font-medium text-slate-900">
                              {ACCOUNTS[transaction.source as keyof typeof ACCOUNTS]?.name || transaction.source?.toUpperCase() || 'Unknown'}
                            </span>
                          </div>
                        </TableCell>
                      )}
                      <TableCell 
                        className="px-6 py-4 cursor-copy" 
                        onDoubleClick={() => copyToClipboard(transaction.withdrawId, 'Withdraw ID')}
                        title="Double-click to copy"
                      >
                        <div className="font-mono text-sm bg-slate-100 px-3 py-1.5 rounded-lg inline-block">
                          {transaction.withdrawId}
                        </div>
                      </TableCell>
                      <TableCell 
                        className="px-6 py-4 cursor-copy" 
                        onDoubleClick={() => copyToClipboard(transaction.accountHolderName || '-', 'Account Holder')}
                        title="Double-click to copy"
                      >
                        <span className="font-medium text-slate-900">
                          {transaction.accountHolderName || '-'}
                        </span>
                      </TableCell>
                      <TableCell 
                        className="px-6 py-4 cursor-copy" 
                        onDoubleClick={() => copyToClipboard(transaction.accountNumber || '-', 'Account Number')}
                        title="Double-click to copy"
                      >
                        <span className="font-mono text-sm bg-slate-100 px-3 py-1.5 rounded-lg">
                          {transaction.accountNumber || '-'}
                        </span>
                      </TableCell>
                      <TableCell 
                        className="px-6 py-4 cursor-copy" 
                        onDoubleClick={() => copyToClipboard(transaction.ifscCode || '-', 'IFSC Code')}
                        title="Double-click to copy"
                      >
                        <span className="font-mono text-sm font-medium text-slate-600">
                          {transaction.ifscCode || '-'}
                        </span>
                      </TableCell>
                      <TableCell 
                        className="px-6 py-4 cursor-copy" 
                        onDoubleClick={() => copyToClipboard(transaction.utr || '-', 'UTR')}
                        title="Double-click to copy"
                      >
                        <span className="font-mono text-sm text-slate-500">
                          {transaction.utr || '-'}
                        </span>
                      </TableCell>
                      <TableCell 
                        className="px-6 py-4 cursor-copy" 
                        onDoubleClick={() => copyToClipboard(transaction.status, 'Status')}
                        title="Double-click to copy"
                      >
                        <Badge 
                          variant="outline"
                          className={`font-medium flex items-center gap-2 ${getStatusVariant(transaction.status) === 'secondary' 
                            ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                            : getStatusVariant(transaction.status) === 'default'
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-red-50 text-red-700 border-red-200'
                          }`}
                        >
                          {getStatusIcon(transaction.status)}
                          {transaction.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Table Controls & Pagination */}
        {!loading && transactions.length > 0 && (
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
            {/* Page Size Selector */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-slate-600">Rows per page:</span>
              <div className="relative">
                <select
                  value={pageSize}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  className="appearance-none bg-white/90 backdrop-blur-sm border border-slate-200 rounded-lg px-3 py-2 pr-8 text-sm font-medium shadow-sm transition-all duration-200 hover:shadow-md focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  disabled={loading}
                >
                  {pageSizeOptions.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Pagination */}
            <div className="rounded-2xl bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg p-4">
              <Pagination>
                <PaginationContent className="gap-2">
                  <PaginationItem>
                    <PaginationPrevious 
                      href="#" 
                      onClick={(e) => {
                        e.preventDefault();
                        handlePageChange(currentPage - 1);
                      }}
                      className={`rounded-xl transition-all duration-200 ${
                        currentPage <= 1 
                          ? 'pointer-events-none opacity-50' 
                          : 'hover:bg-blue-50 hover:text-blue-600'
                      }`}
                    />
                  </PaginationItem>
                  
                  {generatePageNumbers().map((page, index) => (
                    <PaginationItem key={index}>
                      {page === '...' ? (
                        <PaginationEllipsis className="text-slate-500" />
                      ) : (
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            handlePageChange(page as number);
                          }}
                          isActive={page === currentPage}
                          className={`rounded-xl transition-all duration-200 ${
                            page === currentPage
                              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg hover:from-blue-600 hover:to-purple-700'
                              : 'hover:bg-slate-100'
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
                      className={`rounded-xl transition-all duration-200 ${
                        currentPage >= totalPages 
                          ? 'pointer-events-none opacity-50' 
                          : 'hover:bg-blue-50 hover:text-blue-600'
                      }`}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </div>
        )}

        {/* Enhanced Footer */}
        <div className="rounded-2xl bg-white/60 backdrop-blur-sm border border-white/20 shadow-lg p-6">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4 text-sm">
            <div className="flex flex-col lg:flex-row items-center gap-4 text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span>
                  Showing {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, total)} of {total} transactions
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                <span>Page {currentPage} of {totalPages}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-purple-500"></div>
                <span>{pageSize} per page</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <span>Connected to:</span>
              <Badge variant="outline" className="font-mono bg-white/50">
                {ACCOUNTS[selectedAccount].name} via Next.js API
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionDashboard;
