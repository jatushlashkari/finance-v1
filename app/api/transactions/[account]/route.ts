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

    // Filter parameters
    const accountNumberFilter = searchParams.get('accountNumber');
    const statusFilter = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!['doa6ps', 'fwxeqk'].includes(account)) {
      return NextResponse.json(
        { error: 'Invalid account. Must be doa6ps or fwxeqk' },
        { status: 400 }
      );
    }

    const collection = await getCollection(account as 'doa6ps' | 'fwxeqk');

    // Build filter query
    const filterQuery: Record<string, unknown> = {};
    
    // Account number filter (partial match)
    if (accountNumberFilter) {
      filterQuery.accountNumber = { $regex: accountNumberFilter, $options: 'i' };
    }
    
    // Status filter
    if (statusFilter && statusFilter !== 'all') {
      filterQuery.status = statusFilter;
    }
    
    // Date range filter
    if (startDate || endDate) {
      const dateFilter: Record<string, string> = {};
      if (startDate) {
        dateFilter.$gte = startDate;
      }
      if (endDate) {
        // Add end of day to include the entire end date
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        dateFilter.$lte = endDateTime.toISOString();
      }
      filterQuery.date = dateFilter;
    }

    // Get total count with filters
    const total = await collection.countDocuments(filterQuery);

    // Get paginated transactions (sorted by date descending)
    const transactions = await collection
      .find(filterQuery)
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
