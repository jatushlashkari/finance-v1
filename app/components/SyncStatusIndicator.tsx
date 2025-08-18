'use client';

import React, { useState } from 'react';
import { Button } from './ui/button';
import { Zap } from 'lucide-react';

const SyncStatusIndicator: React.FC = () => {
  const [manualSyncing, setManualSyncing] = useState(false);

  const triggerManualSync = async () => {
    setManualSyncing(true);
    try {
      const response = await fetch('/api/sync', { method: 'POST' });
      const data = await response.json();
      
      if (data.success) {
        console.log('Manual sync completed:', data);
      }
    } catch (error) {
      console.error('Failed to trigger manual sync:', error);
    } finally {
      setManualSyncing(false);
    }
  };

  return (
    <div className="flex items-center space-x-2 md:space-x-3">
      {/* Mobile - With Text */}
      <div className="md:hidden flex items-center space-x-2">
        <div className="w-2 h-2 rounded-full bg-green-500"></div>
        <Button
          onClick={triggerManualSync}
          disabled={manualSyncing}
          size="sm"
          variant="outline"
          className="px-3 py-2 h-8"
          title="Manual Sync"
        >
          <Zap className={`w-4 h-4 ${manualSyncing ? 'animate-spin' : ''} mr-1.5`} />
          <span className="text-xs font-medium">
            {manualSyncing ? 'Syncing...' : 'Sync'}
          </span>
        </Button>
      </div>

      {/* Desktop - Full Layout */}
      <div className="hidden md:flex items-center space-x-3">
        {/* Status Indicator */}
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <span className="text-sm text-gray-600">Sync Ready</span>
        </div>
        
        {/* Sync Button */}
        <Button
          onClick={triggerManualSync}
          disabled={manualSyncing}
          size="sm"
          variant="outline"
          className="h-8 px-3"
        >
          <Zap className={`w-3 h-3 mr-1.5 ${manualSyncing ? 'animate-spin' : ''}`} />
          {manualSyncing ? 'Syncing...' : 'Sync'}
        </Button>
      </div>
    </div>
  );
};

export default SyncStatusIndicator;
