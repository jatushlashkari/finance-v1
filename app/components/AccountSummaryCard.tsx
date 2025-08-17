'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { 
  CreditCard, 
  Hash, 
  TrendingUp, 
  CheckCircle,
  DollarSign
} from 'lucide-react';

interface AccountSummaryCardProps {
  accountNumber: string;
  totalAmount: number;
  totalTransactions: number;
  status: string;
  account: string;
  isLoading?: boolean;
}

const AccountSummaryCard: React.FC<AccountSummaryCardProps> = ({
  accountNumber,
  totalAmount,
  totalTransactions,
  status,
  account,
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

  // Get account display name
  const getAccountName = (acc: string) => {
    switch (acc) {
      case 'doa6ps': return 'DOA6PS';
      case 'fwxeqk': return 'FWXEQK';
      case 'all': return 'All Accounts';
      default: return acc.toUpperCase();
    }
  };

  if (isLoading) {
    return (
      <Card className="mb-6 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border border-green-200/50 shadow-xl">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border border-green-200/50 shadow-xl hover:shadow-2xl transition-all duration-300">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-green-800 flex items-center gap-2">
          <div className="p-2 bg-green-100 rounded-lg">
            <TrendingUp className="h-5 w-5 text-green-600" />
          </div>
          Account Summary
          <Badge variant="outline" className="ml-auto bg-green-100 text-green-700 border-green-300">
            {status} Only
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          {/* Account Information */}
          <div className="flex items-center justify-between p-3 bg-white/80 rounded-lg border border-green-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CreditCard className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Account Number</p>
                <p className="font-mono text-lg font-semibold text-gray-900">{accountNumber}</p>
              </div>
            </div>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              {getAccountName(account)}
            </Badge>
          </div>

          {/* Summary Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Total Amount */}
            <div className="p-4 bg-gradient-to-br from-emerald-100 to-green-100 rounded-lg border border-emerald-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-200 rounded-lg">
                  <DollarSign className="h-5 w-5 text-emerald-700" />
                </div>
                <div>
                  <p className="text-sm font-medium text-emerald-700">Total Amount</p>
                  <p className="text-2xl font-bold text-emerald-900">
                    {formatCurrency(totalAmount)}
                  </p>
                </div>
              </div>
            </div>

            {/* Transaction Count */}
            <div className="p-4 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-lg border border-blue-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-200 rounded-lg">
                  <Hash className="h-5 w-5 text-blue-700" />
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-700">Transactions</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {formatNumber(totalTransactions)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Status Information */}
          <div className="flex items-center justify-center gap-2 p-3 bg-green-100/50 rounded-lg border border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">
              Showing only <strong>{status.toLowerCase()}</strong> transactions for this account
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AccountSummaryCard;
