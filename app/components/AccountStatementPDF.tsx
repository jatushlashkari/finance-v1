'use client';

import React from 'react';
import { Button } from './ui/button';
import { 
  FileText,
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
  totalTransactions: number;
  successTransactions: number;
  failedTransactions: number;
  processingTransactions: number;
  totalAmount: number;
  lastTransactionDate: string;
  isBookmarked: boolean;
}

interface AccountStatementPDFProps {
  transactions: Transaction[];
  account: AccountStats;
  onClose: () => void;
}

const AccountStatementPDF: React.FC<AccountStatementPDFProps> = ({
  transactions,
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
      month: 'short',
      day: 'numeric'
    });
  };

  const totalSuccessAmount = transactions.reduce((sum, t) => sum + t.amount, 0);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const filename = `statement_${account.accountNumber}_${new Date().toISOString().split('T')[0]}.pdf`;
      
      const statementElement = document.querySelector('.statement-content');
      if (!statementElement) return;

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

      // Create canvas from the statement content
      const canvas = await html2canvas(statementElement as HTMLElement, {
        useCORS: true,
        allowTaint: true,
        background: '#ffffff',
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
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Screen Header - Hidden when printing */}
        <div className="print:hidden flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Account Statement</h2>
              <p className="text-sm text-gray-600">Successful Transactions Only</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={handleDownload}
              disabled={isDownloading}
              size="sm"
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
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

        <div className="p-6 print:p-8 statement-content bg-white">
          {/* Bank Header */}
          <div className="mb-6 pb-4 border-b-4 border-blue-900">
            <div className="flex justify-end items-start mb-2">
              <div className="text-right">
                <p className="text-xs text-gray-600 mb-1">Statement Date</p>
                <p className="text-sm font-semibold text-gray-900">
                  {new Date().toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Account Details Section */}
          <div className="mb-6 p-4 bg-gray-50 border border-gray-300">
            <h2 className="text-sm font-bold text-gray-900 mb-3 uppercase border-b border-gray-300 pb-1">Account Statement</h2>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
              <div className="flex">
                <span className="text-gray-600 w-32">Account Holder:</span>
                <span className="font-semibold text-gray-900">{account.accountHolderName}</span>
              </div>
              <div className="flex">
                <span className="text-gray-600 w-32">Account Number:</span>
                <span className="font-mono font-semibold text-gray-900">{account.accountNumber}</span>
              </div>
              <div className="flex col-span-2">
                <span className="text-gray-600 w-32">Statement Period:</span>
                <span className="font-medium text-gray-900">
                  {transactions.length > 0 && (
                    <>
                      {formatDate(transactions[transactions.length - 1].date)} to {formatDate(transactions[0].date)}
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Summary Box */}
          <div className="mb-6 p-3 bg-blue-50 border-l-4 border-blue-900">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-gray-700 uppercase">Total Credit Amount:</span>
              <span className="text-xl font-bold text-blue-900">{formatAmount(totalSuccessAmount)}</span>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-gray-900 mb-2 uppercase bg-gray-100 p-2 border-l-4 border-blue-900">Transaction Details</h3>
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-blue-900 text-white">
                  <th className="border border-gray-300 p-2 text-left text-xs font-semibold uppercase">Date</th>
                  <th className="border border-gray-300 p-2 text-left text-xs font-semibold uppercase">Transaction ID</th>
                  <th className="border border-gray-300 p-2 text-left text-xs font-semibold uppercase">Ref ID</th>
                  <th className="border border-gray-300 p-2 text-left text-xs font-semibold uppercase">UTR Number</th>
                  <th className="border border-gray-300 p-2 text-right text-xs font-semibold uppercase">Credit (₹)</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction, index) => (
                  <tr 
                    key={transaction.id} 
                    className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                  >
                    <td className="border border-gray-300 p-2 text-xs">
                      <div className="font-medium text-gray-900">
                        {formatDate(transaction.date)}
                      </div>
                      <div className="text-gray-600">
                        {new Date(transaction.date).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </td>
                    <td className="border border-gray-300 p-2 text-xs font-mono text-gray-900 break-all">
                      {transaction.id}
                    </td>
                    <td className="border border-gray-300 p-2 text-xs font-mono text-gray-900">
                      {transaction.withdrawId}
                    </td>
                    <td className="border border-gray-300 p-2 text-xs font-mono text-gray-900">
                      {transaction.utr || '-'}
                    </td>
                    <td className="border border-gray-300 p-2 text-xs text-right font-semibold text-gray-900">
                      {formatAmount(transaction.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Total Section */}
          <div className="mb-6 border border-gray-300 bg-gray-50">
            <div className="grid grid-cols-2 text-sm">
              <div className="border-r border-gray-300 p-3 font-bold bg-blue-900 text-white uppercase">
                Total Credit Amount:
              </div>
              <div className="p-3 text-right font-bold text-xl text-blue-900 bg-blue-50">
                {formatAmount(totalSuccessAmount)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountStatementPDF;
