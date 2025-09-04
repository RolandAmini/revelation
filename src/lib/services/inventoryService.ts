// src/lib/services/inventoryService.ts
import {
  InventoryItem,
  StockTransaction,
  InventoryStats,
} from "@/lib/types/inventory";
import { api } from "./api"; // Import the general API client

// Define types for data sent to API
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

// Type for export/import data structure
interface InventoryExportData {
  inventory: InventoryItem[];
  transactions: StockTransaction[];
  exportDate: string;
}

// Re-defining DailySummary here or importing from a dedicated types file if it existed
// For now, mirroring from transactions page
interface DailySummary {
  date: string;
  totalTransactionsCount: number;
  totalMoneyIn: number;
  totalMoneyOut: number;
  netFlow: number;
  grossProfitFromSales: number;
  lossFromBelowCostSales: number;
}

// API Service functions
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
    // In a real app, you might add filters here: /transactions?itemId=abc&type=stock_in
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
    // This assumes your backend has an endpoint to accept and process imported data
    return api.post<void>("/import", data);
  },

  getDailySummaries: async (dateRange?: string): Promise<DailySummary[]> => {
    // Assuming backend will accept a dateRange query param if provided
    const endpoint = dateRange
      ? `/daily-summaries?range=${dateRange}`
      : "/daily-summaries";
    return api.get<DailySummary[]>(endpoint);
  },
};
