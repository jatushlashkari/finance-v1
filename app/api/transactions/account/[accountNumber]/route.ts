import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '../../../../lib/mongodb';

interface Transaction {
  id: string;
  date: string;
  successDate?: string;
  amount: number;
  withdrawId: string;
  utr?: string;
  accountNumber?: string;
  accountHolderName?: string;
  ifscCode?: string;
  status: 'Succeeded' | 'Failed' | 'Processing';
  source?: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ accountNumber: string }> }
) {
  try {
    const { accountNumber } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('size') || '10');
    const skip = (page - 1) * pageSize;

    const db = await getDatabase();
    
    // Search in both collections for the account number
    const collections = ['transactions_doa6ps', 'transactions_fwxeqk'];
    const allTransactions: Transaction[] = [];

    for (const collName of collections) {
      const collection = db.collection(collName);
      
      const transactions = await collection
        .find({ accountNumber: accountNumber })
        .sort({ date: -1 })
        .toArray();

      // Transform transactions to match our interface
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const transformedTransactions = transactions.map((t: any) => ({
        id: t._id.toString(),
        date: t.date,
        successDate: t.successDate,
        amount: t.amount || 0,
        withdrawId: t.withdrawId || '',
        utr: t.utr,
        accountNumber: t.accountNumber,
        accountHolderName: t.accountHolderName,
        ifscCode: t.ifscCode,
        status: t.status,
        source: collName.replace('transactions_', '')
      }));

      allTransactions.push(...transformedTransactions);
    }

    // Sort all transactions by date descending
    allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Apply pagination
    const total = allTransactions.length;
    const paginatedTransactions = allTransactions.slice(skip, skip + pageSize);
    const totalPages = Math.ceil(total / pageSize);
    const hasMore = page < totalPages;

    return NextResponse.json({
      success: true,
      transactions: paginatedTransactions,
      total,
      totalPages,
      currentPage: page,
      hasMore,
      accountNumber
    });

  } catch (error) {
    console.error('Error fetching account transactions:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch account transactions',
        transactions: []
      },
      { status: 500 }
    );
  }
}
