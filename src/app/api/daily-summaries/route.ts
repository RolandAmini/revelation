// src/app/api/daily-summaries/route.ts
import { NextResponse } from "next/server";
import dbConnect from "@/app/api/db/connect";
import Inventory from "@/models/Inventory";
import Transaction from "@/models/Transaction";
// FIXED: Removed unused 'DailySummary' import
import { InventoryItem, StockTransaction } from "@/lib/types/inventory";
import { formatDate } from "@/lib/utils";

interface IDailySummaryResult {
  date: string;
  totalTransactionsCount: number;
  totalMoneyIn: number;
  totalMoneyOut: number;
  netFlow: number;
  grossProfitFromSales: number;
  lossFromBelowCostSales: number;
}

interface InventoryDocument extends InventoryItem {
  _id: { toString: () => string }; // Mongoose _id is an object with a toString method
}
// FIXED: Defined a specific type for the Mongoose query filter
interface MongooseFilter {
  createdAt?: { $gte: string };
}

export async function GET(req: Request) {
  await dbConnect();
  try {
    const { searchParams } = new URL(req.url);
    const dateRangeParam = searchParams.get("range");

    // FIXED: Used 'const' instead of 'let' and provided a proper type instead of 'any'
    const filter: MongooseFilter = {};
    let startDateFilter: Date | undefined;
    // FIXED: Removed unused 'endDateFilter' variable

    if (dateRangeParam && dateRangeParam !== "all") {
      startDateFilter = new Date(); // Use a fresh date object to avoid modifying 'now'
      startDateFilter.setHours(0, 0, 0, 0);

      switch (dateRangeParam) {
        case "week":
          startDateFilter.setDate(startDateFilter.getDate() - 6);
          break;
        case "month":
          startDateFilter.setDate(startDateFilter.getDate() - 29);
          break;
        case "quarter":
          startDateFilter.setDate(startDateFilter.getDate() - 89);
          break;
        case "today":
          break; // Already set to start of today
        default:
          startDateFilter = undefined;
      }

      if (startDateFilter) {
        filter.createdAt = { $gte: startDateFilter.toISOString() };
      }
    }

    const transactions: StockTransaction[] = await Transaction.find(
      filter
    ).lean();
    const inventory: InventoryDocument[] = await Inventory.find({}).lean();

    const inventoryLookup: Record<string, InventoryItem> = inventory.reduce(
      (acc, item) => {
        if (item._id) {
          const id = item._id.toString();
          acc[id] = { ...item, id };
        }
        return acc;
      },
      {} as Record<string, InventoryItem>
    );

    const summariesMap = new Map<string, IDailySummaryResult>();

    transactions.forEach((t) => {
      const transactionDate = new Date(t.createdAt);
      const dayKey = transactionDate.toISOString().split("T")[0];
      const displayDate = formatDate(transactionDate);

      let summary = summariesMap.get(dayKey);
      if (!summary) {
        summary = {
          date: displayDate,
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
          const profit = (t.unitPrice - soldItem.buyPrice) * t.quantity;
          if (profit > 0) {
            summary.grossProfitFromSales += profit;
          } else {
            summary.lossFromBelowCostSales += Math.abs(profit);
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

    if (dateRangeParam === "today" && dailySummaries.length > 0) {
      return NextResponse.json(dailySummaries[0]);
    } else if (["week", "month", "quarter"].includes(dateRangeParam || "")) {
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
              ? dailySummaries[dailySummaries.length - 1].date
              : ""
          } - ${dailySummaries.length > 0 ? dailySummaries[0].date : ""}`,
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
    return NextResponse.json(dailySummaries);
  } catch (error: unknown) {
    // FIXED: Used 'unknown' for type safety
    console.error("API Error calculating daily summaries:", error);
    // FIXED: Safely check if 'error' is an Error object before accessing .message
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json(
      { message: "Failed to fetch daily summaries", error: errorMessage },
      { status: 500 }
    );
  }
}
