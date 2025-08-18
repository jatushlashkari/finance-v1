// scripts/run-amount-update.ts
import TransactionAmountUpdater from './update-transaction-amounts';

async function runUpdate() {
  console.log('🚀 Starting Transaction Amount Update...');
  console.log('This script will fetch data from third-party APIs and update missing amounts in your database.\n');
  
  const updater = new TransactionAmountUpdater();
  await updater.updateAllAccounts();
}

runUpdate().catch(console.error);
