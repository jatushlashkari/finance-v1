const { MongoClient } = require('mongodb');

async function checkBookmarks() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    const db = client.db('finance_dashboard');
    
    console.log('=== CURRENT BOOKMARKS ===');
    const bookmarks = await db.collection('account_bookmarks').find({}).toArray();
    console.log('Total bookmarks:', bookmarks.length);
    bookmarks.forEach((bookmark, index) => {
      console.log(`${index + 1}. Account: "${bookmark.accountNumber}" | Name: "${bookmark.accountHolderName}"`);
    });
    
    console.log('\n=== CHECKING DAS CHETAN IN TRANSACTIONS ===');
    const collections = ['transactions_doa6ps', 'transactions_fwxeqk'];
    
    for (const collName of collections) {
      const results = await db.collection(collName).find({
        accountHolderName: { $regex: /Das Chetan/i }
      }).limit(2).toArray();
      
      if (results.length > 0) {
        console.log(`Found ${results.length} records in ${collName}:`);
        results.forEach(record => {
          console.log(`  Account Number: "${record.accountNumber}"`);
          console.log(`  Account Name: "${record.accountHolderName}"`);
        });
      } else {
        console.log(`No Das Chetan records found in ${collName}`);
      }
    }
    
    // Check if Das Chetan is bookmarked
    const dasChetanBookmark = await db.collection('account_bookmarks').findOne({
      accountNumber: "43182634621"
    });
    
    console.log('\n=== DAS CHETAN BOOKMARK STATUS ===');
    if (dasChetanBookmark) {
      console.log('✅ Das Chetan IS BOOKMARKED:', dasChetanBookmark);
    } else {
      console.log('❌ Das Chetan is NOT bookmarked');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

checkBookmarks();
