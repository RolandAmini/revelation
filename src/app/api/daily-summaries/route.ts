// src/app/api/daily-summaries/route.ts
import { NextResponse } from "next/server";
import dbConnect from "@/app/api/db/connect";
import Inventory from "@/models/Inventory";
import Transaction from "@/models/Transaction";
import DailySummary from "@/models/DailySummary"; // Import DailySummary model
import { InventoryItem } from "@/lib/types/inventory";
import { formatDate } from "@/lib/utils"; // Assuming formatDate is in lib/utils

// Re-defining DailySummary interface for clarity in this file's context
interface IDailySummary {
  date: string;
  totalTransactionsCount: number;
  totalMoneyIn: number;
  totalMoneyOut: number;
  netFlow: number;
  grossProfitFromSales: number;
  lossFromBelowCostSales: number;
}

// GET /api/daily-summaries - Calculate and return daily summaries
export async function GET(req: Request) {
  await dbConnect();
  try {
    const { searchParams } = new URL(req.url);
    const dateRange = searchParams.get("range");

    let filter: any = {};
    const now = new Date();
    let startDate: Date | undefined;

    // Determine date range for fetching raw transactions
    if (dateRange && dateRange !== "all") {
      startDate = new Date(now);
      switch (dateRange) {
        case "week":
          startDate.setDate(now.getDate() - 6);
          break;
        case "month":
          startDate.setDate(now.getDate() - 29);
          break;
        case "quarter":
          startDate.setDate(now.getDate() - 89);
          break;
        case "today":
          startDate.setHours(0, 0, 0, 0);
          break;
        default:
          startDate = undefined; // No specific date filter
      }

      if (startDate) {
        startDate.setHours(0, 0, 0, 0); // Start of the day
        filter.createdAt = { $gte: startDate.toISOString() };
      }
    }

    // Optimization: In a production app, you would fetch pre-calculated summaries from
    // the DailySummary collection if `dateRange` is suitable, or if a summary
    // calculation background job has run. For this example, we calculate on-demand.
    const transactions = await Transaction.find(filter).lean(); // .lean() for faster results
    const inventory = await Inventory.find({}).lean(); // .lean() for faster results

    const inventoryLookup: Record<string, InventoryItem> = inventory.reduce(
      (acc, item) => {
        if (item._id) {
          // Use _id from lean() result
          acc[item._id.toString()] = item as InventoryItem; // Cast to InventoryItem
        }
        return acc;
      },
      {} as Record<string, InventoryItem>
    );

    const summariesMap = new Map<string, IDailySummary>();

    transactions.forEach((t) => {
      const transactionDate = new Date(t.createdAt);
      // Ensure dayKey is 'YYYY-MM-DD' for consistent grouping
      const dayKey = transactionDate.toISOString().split("T")[0];
      const displayDate = formatDate(transactionDate); // For display in frontend

      let summary = summariesMap.get(dayKey);

      if (!summary) {
        summary = {
          date: displayDate, // Use formatted date for display
          totalTransactionsCount: 0,
          totalMoneyIn: 0,
          totalMoneyOut: 0,
          netFlow: 0,
          grossProfitFromSales: 0,
          lossFromBelowCostSales: 0,
        };
        summariesMap.set(dayKey, summary);
      }

      summary.totalTransactionsCount++;

      if (t.type === "stock_in") {
        summary.totalMoneyOut += t.totalAmount;
      } else if (t.type === "stock_out") {
        summary.totalMoneyIn += t.totalAmount;
        const soldItem = inventoryLookup[t.itemId];
        if (soldItem) {
          const itemBuyPrice = soldItem.buyPrice;
          const transactionSellPrice = t.unitPrice;
          if (transactionSellPrice > itemBuyPrice) {
            summary.grossProfitFromSales +=
              (transactionSellPrice - itemBuyPrice) * t.quantity;
          } else if (transactionSellPrice < itemBuyPrice) {
            summary.lossFromBelowCostSales +=
              (itemBuyPrice - transactionSellPrice) * t.quantity;
          }
        }
      }
    });

    summariesMap.forEach((summary) => {
      summary.netFlow = summary.totalMoneyIn - summary.totalMoneyOut;
    });

    const dailySummaries = Array.from(summariesMap.values()).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return NextResponse.json(dailySummaries);
  } catch (error: any) {
    console.error("API Error calculating daily summaries:", error);
    return NextResponse.json(
      { message: "Failed to fetch daily summaries", error: error.message },
      { status: 500 }
    );
  }
}
