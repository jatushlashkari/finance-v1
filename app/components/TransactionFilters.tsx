'use client';

import React, { useState } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

import { Search, Filter as FilterIcon, X, ChevronDown, ChevronUp } from 'lucide-react';

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
  const [isExpanded, setIsExpanded] = useState(false);

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

  const activeFilterCount = [
    filters.accountNumber,
    filters.status && filters.status !== 'all' ? filters.status : null,
    filters.startDate,
    filters.endDate
  ].filter(Boolean).length;

  return (
    <Card className="border-0 shadow-sm bg-gray-50/50">
      <CardContent className="p-3 md:p-6">
        {/* Mobile Header - Compact */}
        <div className="md:hidden">
          <Button
            variant="ghost"
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-between p-2 h-auto hover:bg-gray-100 rounded-lg"
          >
            <div className="flex items-center space-x-2">
              <FilterIcon className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-900">Filters</span>
              {hasActiveFilters && (
                <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                  {activeFilterCount}
                </span>
              )}
            </div>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-gray-600" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-600" />
            )}
          </Button>
        </div>

        {/* Desktop Header */}
        <div className="hidden md:flex items-center space-x-3 mb-6">
          <FilterIcon className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-medium text-gray-900">Filter Transactions</h3>
          {hasActiveFilters && (
            <span className="bg-gray-900 text-white text-xs px-2 py-1 rounded-full font-medium">
              {activeFilterCount} active
            </span>
          )}
        </div>

        {/* Filter Controls */}
        <div className={`${isExpanded ? 'block' : 'hidden'} md:block`}>
          {/* Mobile Layout - Compact Grid */}
          <div className="md:hidden mt-3 space-y-3">
            {/* Search and Status - Compact Row */}
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
                <Input
                  placeholder="Account..."
                  value={filters.accountNumber}
                  onChange={(e) => handleFilterChange('accountNumber', e.target.value)}
                  className="pl-8 h-9 text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <Select 
                value={filters.status} 
                onValueChange={(value: string) => handleFilterChange('status', value)}
              >
                <SelectTrigger className="h-9 text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="Succeeded">Success</SelectItem>
                  <SelectItem value="Processing">Processing</SelectItem>
                  <SelectItem value="Failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Range - Compact */}
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="h-9 text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                placeholder="From"
              />
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="h-9 text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                placeholder="To"
              />
            </div>

            {/* Action Buttons - Compact */}
            <div className="flex gap-2">
              <Button 
                onClick={onApplyFilters}
                disabled={isLoading}
                size="sm"
                className="flex-1 h-9 bg-blue-600 hover:bg-blue-700 text-sm font-medium"
              >
                <FilterIcon className="h-3.5 w-3.5 mr-1.5" />
                {isLoading ? 'Applying...' : 'Apply'}
              </Button>
              
              {hasActiveFilters && (
                <Button 
                  onClick={onClearFilters}
                  variant="outline"
                  disabled={isLoading}
                  size="sm"
                  className="h-9 px-3 border-gray-300 hover:bg-gray-50 text-sm"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>

          {/* Desktop Layout - Horizontal Grid */}
          <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {/* Account Number Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Account Number</label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search account..."
                  value={filters.accountNumber}
                  onChange={(e) => handleFilterChange('accountNumber', e.target.value)}
                  className="pl-10 h-10 border-gray-300 focus:border-gray-900 focus:ring-gray-900"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Status</label>
              <Select 
                value={filters.status} 
                onValueChange={(value: string) => handleFilterChange('status', value)}
              >
                <SelectTrigger className="h-10 border-gray-300 focus:border-gray-900 focus:ring-gray-900">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Succeeded">Succeeded</SelectItem>
                  <SelectItem value="Processing">Processing</SelectItem>
                  <SelectItem value="Failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Start Date */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Start Date</label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="h-10 border-gray-300 focus:border-gray-900 focus:ring-gray-900"
              />
            </div>
            
            {/* End Date */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">End Date</label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="h-10 border-gray-300 focus:border-gray-900 focus:ring-gray-900"
              />
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 opacity-0">Actions</label>
              <div className="flex space-x-2">
                <Button 
                  onClick={onApplyFilters}
                  disabled={isLoading}
                  className="flex-1 h-10 bg-gray-900 hover:bg-gray-800"
                >
                  <FilterIcon className="h-4 w-4 mr-2" />
                  {isLoading ? 'Applying...' : 'Apply'}
                </Button>
                
                {hasActiveFilters && (
                  <Button 
                    onClick={onClearFilters}
                    variant="outline"
                    disabled={isLoading}
                    className="h-10 border-gray-300 hover:bg-gray-50"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TransactionFilters;
