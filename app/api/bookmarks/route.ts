import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '../../lib/mongodb';
import { ObjectId } from 'mongodb';

interface Bookmark {
  _id?: ObjectId;
  accountNumber: string;
  accountHolderName: string;
  createdAt: Date;
  updatedAt: Date;
}

// GET - Get all bookmarked accounts
export async function GET(_request: NextRequest) {
  try {
    const db = await getDatabase();
    const bookmarksCollection = db.collection('account_bookmarks');
    
    const bookmarks = await bookmarksCollection
      .find({})
      .sort({ updatedAt: -1 })
      .toArray();

    return NextResponse.json({
      success: true,
      bookmarks: bookmarks,
      count: bookmarks.length
    });

  } catch (error) {
    console.error('Error fetching bookmarks:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch bookmarks',
        bookmarks: []
      },
      { status: 500 }
    );
  }
}

// POST - Add a bookmark
export async function POST(request: NextRequest) {
  try {
    const { accountNumber, accountHolderName } = await request.json();

    if (!accountNumber || !accountHolderName) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Account number and holder name are required' 
        },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const bookmarksCollection = db.collection('account_bookmarks');
    
    // Check if bookmark already exists
    const existingBookmark = await bookmarksCollection.findOne({ accountNumber });
    
    if (existingBookmark) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Account is already bookmarked' 
        },
        { status: 409 }
      );
    }

    const bookmark: Bookmark = {
      accountNumber,
      accountHolderName,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await bookmarksCollection.insertOne(bookmark);

    return NextResponse.json({
      success: true,
      bookmark: { ...bookmark, _id: result.insertedId },
      message: 'Account bookmarked successfully'
    });

  } catch (error) {
    console.error('Error adding bookmark:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to add bookmark' 
      },
      { status: 500 }
    );
  }
}

// DELETE - Remove a bookmark
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const accountNumber = searchParams.get('accountNumber');

    if (!accountNumber) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Account number is required' 
        },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const bookmarksCollection = db.collection('account_bookmarks');
    
    const result = await bookmarksCollection.deleteOne({ accountNumber });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Bookmark not found' 
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Bookmark removed successfully'
    });

  } catch (error) {
    console.error('Error removing bookmark:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to remove bookmark' 
      },
      { status: 500 }
    );
  }
}
