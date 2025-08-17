'use client';

import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Zap, Clock } from 'lucide-react';

interface SyncStatus {
  success: boolean;
  message: string;
  status: string;
  schedule: string;
  accounts: string[];
  mode: string;
  timestamp: string;
}

const SyncStatusIndicator: React.FC = () => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [manualSyncing, setManualSyncing] = useState(false);

  const checkSyncStatus = async () => {
    try {
      const response = await fetch('/api/sync');
      const data = await response.json();
      
      // Check if we're on Vercel and enhance the status
      if (typeof window !== 'undefined') {
        const isVercel = window.location.hostname.includes('vercel.app') || 
                        window.location.hostname.includes('.vercel.app');
        
        if (isVercel && data.success) {
          data.mode = 'Vercel Serverless Cron';
          data.message = 'Vercel cron system is managing sync schedule';
        }
      }
      
      setSyncStatus(data);
    } catch (error) {
      console.error('Failed to check sync status:', error);
    }
  };

  const triggerManualSync = async () => {
    setManualSyncing(true);
    try {
      const response = await fetch('/api/sync', { method: 'POST' });
      const data = await response.json();
      
      if (data.success) {
        // Refresh status after manual sync
        await checkSyncStatus();
      }
    } catch (error) {
      console.error('Failed to trigger manual sync:', error);
    } finally {
      setManualSyncing(false);
    }
  };

  useEffect(() => {
    checkSyncStatus();
    // Check status every 30 seconds
    const interval = setInterval(checkSyncStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!syncStatus) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-gray-400 animate-pulse"></div>
        <span className="text-sm text-muted-foreground">Checking sync...</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Status Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-xs font-medium text-white/90">Auto-Sync Active</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-white/70">
          <Clock className="h-3 w-3" />
          <span>{syncStatus.schedule}</span>
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
