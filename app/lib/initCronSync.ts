// This file initializes the cron service with Next.js
// Import this in layout.tsx to start the background sync

import { getCronSyncService } from './cronService';

// Initialize the cron sync service in server environment only
let isInitialized = false;

export function initializeCronSync() {
  // Only run on server side and only once
  if (typeof window !== 'undefined' || isInitialized) return;
  
  try {
    const service = getCronSyncService();
    service.startCronJob();
    
    isInitialized = true;
    
    console.log('\n🚀 Finance Dashboard - Integrated Sync Started');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Next.js server is running with integrated cron sync');
    console.log('⏰ Auto-sync: Every 30 minutes');
    console.log('📊 Accounts: DOA6PS, FWXEQK');
    console.log('🗄️ Database: MongoDB Cloud');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
  } catch (error) {
    console.error('❌ Failed to initialize integrated cron sync:', error);
  }
}

// Auto-initialize when this module loads
initializeCronSync();
