'use client';

import React, { useState } from 'react';
import { Button } from './ui/button';
import { Zap, Clock } from 'lucide-react';

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
    <div className="space-y-2">
      {/* Status Row - Static display */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-gray-400"></div>
          <span className="text-xs font-medium text-white/90">Manual Sync Only</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-white/70">
          <Clock className="h-3 w-3" />
          <span>On-demand</span>
        </div>
      </div>
      
      {/* Action Button */}
      <Button
        onClick={triggerManualSync}
        disabled={manualSyncing}
        size="sm"
        variant="ghost"
        className="w-full h-7 text-xs text-white/90 hover:bg-white/10 border border-white/20 transition-all duration-200"
      >
        <Zap className={`h-3 w-3 mr-1.5 ${manualSyncing ? 'animate-spin' : ''}`} />
        {manualSyncing ? 'Syncing...' : 'Manual Sync'}
      </Button>
    </div>
  );
};

export default SyncStatusIndicator;
