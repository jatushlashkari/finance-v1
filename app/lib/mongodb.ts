import { MongoClient, Db, Collection } from 'mongodb';

interface MongoTransaction {
  _id?: string | object;
  id?: string;
  withdrawId: string;
  date: string;
  accountHolderName?: string;
  accountNumber?: string;
  ifscCode?: string;
  utr?: string;
  status: string;
  statusCode?: number;
  successDate?: string;
  account?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your MongoDB URI to .env.local');
}

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so the connection
  // is not created multiple times during hot reloads
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(process.env.MONGODB_URI);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production mode, create a new client
  client = new MongoClient(process.env.MONGODB_URI);
  clientPromise = client.connect();
}

export async function getDatabase(): Promise<Db> {
  const client = await clientPromise;
  return client.db('financeV1');
}

export async function getCollection(account: 'doa6ps' | 'fwxeqk'): Promise<Collection<MongoTransaction>> {
  const db = await getDatabase();
  return db.collection<MongoTransaction>(`transactions_${account}`);
}

export function transformTransaction(doc: MongoTransaction) {
  return {
    id: doc.id || doc._id?.toString(),
    withdrawId: doc.withdrawId,
    date: doc.date,
    successDate: doc.successDate,
    amount: 0, // Default amount since we don't have this in our schema
    accountHolderName: doc.accountHolderName,
    accountNumber: doc.accountNumber,
    ifscCode: doc.ifscCode,
    utr: doc.utr,
    status: doc.status
  };
}

export default clientPromise;
