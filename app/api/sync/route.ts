import { NextResponse } from 'next/server';
import { getCronSyncService } from '../../lib/cronService';

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      message: 'Cron sync service is integrated with Next.js',
      status: 'running',
      schedule: 'Every 30 minutes',
      accounts: ['DOA6PS', 'FWXEQK'],
      mode: 'Integrated',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST() {
  try {
    const syncService = getCronSyncService();
    
    // Trigger manual sync
    await syncService.manualSync();
    
    return NextResponse.json({
      success: true,
      message: 'Manual sync completed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Manual sync failed',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
