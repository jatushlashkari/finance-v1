import { NextResponse } from 'next/server';
import { getCronSyncService } from '../../lib/cronService';

export async function GET() {
  try {
    const isVercel = process.env.VERCEL === '1';
    
    return NextResponse.json({
      success: true,
      message: isVercel 
        ? 'Sync is managed by Vercel Cron system' 
        : 'Cron sync service is integrated with Next.js',
      status: 'running',
      schedule: 'Daily at 1 AM IST',
      accounts: ['DOA6PS', 'FWXEQK'],
      mode: isVercel ? 'Vercel Serverless Cron' : 'Integrated',
      platform: isVercel ? 'Vercel' : 'Self-hosted',
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
