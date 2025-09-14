// src/app/api/daily-summaries/route.ts
import { NextResponse } from "next/server";
import dbConnect from "@/app/api/db/connect";
import Inventory from "@/models/Inventory";
import Transaction from "@/models/Transaction";
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

type InventoryDocument = InventoryItem & {
  _id: { toString: () => string };
  __v?: number;
};
type TransactionDocument = StockTransaction & {
  _id: { toString: () => string };
  __v?: number;
};

interface MongooseFilter {
  createdAt?: { $gte: string };
}

export async function GET(req: Request) {
  await dbConnect();
  try {
    const { searchParams } = new URL(req.url);
    const dateRangeParam = searchParams.get("range");

    const filter: MongooseFilter = {};
    let startDateFilter: Date | undefined;

    if (dateRangeParam && dateRangeParam !== "all") {
      startDateFilter = new Date();
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
          break;
        default:
          startDateFilter = undefined;
      }
      if (startDateFilter) {
        filter.createdAt = { $gte: startDateFilter.toISOString() };
      }
    }

    const inventoryDocs = (await Inventory.find(
      {}
    ).lean()) as InventoryDocument[];
    const transactionDocs = (await Transaction.find(
      filter
    ).lean()) as TransactionDocument[];

    const inventory: InventoryItem[] = inventoryDocs.map((doc) => {
      const { _id, __v, ...rest } = doc;
      return { ...rest, id: _id.toString() };
    });
    const transactions: StockTransaction[] = transactionDocs.map((doc) => {
      const { _id, __v, ...rest } = doc;
      return { ...rest, id: _id.toString() };
    });

    const inventoryLookup = new Map(inventory.map((item) => [item.id, item]));
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
        const soldItem = inventoryLookup.get(t.itemId);
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

    return NextResponse.json(dailySummaries);
  } catch (error: unknown) {
    console.error("API Error calculating daily summaries:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json(
      { message: "Failed to fetch daily summaries", error: errorMessage },
      { status: 500 }
    );
  }
}
