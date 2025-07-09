import {
  Collection,
  Db,
  Document,
  MongoClient,
  MongoClientOptions,
} from "mongodb";
import { logger } from "../logger";

// Connection URL
let client: MongoClient;
let database: Db;

export async function setupDB(
  url: string,
  dbName: string
): Promise<[MongoClient, Db]> {
  // Lấy maxPoolSize từ biến môi trường hoặc mặc định 50
  const maxPoolSize = parseInt(process.env.MONGO_MAX_POOL_SIZE || "50", 10);
  const options: MongoClientOptions = {
    maxPoolSize,
    // Có thể thêm các option khác nếu cần
  };
  client = new MongoClient(url, options);

  await client.connect();

  logger.info(`MongoDB connector connected! (maxPoolSize=${maxPoolSize})`);
  database = client.db(dbName);

  return [client, database];
}

async function collectionExists(
  db: Db,
  collectionName: string
): Promise<boolean> {
  const collections = await db
    .listCollections({ name: collectionName })
    .toArray();
  return collections.length > 0;
}

export async function ensureCollection(
  db: Db,
  collectionName: string
): Promise<void> {
  if (!(await collectionExists(db, collectionName))) {
    await db.createCollection(collectionName);
  }
}

export function getCollection<T extends Document>(
  collectionName: string
): Collection<T> {
  if (database == undefined) {
    throw new Error(`MongoDB database instance doesn't exist`);
  }

  return database.collection(collectionName);
}

export async function indexExists(
  collection: Collection<any>,
  indexName: string
): Promise<boolean> {
  const existingIndexes = await collection.indexes();
  return existingIndexes.some((index) => index.name === indexName);
}

export async function ensureIndex(
  collection: Collection<any>,
  fields: any,
  options: any,
  indexName: string
) {
  if (!(await indexExists(collection, indexName))) {
    await collection.createIndex(fields, options);
  }
}
