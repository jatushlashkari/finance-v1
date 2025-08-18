// scripts/test-connection.ts
import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env' });

async function testConnection() {
  console.log('🔄 Testing MongoDB connection...');
  
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI environment variable is not set');
    console.log('Please make sure you have a .env.local file with your MongoDB connection string');
    return;
  }

  try {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    
    const db = client.db('financeV1');
    
    // Test both collections
    const doa6psCollection = db.collection('transactions_doa6ps');
    const fwxeqkCollection = db.collection('transactions_fwxeqk');
    
    const doa6psCount = await doa6psCollection.countDocuments();
    const fwxeqkCount = await fwxeqkCollection.countDocuments();
    
    console.log('✅ MongoDB connection successful!');
    console.log(`📊 DOA6PS transactions: ${doa6psCount}`);
    console.log(`📊 FWXEQK transactions: ${fwxeqkCount}`);
    
    // Check for transactions with missing amounts
    const doa6psMissing = await doa6psCollection.countDocuments({
      $or: [
        { amount: { $exists: false } },
        { amount: 0 },
        { amount: { $eq: null } }
      ]
    });
    
    const fwxeqkMissing = await fwxeqkCollection.countDocuments({
      $or: [
        { amount: { $exists: false } },
        { amount: 0 },
        { amount: { $eq: null } }
      ]
    });
    
    console.log(`🔍 DOA6PS missing amounts: ${doa6psMissing}`);
    console.log(`🔍 FWXEQK missing amounts: ${fwxeqkMissing}`);
    console.log(`📝 Total transactions needing amount updates: ${doa6psMissing + fwxeqkMissing}`);
    
    if (doa6psMissing + fwxeqkMissing > 0) {
      console.log('\n✨ You can run the amount updater with: npm run update-amounts');
    } else {
      console.log('\n✅ All transactions already have amounts!');
    }
    
    await client.close();
    
  } catch (error) {
    console.error('❌ Connection test failed:', error);
  }
}

testConnection();
