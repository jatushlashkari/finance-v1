import { NextRequest, NextResponse } from 'next/server';
import { getCronSyncService } from '../../../lib/cronService';

// This API route will be called by Vercel's cron system
export async function GET(request: NextRequest) {
  try {
    // Verify the request is from Vercel's cron system
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🚀 Vercel Cron: Starting scheduled sync...');
    
    const syncService = getCronSyncService();
    await syncService.manualSync();
    
    return NextResponse.json({
      success: true,
      message: 'Vercel cron sync completed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Vercel Cron: Sync failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Sync failed',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Also support POST for manual triggering
export async function POST(request: NextRequest) {
  return GET(request);
}
