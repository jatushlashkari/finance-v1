'use client';

import React from 'react';
import { Badge } from './ui/badge';
import { 
  CreditCard, 
  CheckCircle,
  DollarSign,
  XCircle,
  BarChart3
} from 'lucide-react';

interface AccountSummaryCardProps {
  accountNumber: string;
  totalAmount: number;
  totalTransactions: number;
  succeededTransactions?: number;
  failedTransactions?: number;
  status: string;
  _account: string;
  isLoading?: boolean;
}

const AccountSummaryCard: React.FC<AccountSummaryCardProps> = ({
  accountNumber,
  totalAmount,
  totalTransactions,
  succeededTransactions,
  failedTransactions,
  status,
  _account,
  isLoading = false
}) => {
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Format number with commas
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-IN').format(num);
  };

  if (isLoading) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
        <div className="animate-pulse">
          {/* Header Loading */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0 mb-4">
            <div className="h-4 bg-blue-200 rounded w-32"></div>
            <div className="h-6 bg-green-200 rounded w-24"></div>
          </div>
          
          {/* Statistics Loading */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="h-4 bg-green-200 rounded w-20"></div>
            <div className="h-4 bg-blue-200 rounded w-24"></div>
            <div className="h-4 bg-green-200 rounded w-16"></div>
            <div className="h-4 bg-red-200 rounded w-16"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
      {/* Account Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0 mb-4">
        {/* Account Number */}
        <div className="flex items-center space-x-2">
          <CreditCard className="h-4 w-4 text-blue-600 flex-shrink-0" />
          <div>
            <p className="text-xs text-gray-600">
              {accountNumber.includes('All ') ? 'Summary' : 'Account'}
            </p>
            <p className={`text-sm font-semibold text-gray-900 ${
              accountNumber.includes('All ') ? '' : 'font-mono'
            }`}>
              {accountNumber}
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex justify-start md:justify-end">
          <Badge 
            variant="default" 
            className={`w-fit ${
              status === 'Total Summary' 
                ? 'bg-blue-100 text-blue-800 border-blue-200' 
                : 'bg-green-100 text-green-800 border-green-200'
            }`}
          >
            <CheckCircle className="h-3 w-3 mr-1" />
            {status}
          </Badge>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Amount */}
        <div className="flex items-center space-x-2">
          <DollarSign className="h-4 w-4 text-green-600 flex-shrink-0" />
          <div>
            <p className="text-xs text-gray-600">Total Amount</p>
            <p className="text-sm font-bold text-gray-900">
              {formatCurrency(totalAmount)}
            </p>
          </div>
        </div>

        {/* Total Transactions */}
        <div className="flex items-center space-x-2">
          <BarChart3 className="h-4 w-4 text-blue-600 flex-shrink-0" />
          <div>
            <p className="text-xs text-gray-600">Total Transactions</p>
            <p className="text-sm font-bold text-gray-900">
              {formatNumber(totalTransactions)}
            </p>
          </div>
        </div>

        {/* Succeeded Transactions */}
        {(succeededTransactions !== undefined) && (
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-600">Success</p>
              <p className="text-sm font-bold text-green-700">
                {formatNumber(succeededTransactions)}
              </p>
            </div>
          </div>
        )}

        {/* Failed Transactions */}
        {(failedTransactions !== undefined) && (
          <div className="flex items-center space-x-2">
            <XCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-600">Failed</p>
              <p className="text-sm font-bold text-red-700">
                {formatNumber(failedTransactions)}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountSummaryCard;
