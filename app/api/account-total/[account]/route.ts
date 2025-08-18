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

    // Get aggregated data for all transaction statuses
    const [succeededResult, totalCount, , failedCount] = await Promise.all([
      // Get total amount from succeeded transactions
      collection.aggregate([
        {
          $match: {
            statusCode: 4 // Only succeeded transactions
          }
        },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        }
      ]).toArray(),
      
      // Get total transaction count (all statuses)
      collection.countDocuments(),
      
      // Get succeeded transaction count
      collection.countDocuments({ statusCode: 4 }),
      
      // Get failed transaction count (anything that's not succeeded or processing)
      collection.countDocuments({ statusCode: { $nin: [2, 4] } })
    ]);

    const succeededSummary = succeededResult[0] || { totalAmount: 0, count: 0 };

    return NextResponse.json({
      totalAmount: succeededSummary.totalAmount,
      totalTransactions: totalCount,
      succeededTransactions: succeededSummary.count,
      failedTransactions: failedCount,
      account: account
    });
  } catch (error) {
    console.error('Error fetching account total:', error);
    return NextResponse.json(
      { error: 'Failed to fetch account total' },
      { status: 500 }
    );
  }
}
