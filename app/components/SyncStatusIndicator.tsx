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
    <>
      {/* Mobile - With Text (shown in mobile stats bar) */}
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

      {/* Desktop - Header Button (shown in header actions) */}
      <div className="hidden md:flex">
        <Button
          onClick={triggerManualSync}
          disabled={manualSyncing}
          size="sm"
          variant="outline"
          className="p-2 md:px-3"
          title="Manual Sync"
        >
          <Zap className={`w-4 h-4 ${manualSyncing ? 'animate-spin' : ''}`} />
          <span className="hidden md:inline ml-2">
            {manualSyncing ? 'Syncing...' : 'Sync'}
          </span>
        </Button>
      </div>
    </>
  );
};

export default SyncStatusIndicator;
