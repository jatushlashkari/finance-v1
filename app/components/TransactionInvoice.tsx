'use client';

import React from 'react';
import { Button } from './ui/button';
import { 
  Receipt,
  X,
  Download
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

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

interface AccountStats {
  accountHolderName: string;
  accountNumber: string;
  ifscCode?: string;
}

interface TransactionInvoiceProps {
  transaction: Transaction;
  account: AccountStats;
  onClose: () => void;
}

const TransactionInvoice: React.FC<TransactionInvoiceProps> = ({
  transaction,
  account,
  onClose
}) => {
  const [isDownloading, setIsDownloading] = React.useState(false);
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Succeeded':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'Failed':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'Processing':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      // Generate a filename with transaction details
      const filename = `invoice_${transaction.withdrawId}_${new Date(transaction.date).toISOString().split('T')[0]}.pdf`;
      
      // Get the invoice content element
      const invoiceElement = document.querySelector('.invoice-content');
      if (!invoiceElement) return;

      // Temporarily hide screen-only elements
      const screenElements = document.querySelectorAll('.print\\:hidden');
      screenElements.forEach(el => {
        (el as HTMLElement).style.display = 'none';
      });

      // Show print-only elements
      const printElements = document.querySelectorAll('.print\\:block');
      printElements.forEach(el => {
        (el as HTMLElement).style.display = 'block';
      });

      // Create canvas from the invoice content
      const canvas = await html2canvas(invoiceElement as HTMLElement, {
        useCORS: true,
        allowTaint: true,
        background: '#ffffff',
        width: 800,
        height: 1200
      });

      // Restore original display states
      screenElements.forEach(el => {
        (el as HTMLElement).style.display = '';
      });
      printElements.forEach(el => {
        (el as HTMLElement).style.display = '';
      });

      // Create PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Download the PDF
      pdf.save(filename);
    } catch (error) {
      console.error('Error generating PDF:', error);
      // Fallback to print dialog
      window.print();
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Print Header - Only visible when printing */}
        <div className="print:block hidden mb-8">
          <div className="flex justify-between items-start border-b-2 border-gray-800 pb-6 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">INVOICE</h1>
              <p className="text-lg text-gray-700 font-medium">Transaction Receipt</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 mb-1">Invoice Date:</p>
              <p className="text-lg font-semibold text-gray-900">
                {new Date().toLocaleDateString('en-IN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Screen Header - Hidden when printing */}
        <div className="print:hidden flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Receipt className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Transaction Invoice</h2>
              <p className="text-sm text-gray-600">Transaction Receipt & Details</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={handleDownload}
              disabled={isDownloading}
              size="sm"
              className="flex items-center space-x-2"
            >
              {isDownloading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download PDF</span>
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="flex items-center space-x-2"
            >
              <X className="w-4 h-4" />
              <span>Close</span>
            </Button>
          </div>
        </div>

        <div className="p-6 print:p-8 invoice-content">
          {/* Invoice Details Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 print:mb-6">
            {/* Transaction Details */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4 uppercase tracking-wide">Transaction Details</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Transaction ID</p>
                  <p className="text-sm font-mono font-semibold text-gray-900">{transaction.id}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Withdraw ID</p>
                  <p className="text-sm font-mono font-semibold text-gray-900">{transaction.withdrawId}</p>
                </div>
                {transaction.utr && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">UTR Number</p>
                    <p className="text-sm font-mono font-semibold text-gray-900">{transaction.utr}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Bill To Section */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4 uppercase tracking-wide">Bill To</h3>
              <div className="space-y-2">
                <p className="text-base font-semibold text-gray-900">{account.accountHolderName}</p>
                <p className="text-sm text-gray-600">Account: {account.accountNumber}</p>
                {account.ifscCode && (
                  <p className="text-sm text-gray-600">IFSC: {account.ifscCode}</p>
                )}
              </div>
            </div>
          </div>

          {/* Invoice Items Table */}
          <div className="mb-8 print:mb-6">
            <div className="border border-gray-300 rounded-lg overflow-hidden">
              <div className="bg-gray-800 text-white">
                <div className="grid grid-cols-3 gap-4 p-4 font-semibold uppercase tracking-wide text-sm">
                  <div>Description</div>
                  <div className="text-center">Date & Time</div>
                  <div className="text-right">Amount</div>
                </div>
              </div>
              <div className="p-4 bg-white">
                <div className="grid grid-cols-3 gap-4 items-center">
                  <div>
                    <p className="font-medium text-gray-900">Financial Transaction</p>
                    <div className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium mt-1 ${getStatusColor(transaction.status)}`}>
                      <div className={`w-1.5 h-1.5 rounded-full mr-2 ${
                        transaction.status === 'Succeeded' ? 'bg-green-500' :
                        transaction.status === 'Failed' ? 'bg-red-500' : 'bg-yellow-500'
                      }`}></div>
                      {transaction.status}
                    </div>
                  </div>
                  <div className="text-center text-sm text-gray-600">
                    <p>{formatDate(transaction.date)}</p>
                    {transaction.successDate && transaction.successDate !== transaction.date && (
                      <p className="text-xs text-green-600 mt-1">Success: {formatDate(transaction.successDate)}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">{formatAmount(transaction.amount)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Total Section */}
          <div className="flex justify-end mb-8 print:mb-6">
            <div className="w-full max-w-sm">
              <div className="bg-gray-50 p-4 rounded-lg border">
                <div className="flex justify-between items-center">
                  <span className="text-base font-bold text-gray-900 uppercase tracking-wide">Total Amount</span>
                  <span className="text-lg font-bold text-gray-900">{formatAmount(transaction.amount)}</span>
                </div>
              </div>
            </div>
          </div>



          {/* Footer Information */}
          <div className="border-t-2 border-gray-200 pt-6 mt-8">
            <div className="text-sm text-gray-600">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 uppercase tracking-wide">Payment Terms</h4>
                <p className="mb-1">This transaction has been processed digitally.</p>
                <p>Status: <span className="font-medium">{transaction.status}</span></p>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-200 text-center">
              <p className="text-xs text-gray-500">
                Invoice generated on {new Date().toLocaleDateString('en-IN', {
                  year: 'numeric',
                  month: 'long',  
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })} • Digital Receipt - Finance Dashboard
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionInvoice;
