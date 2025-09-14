// src/app/api/import/route.ts
import { NextResponse } from "next/server";
import dbConnect from "@/app/api/db/connect";
import Inventory from "@/models/Inventory";
import Transaction from "@/models/Transaction";
import { InventoryItem, StockTransaction } from "@/lib/types/inventory";

interface ImportData {
  inventory: InventoryItem[];
  transactions: StockTransaction[];
}

export async function POST(req: Request) {
  await dbConnect();
  try {
    const { inventory, transactions } = (await req.json()) as ImportData;

    if (!Array.isArray(inventory) || !Array.isArray(transactions)) {
      return NextResponse.json(
        { message: "Invalid import data format" },
        { status: 400 }
      );
    }
    await Inventory.deleteMany({});
    await Transaction.deleteMany({});
    await Inventory.insertMany(
      inventory.map((item) => ({
        ...item,
        _id: item.id, // Mongoose will use this as _id
        createdAt: item.createdAt || new Date().toISOString(),
        updatedAt: item.updatedAt || new Date().toISOString(),
      }))
    );

    await Transaction.insertMany(
      transactions.map((transaction) => ({
        ...transaction,
        _id: transaction.id,
        createdAt: transaction.createdAt || new Date().toISOString(),
      }))
    );

    // Use NextResponse for consistent API responses
    return NextResponse.json(
      { message: "Data imported successfully" },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("API Error importing data:", error);

    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";

    return NextResponse.json(
      { message: "Failed to import data", error: errorMessage },
      { status: 500 }
    );
  }
}
