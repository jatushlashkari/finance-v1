import { NextRequest, NextResponse } from 'next/server';
import { getCollection, transformTransaction } from '../../../lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('size') || '15');
    const skip = (page - 1) * pageSize;

    // Filter parameters
    const accountNumberFilter = searchParams.get('accountNumber');
    const statusFilter = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Get both collections
    const doa6psCollection = await getCollection('doa6ps');
    const fwxeqkCollection = await getCollection('fwxeqk');

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

    // Get total count from both collections
    const [doa6psTotal, fwxeqkTotal] = await Promise.all([
      doa6psCollection.countDocuments(filterQuery),
      fwxeqkCollection.countDocuments(filterQuery)
    ]);
    const total = doa6psTotal + fwxeqkTotal;

    // Get transactions from both collections and merge them
    const [doa6psTransactions, fwxeqkTransactions] = await Promise.all([
      doa6psCollection
        .find(filterQuery)
        .sort({ date: -1 })
        .toArray(),
      fwxeqkCollection
        .find(filterQuery)  
        .sort({ date: -1 })
        .toArray()
    ]);

    // Merge and sort all transactions by date (most recent first)
    const allTransactions = [
      ...doa6psTransactions.map(doc => ({ ...transformTransaction(doc), source: 'doa6ps' })),
      ...fwxeqkTransactions.map(doc => ({ ...transformTransaction(doc), source: 'fwxeqk' }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Apply pagination to the merged results
    const paginatedTransactions = allTransactions.slice(skip, skip + pageSize);

    const totalPages = Math.ceil(total / pageSize);
    const hasMore = page < totalPages;

    return NextResponse.json({
      transactions: paginatedTransactions,
      total,
      totalPages,
      currentPage: page,
      hasMore
    });
  } catch (error) {
    console.error('Error fetching all transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}
