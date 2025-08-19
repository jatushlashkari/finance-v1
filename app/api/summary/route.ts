import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI!;
const client = new MongoClient(MONGODB_URI);

interface MatchStage {
  accountNumber: string;
  status: string;
  date?: {
    $gte?: string;
    $lte?: string;
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const account = searchParams.get('account') || 'all';
    const accountNumber = searchParams.get('accountNumber');
    const status = searchParams.get('status') || 'Succeeded'; // Default to successful transactions
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!accountNumber) {
      return NextResponse.json({
        success: false,
        error: 'Account number is required for summary'
      }, { status: 400 });
    }

    await client.connect();
    const db = client.db('financeV1');

    // Build the aggregation pipeline
    const matchStage: MatchStage = {
      accountNumber: accountNumber,
      status: status
    };

    // Add date filters if provided
    if (startDate || endDate) {
      matchStage.date = {};
      if (startDate) {
        matchStage.date.$gte = startDate;
      }
      if (endDate) {
        matchStage.date.$lte = endDate;
      }
    }

    let collections: string[] = [];
    if (account === 'all') {
      collections = ['transactions_doa6ps', 'transactions_fwxeqk'];
    } else {
      collections = [`transactions_${account}`];
    }

    let totalTransactions = 0;
    let totalAmount = 0;

    // Calculate summary from selected collections
    for (const collectionName of collections) {
      const collection = db.collection(collectionName);
      
      // Count transactions
      const count = await collection.countDocuments(matchStage);
      totalTransactions += count;

      // Sum actual amounts from transactions
      const amountResult = await collection.aggregate([
        { $match: matchStage },
        { 
          $group: { 
            _id: null, 
            totalAmount: { 
              $sum: "$amount"
            },
            count: { $sum: 1 },
            amounts: { $push: "$amount" } // Debug: collect all amounts
          } 
        }
      ]).toArray();

      if (amountResult.length > 0 && amountResult[0].totalAmount) {
        totalAmount += amountResult[0].totalAmount;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        accountNumber,
        status,
        totalAmount,
        totalTransactions,
        account,
        filters: {
          startDate,
          endDate
        }
      }
    });

  } catch (error) {
    console.error('Error fetching transaction summary:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch transaction summary'
    }, { status: 500 });
  } finally {
    await client.close();
  }
}
