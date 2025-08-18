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

import { Search, Filter as FilterIcon, X } from 'lucide-react';

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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
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
  );
};

export default TransactionFilters;
