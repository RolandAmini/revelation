// src/app/api/stats/route.ts
import { NextResponse } from "next/server";
import dbConnect from "@/app/api/db/connect"; // Import DB connection
import Inventory from "@/models/Inventory"; // Import Inventory Model
import Transaction from "@/models/Transaction"; // Import Transaction Model
import { InventoryStats } from "@/lib/types/inventory"; // For typing
import { calculateProfit } from "@/lib/utils"; // For calculation

// GET /api/stats - Calculate and return inventory statistics
export async function GET() {
  await dbConnect();
  try {
    const inventory = await Inventory.find({});
    const transactions = await Transaction.find({});

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

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    // Create a lookup for inventory items by ID for efficient profit calculation
    const inventoryLookup: Record<string, InventoryItem> = inventory.reduce(
      (acc, item) => {
        if (item.id) acc[item.id] = item.toObject(); // Use .toObject() to get a plain JS object
        return acc;
      },
      {}
    );

    transactions.forEach((transaction) => {
      const item = inventoryLookup[transaction.itemId];
      if (!item) return;

      const transactionDate = new Date(transaction.createdAt);
      const profitAmount = calculateProfit(
        transaction.type === "stock_out"
          ? transaction.unitPrice
          : item.sellPrice, // Use transaction's unitPrice for stock_out
        item.buyPrice, // Use item's current buy price
        transaction.quantity
      );

      if (transaction.type === "stock_out") {
        if (profitAmount > 0) {
          totalProfit += profitAmount;
          if (
            transactionDate.getMonth() === currentMonth &&
            transactionDate.getFullYear() === currentYear
          ) {
            monthlyProfit += profitAmount;
          }
        } else {
          // Profit is 0 or negative
          totalLoss += Math.abs(profitAmount);
          if (
            transactionDate.getMonth() === currentMonth &&
            transactionDate.getFullYear() === currentYear
          ) {
            monthlyLoss += Math.abs(profitAmount);
          }
        }
      }
    });

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
  } catch (error: any) {
    console.error("API Error calculating stats:", error);
    return NextResponse.json(
      { message: "Failed to fetch stats", error: error.message },
      { status: 500 }
    );
  }
}
