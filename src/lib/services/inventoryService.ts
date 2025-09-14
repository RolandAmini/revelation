import {
  InventoryItem,
  StockTransaction,
  InventoryStats,
} from "@/lib/types/inventory";
import { api } from "./api";

export type CreateInventoryItemData = Omit<
  InventoryItem,
  "id" | "createdAt" | "updatedAt"
>;
export type UpdateInventoryItemData = Partial<
  Omit<InventoryItem, "id" | "createdAt" | "updatedAt">
>;
export type CreateStockTransactionData = Omit<
  StockTransaction,
  "id" | "createdAt"
>;

export interface InventoryExportData {
  inventory: InventoryItem[];
  transactions: StockTransaction[];
  exportDate: string;
}

interface DailySummary {
  date: string;
  totalTransactionsCount: number;
  totalMoneyIn: number;
  totalMoneyOut: number;
  netFlow: number;
  grossProfitFromSales: number;
  lossFromBelowCostSales: number;
}

export const inventoryService = {
  getInventory: async (): Promise<InventoryItem[]> => {
    return api.get<InventoryItem[]>("/inventory");
  },

  createItem: async (
    itemData: CreateInventoryItemData
  ): Promise<InventoryItem> => {
    return api.post<InventoryItem>("/inventory", itemData);
  },

  updateItem: async (
    id: string,
    updates: UpdateInventoryItemData
  ): Promise<InventoryItem> => {
    return api.put<InventoryItem>(`/inventory/${id}`, updates);
  },

  deleteItem: async (id: string): Promise<void> => {
    return api.delete<void>(`/inventory/${id}`);
  },

  getTransactions: async (): Promise<StockTransaction[]> => {
    return api.get<StockTransaction[]>("/transactions");
  },

  recordTransaction: async (
    transactionData: CreateStockTransactionData
  ): Promise<StockTransaction> => {
    return api.post<StockTransaction>("/transactions", transactionData);
  },

  getStats: async (): Promise<InventoryStats> => {
    // This assumes your backend has an endpoint to calculate and return stats
    return api.get<InventoryStats>("/stats");
  },

  exportData: async (): Promise<InventoryExportData> => {
    // This assumes your backend has an endpoint to generate and return all data
    return api.get<InventoryExportData>("/export");
  },

  importData: async (data: InventoryExportData): Promise<void> => {
    return api.post<void>("/import", data);
  },

  getDailySummaries: async (dateRange?: string): Promise<DailySummary[]> => {
    const endpoint = dateRange
      ? `/daily-summaries?range=${dateRange}`
      : "/daily-summaries";
    return api.get<DailySummary[]>(endpoint);
  },
};
