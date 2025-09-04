// src/app/api/db/connect.ts
import mongoose from "mongoose";

// Ensure the MONGODB_URI environment variable is set
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    "Please define the MONGODB_URI environment variable inside .env.local"
  );
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = globalWithMongoose._mongoose;

if (!cached) {
  cached = globalWithMongoose._mongoose = { conn: null, promise: null };
}

// Extend the global object with a Mongoose cache
interface CustomNodeJsGlobal extends NodeJS.Global {
  _mongoose: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
}
declare const globalWithMongoose: CustomNodeJsGlobal;

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose
      .connect(MONGODB_URI!, opts)
      .then((mongoose) => {
        console.log("MongoDB connected successfully.");
        return mongoose;
      })
      .catch((err) => {
        console.error("MongoDB connection failed:", err);
        cached.promise = null; // Reset promise on failure
        throw err;
      });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

export default dbConnect;
