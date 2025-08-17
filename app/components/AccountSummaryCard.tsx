'use client';

import React from 'react';
import { Badge } from './ui/badge';
import { 
  CreditCard, 
  Hash, 
  CheckCircle,
  DollarSign
} from 'lucide-react';

interface AccountSummaryCardProps {
  accountNumber: string;
  totalAmount: number;
  totalTransactions: number;
  status: string;
  _account: string;
  isLoading?: boolean;
}

const AccountSummaryCard: React.FC<AccountSummaryCardProps> = ({
  accountNumber,
  totalAmount,
  totalTransactions,
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
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg border border-indigo-200 p-3">
        <div className="animate-pulse">
          <div className="h-3 bg-indigo-200 rounded w-2/3 mb-2"></div>
          <div className="h-5 bg-indigo-200 rounded w-1/2 mb-1"></div>
          <div className="h-3 bg-indigo-200 rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 rounded-lg border border-indigo-200/60 p-3 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-indigo-500"></div>
          <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">
            Account Summary
          </span>
        </div>
        <Badge variant="outline" className="text-xs bg-indigo-100 text-indigo-700 border-indigo-300 px-2 py-0.5">
          {status}
        </Badge>
      </div>

      {/* Account Number */}
      <div className="bg-white/70 rounded-md p-2.5 mb-3 border border-white/50">
        <div className="flex items-center gap-2">
          <CreditCard className="h-3.5 w-3.5 text-indigo-600" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-600 font-medium">Account</p>
            <p className="font-mono text-sm font-semibold text-slate-800 truncate">{accountNumber}</p>
          </div>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        {/* Total Amount */}
        <div className="bg-gradient-to-br from-emerald-100 to-green-100 rounded-md p-2.5 border border-emerald-200/50">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <div className="h-5 w-5 rounded bg-emerald-200 flex items-center justify-center">
                <DollarSign className="h-3 w-3 text-emerald-700" />
              </div>
              <p className="text-xs text-emerald-700 font-medium">Amount</p>
            </div>
            <p className="text-sm font-bold text-emerald-900 leading-tight">
              {formatCurrency(totalAmount)}
            </p>
          </div>
        </div>

        {/* Transaction Count */}
        <div className="bg-gradient-to-br from-blue-100 to-cyan-100 rounded-md p-2.5 border border-blue-200/50">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <div className="h-5 w-5 rounded bg-blue-200 flex items-center justify-center">
                <Hash className="h-3 w-3 text-blue-700" />
              </div>
              <p className="text-xs text-blue-700 font-medium">Count</p>
            </div>
            <p className="text-sm font-bold text-blue-900 leading-tight">
              {formatNumber(totalTransactions)}
            </p>
          </div>
        </div>
      </div>

      {/* Filter Info */}
      <div className="bg-indigo-100/50 rounded-md p-2 border border-indigo-200/50">
        <div className="flex items-center gap-1.5">
          <CheckCircle className="h-3 w-3 text-indigo-600 flex-shrink-0" />
          <span className="text-xs text-indigo-800">
            Filtered by <span className="font-semibold">{status.toLowerCase()}</span> status
          </span>
        </div>
      </div>
    </div>
  );
};

export default AccountSummaryCard;
