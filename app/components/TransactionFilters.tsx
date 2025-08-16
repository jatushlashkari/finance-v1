'use client';

import React from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Card, CardContent } from './ui/card';
import { Search, Calendar, Filter as FilterIcon, X } from 'lucide-react';

interface FilterProps {
  filters: {
    accountNumber: string;
    status: string;
    startDate: string;
    endDate: string;
  };
  onFiltersChange: (filters: {
    accountNumber: string;
    status: string;
    startDate: string;
    endDate: string;
  }) => void;
  onApplyFilters: () => void;
  onClearFilters: () => void;
  isLoading: boolean;
}

const TransactionFilters: React.FC<FilterProps> = ({
  filters,
  onFiltersChange,
  onApplyFilters,
  onClearFilters,
  isLoading
}) => {
  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const hasActiveFilters = 
    filters.accountNumber || 
    (filters.status && filters.status !== 'all') || 
    filters.startDate || 
    filters.endDate;

  return (
    <Card className="mb-6 bg-gradient-to-br from-white/90 via-white/85 to-white/80 backdrop-blur-lg border border-white/30 shadow-xl">
      <CardContent className="p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-2">
            <FilterIcon className="h-5 w-5 text-blue-600" />
            Filter Transactions
          </h2>
          <p className="text-sm text-gray-600">Use filters to narrow down your search results</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {/* Account Number Search */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <div className="p-1 bg-blue-100 rounded-md">
                <Search className="h-3 w-3 text-blue-600" />
              </div>
              Account Number
            </label>
            <Input
              placeholder="Search account number..."
              value={filters.accountNumber}
              onChange={(e) => handleFilterChange('accountNumber', e.target.value)}
              className="bg-white border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 shadow-sm transition-all duration-200 hover:shadow-md"
            />
          </div>

          {/* Status Filter */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <div className="p-1 bg-green-100 rounded-md">
                <FilterIcon className="h-3 w-3 text-green-600" />
              </div>
              Status
            </label>
            <Select 
              value={filters.status} 
              onValueChange={(value: string) => handleFilterChange('status', value)}
            >
              <SelectTrigger className="bg-white border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 shadow-sm transition-all duration-200 hover:shadow-md">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-200 shadow-lg">
                <SelectItem value="all" className="hover:bg-gray-50">All Statuses</SelectItem>
                <SelectItem value="Succeeded" className="hover:bg-green-50">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    Succeeded
                  </div>
                </SelectItem>
                <SelectItem value="Processing" className="hover:bg-yellow-50">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-yellow-500 rounded-full"></div>
                    Processing
                  </div>
                </SelectItem>
                <SelectItem value="Failed" className="hover:bg-red-50">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-red-500 rounded-full"></div>
                    Failed
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Start Date */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <div className="p-1 bg-purple-100 rounded-md">
                <Calendar className="h-3 w-3 text-purple-600" />
              </div>
              Start Date
            </label>
            <Input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="bg-white border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 shadow-sm transition-all duration-200 hover:shadow-md"
            />
          </div>

          {/* End Date */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <div className="p-1 bg-orange-100 rounded-md">
                <Calendar className="h-3 w-3 text-orange-600" />
              </div>
              End Date
            </label>
            <Input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="bg-white border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 shadow-sm transition-all duration-200 hover:shadow-md"
            />
          </div>
        </div>

        {/* Filter Actions */}
        <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <Button 
                onClick={onApplyFilters}
                disabled={isLoading}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              >
                <FilterIcon className="h-4 w-4 mr-2" />
                {isLoading ? 'Applying...' : 'Apply Filters'}
              </Button>
              
              {hasActiveFilters && (
                <Button 
                  onClick={onClearFilters}
                  variant="outline"
                  disabled={isLoading}
                  className="border-gray-300 hover:bg-gray-100 hover:border-gray-400 text-gray-700 shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              )}
            </div>

            {hasActiveFilters && (
              <div className="flex items-center gap-2 text-sm">
                <div className="px-3 py-1.5 bg-white rounded-lg border border-gray-200 shadow-sm">
                  <span className="text-gray-600 font-medium">Active filters:</span>
                  <span className="text-blue-600 font-semibold ml-1">
                    {[
                      filters.accountNumber && 'Account Number',
                      filters.status && filters.status !== 'all' && 'Status',
                      filters.startDate && 'Start Date',
                      filters.endDate && 'End Date'
                    ].filter(Boolean).join(', ')}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TransactionFilters;
