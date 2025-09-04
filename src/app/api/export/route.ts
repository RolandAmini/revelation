// src/app/api/export/route.ts
import { NextResponse } from "next/server";
import dbConnect from "@/app/api/db/connect";
import Inventory from "@/models/Inventory";
import Transaction from "@/models/Transaction";
import { InventoryItem, StockTransaction } from "@/lib/types/inventory";

// GET /api/export - Export all inventory and transaction data
export async function GET() {
  await dbConnect();
  try {
    const inventory = await Inventory.find({}).lean(); // .lean() for plain JS objects
    const transactions = await Transaction.find({}).lean(); // .lean() for plain JS objects

    const data: {
      inventory: InventoryItem[];
      transactions: StockTransaction[];
      exportDate: string;
    } = {
      inventory: inventory as InventoryItem[], // Cast to match frontend type
      transactions: transactions as StockTransaction[], // Cast to match frontend type
      exportDate: new Date().toISOString(),
    };

    // Return JSON data. Frontend will handle the download.
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("API Error exporting data:", error);
    return NextResponse.json(
      { message: "Failed to export data", error: error.message },
      { status: 500 }
    );
  }
}
