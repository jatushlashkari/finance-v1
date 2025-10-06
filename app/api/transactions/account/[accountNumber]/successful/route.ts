import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '../../../../../lib/mongodb';

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

    const db = await getDatabase();
    
    // Search in both collections for successful transactions only
    const collections = ['transactions_doa6ps', 'transactions_fwxeqk'];
    const allSuccessfulTransactions: Transaction[] = [];

    for (const collName of collections) {
      const collection = db.collection(collName);
      
      const transactions = await collection
        .find({ 
          accountNumber: accountNumber,
          status: 'Succeeded' // Only get successful transactions
        })
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

      allSuccessfulTransactions.push(...transformedTransactions);
    }

    // Sort all transactions by date descending
    allSuccessfulTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const total = allSuccessfulTransactions.length;
    const totalAmount = allSuccessfulTransactions.reduce((sum, t) => sum + t.amount, 0);

    return NextResponse.json({
      success: true,
      transactions: allSuccessfulTransactions,
      total,
      totalAmount,
      accountNumber
    });

  } catch (error) {
    console.error('Error fetching successful transactions:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch successful transactions',
        transactions: []
      },
      { status: 500 }
    );
  }
}
