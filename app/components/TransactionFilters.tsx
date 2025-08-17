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
    <div className="space-y-3">
      <div>
        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide flex items-center gap-1.5 mb-1">
          <FilterIcon className="h-3 w-3" />
          Filters
        </label>
        <p className="text-xs text-slate-500 mb-3">Search & filter transactions</p>
      </div>
      
      <div className="space-y-3">
        {/* Account Number Search */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-600 flex items-center gap-1.5">
            <Search className="h-3 w-3 text-indigo-500" />
            Account Number
          </label>
          <Input
            placeholder="Search account..."
            value={filters.accountNumber}
            onChange={(e) => handleFilterChange('accountNumber', e.target.value)}
            className="h-8 text-xs bg-white border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all duration-200"
          />
        </div>

        {/* Status Filter */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-600 flex items-center gap-1.5">
            <FilterIcon className="h-3 w-3 text-emerald-500" />
            Status
          </label>
          <Select 
            value={filters.status} 
            onValueChange={(value: string) => handleFilterChange('status', value)}
          >
            <SelectTrigger className="h-8 text-xs bg-white border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all duration-200">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent className="bg-white border-slate-200 shadow-lg">
              <SelectItem value="all" className="text-xs hover:bg-slate-50">All Statuses</SelectItem>
              <SelectItem value="Succeeded" className="text-xs hover:bg-green-50">
                <div className="flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 bg-green-500 rounded-full"></div>
                  Succeeded
                </div>
              </SelectItem>
              <SelectItem value="Processing" className="text-xs hover:bg-yellow-50">
                <div className="flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 bg-yellow-500 rounded-full"></div>
                  Processing
                </div>
              </SelectItem>
              <SelectItem value="Failed" className="text-xs hover:bg-red-50">
                <div className="flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 bg-red-500 rounded-full"></div>
                  Failed
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Date Range - Compact */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600 flex items-center gap-1">
              <Calendar className="h-3 w-3 text-purple-500" />
              Start
            </label>
            <Input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="h-8 text-xs bg-white border-slate-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all duration-200"
            />
          </div>
          
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600 flex items-center gap-1">
              <Calendar className="h-3 w-3 text-rose-500" />
              End
            </label>
            <Input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="h-8 text-xs bg-white border-slate-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all duration-200"
            />
          </div>
        </div>
      </div>

      {/* Filter Actions */}
      <div className="bg-gradient-to-br from-slate-50 to-white rounded-lg p-3 border border-slate-200 space-y-2">
        <Button 
          onClick={onApplyFilters}
          disabled={isLoading}
          size="sm"
          className="w-full bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white font-medium transition-all duration-200"
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
            className="w-full border-slate-300 hover:bg-slate-100 text-slate-600 font-medium transition-all duration-200"
          >
            <X className="h-3.5 w-3.5 mr-1.5" />
            Clear
          </Button>
        )}

        {hasActiveFilters && (
          <div className="text-xs bg-indigo-50 border border-indigo-200 rounded px-2 py-1.5">
            <div className="text-indigo-700 font-medium">
              Active: {[
                filters.accountNumber && 'Account',
                filters.status && filters.status !== 'all' && 'Status',
                filters.startDate && 'Start',
                filters.endDate && 'End'
              ].filter(Boolean).join(', ')}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionFilters;
