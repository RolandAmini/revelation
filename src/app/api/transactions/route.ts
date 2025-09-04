// src/app/api/transactions/route.ts
import { NextResponse } from "next/server";
import dbConnect from "@/app/api/db/connect"; // Import DB connection
import Transaction from "@/models/Transaction"; // Import Transaction Model
import Inventory from "@/models/Inventory"; // Import Inventory Model to update stock levels
import { StockTransaction } from "@/lib/types/inventory"; // For typing

// GET /api/transactions - Fetch all transactions
export async function GET() {
  await dbConnect();
  try {
    const transactions = await Transaction.find({});
    return NextResponse.json(transactions);
  } catch (error: any) {
    console.error("API Error fetching transactions:", error);
    return NextResponse.json(
      { message: "Failed to fetch transactions", error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/transactions - Record a new transaction
export async function POST(req: Request) {
  await dbConnect();
  try {
    const transactionData: StockTransaction = await req.json();

    const newTransaction = await Transaction.create({
      ...transactionData,
      createdAt: new Date().toISOString(),
    });

    // Update inventory stock levels
    const item = await Inventory.findById(newTransaction.itemId);

    if (item) {
      let newStock = item.currentStock;
      switch (newTransaction.type) {
        case "stock_in":
          newStock += newTransaction.quantity;
          break;
        case "stock_out":
          newStock -= newTransaction.quantity;
          break;
        case "adjustment":
          newStock = newTransaction.quantity; // Adjustment sets absolute value
          break;
        case "transfer":
          // Transfers don't change overall stock in the global inventory model
          // If you had locations, this would move stock between them
          break;
      }
      item.currentStock = Math.max(0, newStock); // Ensure stock doesn't go below 0
      item.updatedAt = new Date().toISOString(); // Update item's timestamp
      await item.save(); // Save the updated item
    } else {
      console.warn(
        `Transaction recorded for unknown item ID: ${newTransaction.itemId}`
      );
      // Decide how to handle: throw error, or allow transaction but log warning
    }

    return NextResponse.json(newTransaction, { status: 201 });
  } catch (error: any) {
    console.error("API Error recording transaction:", error);
    return NextResponse.json(
      { message: "Failed to record transaction", error: error.message },
      { status: 500 }
    );
  }
}
