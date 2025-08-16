import { NextResponse } from 'next/server';
import { getDatabase } from '../../lib/mongodb';

export async function GET() {
  try {
    const db = await getDatabase();
    const admin = db.admin();
    await admin.ping();
    
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: 'Database connection failed'
      },
      { status: 500 }
    );
  }
}
