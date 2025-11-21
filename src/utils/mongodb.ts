import mongoose from "mongoose";

let isConnected = false;

export async function connectDB() {
  
  const MONGODB_URI = process.env.MONGODB_URI;
  
  if (!MONGODB_URI) {
    throw new Error("⚠️ Please define the MONGODB_URI environment variable in .env or .env.local");
  }

  if (isConnected) return;

  try {
    await mongoose.connect(MONGODB_URI);
    isConnected = true;
    console.log("✅ MongoDB connecté");
  } catch (err) {
    console.error("❌ Erreur connexion MongoDB:", err);
    throw err;
  }
}
