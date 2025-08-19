import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '../../../lib/mongodb';

interface AccountStats {
  accountHolderName: string;
  accountNumber: string;
  totalTransactions: number;
  successTransactions: number;
  failedTransactions: number;
  processingTransactions: number;
  totalAmount: number;
  lastTransactionDate: string;
  firstTransactionDate: string;
  isBookmarked: boolean;
}

export async function GET(_request: NextRequest) {
  try {
    const db = await getDatabase();
    
    // Get bookmarked account numbers
    const bookmarksCollection = db.collection('account_bookmarks');
    const bookmarks = await bookmarksCollection.find({}).toArray();
    const bookmarkedAccountNumbers = bookmarks.map(b => b.accountNumber);



    if (bookmarkedAccountNumbers.length === 0) {
      return NextResponse.json({
        success: true,
        accounts: [],
        count: 0
      });
    }

    // Get data from both account collections for bookmarked accounts only
    const accounts: AccountStats[] = [];
    const accountTypes = ['doa6ps', 'fwxeqk'];

    for (const accountType of accountTypes) {
      const collection = db.collection(`transactions_${accountType}`);
      
      // Aggregate pipeline to get account stats for bookmarked accounts
      const pipeline = [
        {
          $match: {
            accountNumber: { $in: bookmarkedAccountNumbers }
          }
        },
        {
          $group: {
            _id: {
              accountHolderName: "$accountHolderName",
              accountNumber: "$accountNumber"
            },
            totalTransactions: { $sum: 1 },
            successTransactions: {
              $sum: {
                $cond: [{ $eq: ["$status", "Succeeded"] }, 1, 0]
              }
            },
            failedTransactions: {
              $sum: {
                $cond: [{ $eq: ["$status", "Failed"] }, 1, 0]
              }
            },
            processingTransactions: {
              $sum: {
                $cond: [{ $eq: ["$status", "Processing"] }, 1, 0]
              }
            },
            totalAmount: { 
              $sum: { 
                $cond: [
                  { $eq: ["$status", "Succeeded"] }, 
                  { $ifNull: ["$amount", 0] }, 
                  0
                ]
              }
            },
            lastTransactionDate: { $max: "$date" },
            firstTransactionDate: { $min: "$date" }
          }
        },
        {
          $project: {
            _id: 0,
            accountHolderName: "$_id.accountHolderName",
            accountNumber: "$_id.accountNumber",
            totalTransactions: 1,
            successTransactions: 1,
            failedTransactions: 1,
            processingTransactions: 1,
            totalAmount: 1,
            lastTransactionDate: 1,
            firstTransactionDate: 1,
            isBookmarked: true,
            source: accountType
          }
        }
      ];

      const accountData = await collection.aggregate(pipeline).toArray();
      accounts.push(...(accountData as AccountStats[]));
    }

    // Merge duplicate accounts by account number (combine statistics from both collections)
    const uniqueAccounts = accounts.reduce((acc, current) => {
      const existing = acc.find(item => item.accountNumber === current.accountNumber);
      if (!existing) {
        // Ensure isBookmarked is always true for bookmarked accounts API
        acc.push({
          ...current,
          isBookmarked: true
        });
      } else {
        // Merge statistics from both collections
        const index = acc.findIndex(item => item.accountNumber === current.accountNumber);
        acc[index] = {
          ...existing,
          // Use the account holder name from the more recent record
          accountHolderName: new Date(current.lastTransactionDate) > new Date(existing.lastTransactionDate) 
            ? current.accountHolderName 
            : existing.accountHolderName,
          // Sum up all transaction counts
          totalTransactions: existing.totalTransactions + current.totalTransactions,
          successTransactions: existing.successTransactions + current.successTransactions,
          failedTransactions: existing.failedTransactions + current.failedTransactions,
          processingTransactions: existing.processingTransactions + current.processingTransactions,
          // Sum up total amounts
          totalAmount: existing.totalAmount + current.totalAmount,
          // Keep the most recent transaction date
          lastTransactionDate: new Date(current.lastTransactionDate) > new Date(existing.lastTransactionDate)
            ? current.lastTransactionDate
            : existing.lastTransactionDate,
          // Keep the earliest transaction date
          firstTransactionDate: new Date(current.firstTransactionDate) < new Date(existing.firstTransactionDate)
            ? current.firstTransactionDate
            : existing.firstTransactionDate,
          // Preserve bookmark status (should always be true for bookmarked accounts API)
          isBookmarked: true
        };
      }
      return acc;
    }, [] as AccountStats[]);

    // Filter out accounts with null or empty account holder names and sort by last transaction date
    const validAccounts = uniqueAccounts
      .filter((account: AccountStats) => 
        account.accountHolderName && 
        account.accountHolderName.trim() !== '' &&
        account.accountNumber &&
        account.accountNumber.trim() !== ''
      )
      .sort((a: AccountStats, b: AccountStats) => new Date(b.lastTransactionDate).getTime() - new Date(a.lastTransactionDate).getTime());

    return NextResponse.json({
      success: true,
      accounts: validAccounts,
      count: validAccounts.length
    });

  } catch (error) {
    console.error('Error fetching bookmarked accounts:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch bookmarked accounts',
        accounts: []
      },
      { status: 500 }
    );
  }
}
