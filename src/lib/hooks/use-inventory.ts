// src/lib/hooks/use-inventory.ts
"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
// REMOVED: import { useLocalStorage } from "./use-local-storage"; // No longer using localStorage
import {
  InventoryItem,
  StockTransaction,
  InventoryStats,
} from "@/lib/types/inventory";
import { calculateProfit } from "@/lib/utils"; // generateId is no longer here
import {
  inventoryService, // NEW: Import inventoryService
  CreateInventoryItemData,
  UpdateInventoryItemData,
  CreateStockTransactionData,
} from "@/lib/services/inventoryService";

export function useInventory() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [stats, setStats] = useState<InventoryStats>({
    totalItems: 0,
    totalValue: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    totalProfit: 0,
    totalLoss: 0,
    monthlyProfit: 0,
    monthlyLoss: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch all data - this is the core of refreshing state
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Use Promise.all to fetch multiple data points concurrently
      const [fetchedInventory, fetchedTransactions, fetchedStats] =
        await Promise.all([
          inventoryService.getInventory(),
          inventoryService.getTransactions(),
          inventoryService.getStats(), // Fetch stats from backend
        ]);

      setInventory(fetchedInventory);
      setTransactions(fetchedTransactions);
      setStats(fetchedStats); // Update stats from backend
    } catch (err: any) {
      console.error("Failed to fetch inventory data:", err);
      setError(err.message || "Failed to fetch data.");
    } finally {
      setLoading(false);
    }
  }, []); // Dependencies are empty because `inventoryService` is stable

  // Initial data fetch on component mount
  useEffect(() => {
    fetchData();
  }, [fetchData]); // `fetchData` itself is memoized with `useCallback`

  const addItem = useCallback(
    async (
      itemData: CreateInventoryItemData
    ): Promise<InventoryItem | undefined> => {
      setLoading(true);
      setError(null);
      try {
        const newItem = await inventoryService.createItem(itemData);
        await fetchData(); // Refresh all data after successful addition
        return newItem;
      } catch (err: any) {
        setError(err.message || "Failed to add item.");
        // Re-throw if the calling component needs to handle the error more specifically
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchData] // `fetchData` is the dependency
  );

  const updateItem = useCallback(
    async (id: string, updates: UpdateInventoryItemData): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        await inventoryService.updateItem(id, updates);
        await fetchData(); // Refresh all data after successful update
      } catch (err: any) {
        setError(err.message || "Failed to update item.");
        throw err; // Re-throw to allow component to handle specific alerts
      } finally {
        setLoading(false);
      }
    },
    [fetchData]
  );

  const deleteItem = useCallback(
    async (id: string): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        await inventoryService.deleteItem(id);
        await fetchData(); // Refresh all data after successful deletion
      } catch (err: any) {
        setError(err.message || "Failed to delete item.");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchData]
  );

  const recordTransaction = useCallback(
    async (
      itemId: string,
      transactionData: Omit<StockTransaction, "id" | "itemId" | "createdAt">
    ): Promise<StockTransaction | undefined> => {
      setLoading(true);
      setError(null);
      try {
        const newTransaction = await inventoryService.recordTransaction({
          ...transactionData,
          itemId, // Ensure itemId is correctly passed in the transaction payload
        });
        await fetchData(); // Refresh all data (inventory stock levels, stats, transactions)
        return newTransaction;
      } catch (err: any) {
        setError(err.message || "Failed to record transaction.");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchData]
  );

  // This `stats` object is now populated directly from the backend API via `setStats(fetchedStats)`.
  // The client-side `useMemo` for `stats` is no longer needed here if the backend `/stats` endpoint is comprehensive.
  // I've removed the client-side calculation to avoid redundancy and potential inconsistencies.
  // The `stats` variable exported by the hook will be the one fetched from the API.

  const getItemTransactions = useCallback(
    (itemId: string) => {
      // This will filter local state, but for large datasets, filtering should be done via API
      // If `transactions` array grows very large, this filter should be moved to a backend API endpoint.
      return transactions
        .filter((transaction) => transaction.itemId === itemId)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    },
    [transactions]
  );

  const exportData = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      // Call backend API endpoint for export. Backend generates and returns the JSON payload.
      const exported = await inventoryService.exportData(); // Backend returns the full data
      const dataStr = JSON.stringify(exported, null, 2);
      const dataUri =
        "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
      const exportFileDefaultName = `inventory-export-${
        new Date().toISOString().split("T")[0]
      }.json`;

      const linkElement = document.createElement("a");
      linkElement.setAttribute("href", dataUri);
      linkElement.setAttribute("download", exportFileDefaultName);
      document.body.appendChild(linkElement); // Append to body to make it clickable
      linkElement.click();
      document.body.removeChild(linkElement); // Clean up
    } catch (err: any) {
      setError(err.message || "Failed to export data.");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const importData = useCallback(
    async (data: {
      inventory: InventoryItem[];
      transactions: StockTransaction[];
    }): Promise<boolean> => {
      setLoading(true);
      setError(null);
      try {
        await inventoryService.importData(data);
        await fetchData(); // Refresh data after import
        return true;
      } catch (err: any) {
        setError(err.message || "Failed to import data.");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchData]
  );

  return {
    inventory,
    transactions,
    loading,
    error,
    stats, // Now comes from state, set by API call
    addItem,
    updateItem,
    deleteItem,
    recordTransaction,
    getItemTransactions,
    exportData,
    importData,
    fetchData, // Expose refetch function if needed for manual refresh
  };
}
