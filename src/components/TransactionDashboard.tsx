import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';
import { 
  RefreshCw, 
  AlertCircle, 
  CheckCircle, 
  Filter, 
  FileSpreadsheet,
  FileText,
  Calendar,
  Hash,
  User,
  CreditCard,
  Building,
  LogOut
} from 'lucide-react';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import TransactionService, { API_CONFIGS } from '@/services/transactionService';
import { Transaction, TransactionStatus } from '@/types/transaction';
import { useAuth } from '@/contexts/AuthContext';

const TransactionDashboard: React.FC = () => {
  const { logout } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedConfig, setSelectedConfig] = useState<keyof typeof API_CONFIGS>('doa6ps');
  const [error, setError] = useState<string | null>(null);
  
  const pageSize = 15;


  // Load transactions for current page
  const loadTransactions = async (page: number = 1) => {
    if (loading) return; // Prevent multiple simultaneous requests
    
    setLoading(true);
    setError(null);
    
    try {
      const service = new TransactionService(selectedConfig);
      const result = await service.fetchTransactionsPaginated(page, pageSize);
      
      setTransactions(result.transactions);
      setTotalPages(result.totalPages);
      setTotal(result.total);
      setCurrentPage(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load transactions');
      console.error('Error loading transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load initial data
  useEffect(() => {
    let mounted = true;
    
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const service = new TransactionService(selectedConfig);
        const result = await service.fetchTransactionsPaginated(1, pageSize);
        
        if (mounted) {
          setTransactions(result.transactions);
          setTotalPages(result.totalPages);
          setTotal(result.total);
          setCurrentPage(1);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load transactions');
          console.error('Error loading transactions:', err);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };
    
    fetchData();
    
    return () => {
      mounted = false;
    };
  }, [selectedConfig]);

  // Handle page navigation
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      loadTransactions(page);
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
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Export to Excel using ExcelJS (secure alternative)
  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Transactions');

    // Define columns
    worksheet.columns = [
      { header: 'S.No', key: 'sno', width: 8 },
      { header: 'Date', key: 'date', width: 20 },
      { header: 'Withdraw ID', key: 'withdrawId', width: 15 },
      { header: 'Account Holder', key: 'accountHolder', width: 25 },
      { header: 'Account Number', key: 'accountNumber', width: 20 },
      { header: 'IFSC Code', key: 'ifscCode', width: 15 },
      { header: 'UTR', key: 'utr', width: 20 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Success Date', key: 'successDate', width: 20 }
    ];

    // Add data rows
    transactions.forEach((transaction, index) => {
      worksheet.addRow({
        sno: index + 1,
        date: formatDate(transaction.date),
        withdrawId: transaction.withdrawId,
        accountHolder: transaction.accountHolderName || '-',
        accountNumber: transaction.accountNumber || '-',
        ifscCode: transaction.ifscCode || '-',
        utr: transaction.utr || '-',
        status: transaction.status,
        successDate: transaction.successDate || '-'
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
    const filename = `transactions_${selectedConfig}_page_${currentPage}_${timestamp}.xlsx`;

    // Generate buffer and save file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, filename);
  };

  // Export to CSV
  const exportToCSV = () => {
    // Convert to CSV format manually (secure approach)
    const headers = ['S.No', 'Date', 'Withdraw ID', 'Account Holder', 'Account Number', 'IFSC Code', 'UTR', 'Status', 'Success Date'];
    
    const csvRows = [
      headers.join(','), // Header row
      ...transactions.map((transaction, index) => [
        index + 1,
        `"${formatDate(transaction.date)}"`,
        `"${transaction.withdrawId}"`,
        `"${transaction.accountHolderName || '-'}"`,
        `"${transaction.accountNumber || '-'}"`,
        `"${transaction.ifscCode || '-'}"`,
        `"${transaction.utr || '-'}"`,
        `"${transaction.status}"`,
        `"${transaction.successDate || '-'}"`
      ].join(','))
    ];

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const filename = `transactions_${selectedConfig}_page_${currentPage}_${timestamp}.csv`;
    
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-blue-900 dark:to-indigo-900">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-white/20 shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10"></div>
          <div className="relative p-8">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <FileSpreadsheet className="h-5 w-5 text-white" />
                  </div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Transaction Dashboard
                  </h1>
                </div>
                <p className="text-lg text-muted-foreground ml-13">
                  Monitor and export withdrawal transactions from demo accounts
                </p>
                <div className="flex items-center gap-4 ml-13 pt-2">
                  <Badge variant="outline" className="text-xs font-medium">
                    Live Data
                  </Badge>
                  <Badge variant="outline" className="text-xs font-medium">
                    {total} Total Records
                  </Badge>
                  <Badge variant="outline" className="text-xs font-medium">
                    Page {currentPage} of {totalPages}
                  </Badge>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-3">
                {/* Account Selector */}
                <div className="relative">
                  <select
                    value={selectedConfig}
                    onChange={(e) => setSelectedConfig(e.target.value as keyof typeof API_CONFIGS)}
                    className="appearance-none bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 pr-10 text-sm font-medium shadow-lg transition-all duration-200 hover:shadow-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    disabled={loading}
                  >
                    <option value="doa6ps">🏢 Account DOA6PS</option>
                    <option value="fwxeqk">📱 Account FWXEQK</option>
                  </select>
                  <Filter className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
                
                {/* Export Buttons */}
                <div className="flex items-center gap-2">
                  <Button 
                    onClick={exportToExcel} 
                    disabled={loading || transactions.length === 0}
                    variant="outline"
                    className="bg-green-50 hover:bg-green-100 border-green-200 text-green-700 shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Excel
                  </Button>
                  
                  <Button 
                    onClick={exportToCSV} 
                    disabled={loading || transactions.length === 0}
                    variant="outline"
                    className="bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700 shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    CSV
                  </Button>
                </div>
                
                <Button 
                  onClick={() => loadTransactions(currentPage)} 
                  disabled={loading}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                
                <Button 
                  onClick={logout}
                  variant="outline"
                  className="bg-red-50 hover:bg-red-100 border-red-200 text-red-700 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>



        {/* Error Display */}
        {error && (
          <div className="rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-6 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="font-semibold text-red-900 dark:text-red-100">Error Loading Transactions</h3>
                <p className="text-red-700 dark:text-red-300 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Modern Transactions Table */}
        <div className="rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-white/20 shadow-xl overflow-hidden">
          {/* Table Header */}
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-600 px-8 py-6 border-b border-slate-200 dark:border-slate-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <FileSpreadsheet className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    Transaction Records
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Withdrawal transactions with real-time status updates
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-white/50 dark:bg-slate-700/50">
                  {transactions.length} records
                </Badge>
                <Badge variant="outline" className="bg-white/50 dark:bg-slate-700/50">
                  Account: {selectedConfig.toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>

          {/* Table Content */}
          <div className="overflow-x-auto">
            <Table className="relative">
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b border-slate-200 dark:border-slate-700">
                  <TableHead className="h-14 px-6 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Date
                    </div>
                  </TableHead>
                  <TableHead className="h-14 px-6 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4" />
                      Withdraw ID
                    </div>
                  </TableHead>
                  <TableHead className="h-14 px-6 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Account Holder
                    </div>
                  </TableHead>
                  <TableHead className="h-14 px-6 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Account Number
                    </div>
                  </TableHead>
                  <TableHead className="h-14 px-6 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      IFSC Code
                    </div>
                  </TableHead>
                  <TableHead className="h-14 px-6 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4" />
                      UTR
                    </div>
                  </TableHead>
                  <TableHead className="h-14 px-6 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Status
                    </div>
                  </TableHead>
                  <TableHead className="h-14 px-6 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Success Date
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-16">
                      <div className="flex flex-col items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                          <RefreshCw className="h-6 w-6 text-white animate-spin" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Loading transactions...</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            Please wait while we fetch the latest data
                          </p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-16">
                      <div className="flex flex-col items-center gap-4">
                        <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                          <FileSpreadsheet className="h-8 w-8 text-slate-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">No transactions found</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            Try selecting a different account or refreshing the data
                          </p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((transaction, _index) => (
                    <TableRow 
                      key={transaction.id} 
                      className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-all duration-200 group"
                    >
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-2 w-2 rounded-full bg-blue-500 group-hover:bg-purple-500 transition-colors duration-200" />
                          <span className="font-mono text-sm font-medium text-slate-900 dark:text-slate-100">
                            {formatDate(transaction.date)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="font-mono text-sm bg-slate-100 dark:bg-slate-700/50 px-3 py-1.5 rounded-lg inline-block">
                          {transaction.withdrawId}
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                            {(transaction.accountHolderName || 'U').charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-slate-900 dark:text-slate-100">
                            {transaction.accountHolderName || '-'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <span className="font-mono text-sm bg-slate-100 dark:bg-slate-700/50 px-3 py-1.5 rounded-lg">
                          {transaction.accountNumber || '-'}
                        </span>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <span className="font-mono text-sm font-medium text-slate-600 dark:text-slate-300">
                          {transaction.ifscCode || '-'}
                        </span>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <span className="font-mono text-sm text-slate-500 dark:text-slate-400">
                          {transaction.utr || '-'}
                        </span>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <Badge 
                          variant="outline"
                          className={`font-medium flex items-center gap-2 ${getStatusVariant(transaction.status) === 'secondary' 
                            ? 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800'
                            : getStatusVariant(transaction.status) === 'default'
                            ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
                            : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
                          }`}
                        >
                          {getStatusIcon(transaction.status)}
                          {transaction.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <span className="font-mono text-sm text-slate-600 dark:text-slate-300">
                          {transaction.successDate || '-'}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Modern Pagination */}
        {!loading && transactions.length > 0 && (
          <div className="flex justify-center">
            <div className="rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-white/20 shadow-lg p-4">
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
                          : 'hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400'
                      }`}
                    />
                  </PaginationItem>
                  
                  {generatePageNumbers().map((page, index) => (
                    <PaginationItem key={index}>
                      {page === '...' ? (
                        <PaginationEllipsis className="text-slate-500 dark:text-slate-400" />
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
                              : 'hover:bg-slate-100 dark:hover:bg-slate-700'
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
                          : 'hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400'
                      }`}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </div>
        )}

        {/* Enhanced Footer */}
        <div className="rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/20 shadow-lg p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
            <div className="flex items-center gap-4 text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span>Showing {transactions.length} of {total} transactions</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                <span>Page {currentPage} of {totalPages}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <span>Connected to:</span>
              <Badge variant="outline" className="font-mono bg-white/50 dark:bg-slate-700/50">
                {selectedConfig.toUpperCase()}
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionDashboard;
