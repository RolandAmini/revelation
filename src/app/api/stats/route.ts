import { NextResponse } from "next/server";
import dbConnect from "@/app/api/db/connect";
import Inventory from "@/models/Inventory";
import Transaction from "@/models/Transaction";
import {
  InventoryStats,
  InventoryItem,
  StockTransaction,
} from "@/lib/types/inventory";

interface InventoryDocument extends Omit<InventoryItem, "id"> {
  _id: { toString: () => string };
}

export async function GET() {
  await dbConnect();
  try {
    const inventoryDocs = await Inventory.find({}).lean();
    const transactions = (await Transaction.find({
      type: "stock_out",
    }).lean()) as StockTransaction[];

    const inventory: InventoryItem[] = (
      inventoryDocs as InventoryDocument[]
    ).map((doc) => ({
      id: doc._id.toString(),
      ...doc,
    }));

    const totalItems = inventory.length;
    const totalValue = inventory.reduce(
      (sum, item) => sum + item.currentStock * item.buyPrice,
      0
    );
    const lowStockItems = inventory.filter(
      (item) => item.currentStock > 0 && item.currentStock <= item.minStockLevel
    ).length;
    const outOfStockItems = inventory.filter(
      (item) => item.currentStock === 0
    ).length;

    let totalProfit = 0;
    let totalLoss = 0;
    let monthlyProfit = 0;
    let monthlyLoss = 0;

    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    const inventoryLookup = new Map(inventory.map((item) => [item.id, item]));

    for (const transaction of transactions) {
      const item = inventoryLookup.get(transaction.itemId);
      if (!item) {
        continue;
      }

      const profitAmount =
        (transaction.unitPrice - item.buyPrice) * transaction.quantity;

      const transactionDate = new Date(transaction.createdAt);
      const isThisMonth =
        transactionDate.getMonth() === currentMonth &&
        transactionDate.getFullYear() === currentYear;

      if (profitAmount > 0) {
        totalProfit += profitAmount;
        if (isThisMonth) {
          monthlyProfit += profitAmount;
        }
      } else {
        totalLoss += Math.abs(profitAmount);
        if (isThisMonth) {
          monthlyLoss += Math.abs(profitAmount);
        }
      }
    }

    const stats: InventoryStats = {
      totalItems,
      totalValue,
      lowStockItems,
      outOfStockItems,
      totalProfit,
      totalLoss,
      monthlyProfit,
      monthlyLoss,
    };

    return NextResponse.json(stats);
  } catch (error: unknown) {
    console.error("API Error calculating stats:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json(
      { message: "Failed to fetch stats", error: errorMessage },
      { status: 500 }
    );
  }
}
