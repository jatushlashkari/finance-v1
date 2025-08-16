import { NextRequest, NextResponse } from 'next/server';
import { getCollection, transformTransaction } from '../../../lib/mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ account: string }> }
) {
  try {
    const { account } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('size') || '15');
    const skip = (page - 1) * pageSize;

    if (!['doa6ps', 'fwxeqk'].includes(account)) {
      return NextResponse.json(
        { error: 'Invalid account. Must be doa6ps or fwxeqk' },
        { status: 400 }
      );
    }

    const collection = await getCollection(account as 'doa6ps' | 'fwxeqk');

    // Get total count
    const total = await collection.countDocuments();

    // Get paginated transactions (sorted by date descending)
    const transactions = await collection
      .find({})
      .sort({ date: -1 })
      .skip(skip)
      .limit(pageSize)
      .toArray();

    const totalPages = Math.ceil(total / pageSize);
    const hasMore = page < totalPages;

    return NextResponse.json({
      transactions: transactions.map(transformTransaction),
      total,
      totalPages,
      currentPage: page,
      hasMore
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}
