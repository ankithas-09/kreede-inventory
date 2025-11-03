// lib/db.ts
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable");
}

// We'll cache connections per DB name
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: {}, promise: {} };
}

type DbConnectOpts = {
  dbName?: string;
};

export async function dbConnect(opts?: DbConnectOpts) {
  const dbName = opts?.dbName || process.env.MONGODB_DB || "kreede-inventory";

  // if we already have a connection for this db, return it
  if (cached.conn[dbName]) {
    return cached.conn[dbName];
  }

  // if we don't have a promise for this db, create one
  if (!cached.promise[dbName]) {
    cached.promise[dbName] = mongoose
      .connect(MONGODB_URI, {
        dbName,
      })
      .then((mongoose) => mongoose);
  }

  // wait for connection
  cached.conn[dbName] = await cached.promise[dbName];
  return cached.conn[dbName];
}
