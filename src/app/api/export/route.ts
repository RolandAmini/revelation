import { NextResponse } from "next/server";
import dbConnect from "@/app/api/db/connect";
import Inventory from "@/models/Inventory";
import Transaction from "@/models/Transaction";
import { InventoryItem, StockTransaction } from "@/lib/types/inventory";
export async function GET() {
  await dbConnect();
  try {
    const inventory = await Inventory.find({}).lean();
    const transactions = await Transaction.find({}).lean();
    const data: {
      inventory: InventoryItem[];
      transactions: StockTransaction[];
      exportDate: string;
    } = {
      inventory: inventory as InventoryItem[],
      transactions: transactions as StockTransaction[],
      exportDate: new Date().toISOString(),
    };

    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error("API Error exporting data:", error);

    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";

    return NextResponse.json(
      { message: "Failed to export data", error: errorMessage },
      { status: 500 }
    );
  }
}
