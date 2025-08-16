import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '../../../lib/mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ account: string }> }
) {
  try {
    const { account } = await params;

    if (!['doa6ps', 'fwxeqk'].includes(account)) {
      return NextResponse.json(
        { error: 'Invalid account. Must be doa6ps or fwxeqk' },
        { status: 400 }
      );
    }

    const collection = await getCollection(account as 'doa6ps' | 'fwxeqk');

    const [total, succeeded, processing, failed] = await Promise.all([
      collection.countDocuments(),
      collection.countDocuments({ statusCode: 4 }),
      collection.countDocuments({ statusCode: 2 }),
      collection.countDocuments({ statusCode: { $nin: [2, 4] } })
    ]);

    return NextResponse.json({ total, succeeded, processing, failed });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
