'use client';

import React, { useState, useEffect } from 'react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { RefreshCw, Zap, Clock, Database } from 'lucide-react';

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
  const [loading, setLoading] = useState(false);
  const [manualSyncing, setManualSyncing] = useState(false);

  const checkSyncStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/sync');
      const data = await response.json();
      setSyncStatus(data);
    } catch (error) {
      console.error('Failed to check sync status:', error);
    } finally {
      setLoading(false);
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
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
          <Database className="h-3 w-3 mr-1" />
          Auto-Sync Active
        </Badge>
      </div>
      
      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
        <Clock className="h-3 w-3 mr-1" />
        {syncStatus.schedule}
      </Badge>

      <Button
        onClick={triggerManualSync}
        disabled={manualSyncing}
        size="sm"
        variant="outline"
        className="h-7 px-2 text-xs bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-700"
      >
        <Zap className={`h-3 w-3 mr-1 ${manualSyncing ? 'animate-spin' : ''}`} />
        {manualSyncing ? 'Syncing...' : 'Manual Sync'}
      </Button>

      <Button
        onClick={checkSyncStatus}
        disabled={loading}
        size="sm"
        variant="ghost"
        className="h-7 px-2 text-xs"
      >
        <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
      </Button>
    </div>
  );
};

export default SyncStatusIndicator;
