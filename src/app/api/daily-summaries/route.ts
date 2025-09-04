// src/app/api/daily-summaries/route.ts
import { NextResponse } from "next/server";
import dbConnect from "@/app/api/db/connect";
import Inventory from "@/models/Inventory";
import Transaction from "@/models/Transaction";
// DailySummary model is not directly used for fetching here, but for type consistency
import DailySummary from "@/models/DailySummary";
import { InventoryItem, StockTransaction } from "@/lib/types/inventory";
import { formatDate } from "@/lib/utils"; // Assuming formatDate is in lib/utils

// Re-defining IDailySummary for internal API calculation result,
// should align with what DailySummaryDocument eventually stores if persisted.
interface IDailySummaryResult {
  date: string; // Formatted date string, e.g., "Jan 1, 2023"
  totalTransactionsCount: number;
  totalMoneyIn: number; // Sum of stock_out totalAmount
  totalMoneyOut: number; // Sum of stock_in totalAmount
  netFlow: number; // totalMoneyIn - totalMoneyOut
  grossProfitFromSales: number; // (sellPrice - buyPrice) * quantity for stock_out where sellPrice > buyPrice
  lossFromBelowCostSales: number; // (buyPrice - sellPrice) * quantity for stock_out where sellPrice < buyPrice
}

// GET /api/daily-summaries - Calculate and return daily summaries
export async function GET(req: Request) {
  await dbConnect();
  try {
    const { searchParams } = new URL(req.url);
    const dateRangeParam = searchParams.get("range"); // "today", "week", "month", "quarter", "all"

    let filter: any = {};
    const now = new Date();
    let startDateFilter: Date | undefined;
    let endDateFilter: Date = new Date(now.setHours(23, 59, 59, 999)); // End of today

    // Determine date range for fetching raw transactions
    if (dateRangeParam && dateRangeParam !== "all") {
      startDateFilter = new Date(now); // Clone current date
      startDateFilter.setHours(0, 0, 0, 0); // Start of the day for today

      switch (dateRangeParam) {
        case "week":
          startDateFilter.setDate(now.getDate() - 6); // Last 7 days, including today
          break;
        case "month":
          startDateFilter.setDate(now.getDate() - 29); // Last 30 days, including today
          break;
        case "quarter":
          startDateFilter.setDate(now.getDate() - 89); // Last 90 days, including today
          break;
        case "today":
          // startDateFilter is already set to start of today
          break;
        default:
          startDateFilter = undefined; // No specific date filter
      }

      if (startDateFilter) {
        filter.createdAt = { $gte: startDateFilter.toISOString() };
      }
    }

    // Fetch all transactions within the determined filter
    const transactions: StockTransaction[] = await Transaction.find(
      filter
    ).lean();
    const inventory: InventoryItem[] = await Inventory.find({}).lean();

    const inventoryLookup: Record<string, InventoryItem> = inventory.reduce(
      (acc, item) => {
        // Ensure _id is converted to string for consistency with item.id from frontend
        if (item._id) {
          acc[item._id.toString()] = { ...item, id: item._id.toString() }; // Map _id to id
        }
        return acc;
      },
      {} as Record<string, InventoryItem>
    );

    const summariesMap = new Map<string, IDailySummaryResult>();

    transactions.forEach((t) => {
      const transactionDate = new Date(t.createdAt);
      // Ensure dayKey is 'YYYY-MM-DD' for consistent grouping
      const dayKey = transactionDate.toISOString().split("T")[0];
      const displayDate = formatDate(transactionDate); // Use formatted date for display

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
          const transactionSellPrice = t.unitPrice; // Use transaction's unit price for sale
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

    // Sort summaries by date, newest first
    const dailySummaries = Array.from(summariesMap.values()).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // If a specific single day summary is requested (e.g., "today"), return only that day.
    // Otherwise, return all relevant daily summaries for the range.
    if (dateRangeParam === "today" && dailySummaries.length > 0) {
      return NextResponse.json(dailySummaries[0]); // Return the single summary for today
    } else if (["week", "month", "quarter"].includes(dateRangeParam || "")) {
      // For aggregated periods, calculate a total summary from the daily summaries
      const aggregatedSummary = dailySummaries.reduce(
        (acc, curr) => {
          acc.totalTransactionsCount += curr.totalTransactionsCount;
          acc.totalMoneyIn += curr.totalMoneyIn;
          acc.totalMoneyOut += curr.totalMoneyOut;
          acc.netFlow += curr.netFlow;
          acc.grossProfitFromSales += curr.grossProfitFromSales;
          acc.lossFromBelowCostSales += curr.lossFromBelowCostSales;
          return acc;
        },
        {
          date: `Aggregated: ${
            dailySummaries.length > 0
              ? formatDate(
                  new Date(dailySummaries[dailySummaries.length - 1].date)
                )
              : ""
          } - ${
            dailySummaries.length > 0
              ? formatDate(new Date(dailySummaries[0].date))
              : ""
          }`,
          totalTransactionsCount: 0,
          totalMoneyIn: 0,
          totalMoneyOut: 0,
          netFlow: 0,
          grossProfitFromSales: 0,
          lossFromBelowCostSales: 0,
        }
      );

      return NextResponse.json(aggregatedSummary);
    }

    return NextResponse.json(dailySummaries); // For "all" or if multiple days are relevant
  } catch (error: any) {
    console.error("API Error calculating daily summaries:", error);
    return NextResponse.json(
      { message: "Failed to fetch daily summaries", error: error.message },
      { status: 500 }
    );
  }
}
