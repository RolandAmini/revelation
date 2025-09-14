"use client";

import { useState, useCallback, useEffect } from "react";
import {
  InventoryItem,
  StockTransaction,
  InventoryStats,
} from "@/lib/types/inventory";
import {
  inventoryService,
  CreateInventoryItemData,
  UpdateInventoryItemData,
  InventoryExportData,
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

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [fetchedInventory, fetchedTransactions, fetchedStats] =
        await Promise.all([
          inventoryService.getInventory(),
          inventoryService.getTransactions(),
          inventoryService.getStats(),
        ]);

      setInventory(fetchedInventory);
      setTransactions(fetchedTransactions);
      setStats(fetchedStats);
    } catch (error) {
      console.error("Failed to fetch inventory data:", error);
      setError(
        error instanceof Error ? error.message : "Failed to fetch data."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const addItem = useCallback(
    async (
      itemData: CreateInventoryItemData
    ): Promise<InventoryItem | undefined> => {
      setLoading(true);
      setError(null);
      try {
        const newItem = await inventoryService.createItem(itemData);
        await fetchData();
        return newItem;
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Failed to add item."
        );
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [fetchData]
  );

  const updateItem = useCallback(
    async (id: string, updates: UpdateInventoryItemData): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        await inventoryService.updateItem(id, updates);
        await fetchData();
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Failed to update item."
        );
        throw error;
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
        await fetchData();
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Failed to delete item."
        );
        throw error;
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
          itemId,
        });
        await fetchData();
        return newTransaction;
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to record transaction."
        );
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [fetchData]
  );

  const getItemTransactions = useCallback(
    (itemId: string) => {
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
      const exported = await inventoryService.exportData();
      const dataStr = JSON.stringify(exported, null, 2);
      const dataUri =
        "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
      const exportFileDefaultName = `inventory-export-${
        new Date().toISOString().split("T")[0]
      }.json`;

      const linkElement = document.createElement("a");
      linkElement.setAttribute("href", dataUri);
      linkElement.setAttribute("download", exportFileDefaultName);
      document.body.appendChild(linkElement);
      linkElement.click();
      document.body.removeChild(linkElement);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to export data."
      );
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const importData = useCallback(
    async (data: InventoryExportData): Promise<boolean> => {
      setLoading(true);
      setError(null);
      try {
        await inventoryService.importData(data);
        await fetchData();
        return true;
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Failed to import data."
        );
        throw error;
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
    stats,
    addItem,
    updateItem,
    deleteItem,
    recordTransaction,
    getItemTransactions,
    exportData,
    importData,
    fetchData,
  };
}
