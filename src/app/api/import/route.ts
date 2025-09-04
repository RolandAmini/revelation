// src/app/api/import/route.ts
import { NextResponse } from "next/server";
import dbConnect from "@/app/api/db/connect";
import Inventory from "@/models/Inventory";
import Transaction from "@/models/Transaction";
import { InventoryItem, StockTransaction } from "@/lib/types/inventory";

// POST /api/import - Import inventory and transaction data
export async function POST(req: Request) {
  await dbConnect();
  try {
    const { inventory, transactions } = await req.json();

    if (!Array.isArray(inventory) || !Array.isArray(transactions)) {
      return NextResponse.json(
        { message: "Invalid import data format" },
        { status: 400 }
      );
    }

    // Clear existing data (use with caution in production!)
    await Inventory.deleteMany({});
    await Transaction.deleteMany({});

    // Insert new data
    // Ensure IDs are retained or new ones generated based on import strategy
    const importedInventory = await Inventory.insertMany(
      inventory.map((item) => ({
        ...item,
        _id: item.id, // Mongoose will use this as _id
        createdAt: item.createdAt || new Date().toISOString(),
        updatedAt: item.updatedAt || new Date().toISOString(),
      }))
    );

    const importedTransactions = await Transaction.insertMany(
      transactions.map((transaction) => ({
        ...transaction,
        _id: transaction.id, // Mongoose will use this as _id
        createdAt: transaction.createdAt || new Date().toISOString(),
      }))
    );

    return new Response(null, { status: 200 }); // OK, data imported
  } catch (error: any) {
    console.error("API Error importing data:", error);
    return NextResponse.json(
      { message: "Failed to import data", error: error.message },
      { status: 500 }
    );
  }
}
