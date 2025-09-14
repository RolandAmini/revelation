import {
  Transaction,
  TransactionFilter,
  TransactionSummary,
  InventoryItem,
} from "@/lib/types/inventory";

export class TransactionService {
  private static TRANSACTIONS_KEY = "inventory_transactions_v2";

  static getTransactions(): Transaction[] {
    if (typeof window === "undefined") return [];
    try {
      const data = localStorage.getItem(this.TRANSACTIONS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Error loading transactions:", error);
      return [];
    }
  }

  static saveTransactions(transactions: Transaction[]): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(this.TRANSACTIONS_KEY, JSON.stringify(transactions));
    } catch (error) {
      console.error("Error saving transactions:", error);
    }
  }

  static createTransaction(
    itemId: string,
    transactionData: Omit<Transaction, "id" | "itemId" | "createdAt">
  ): Transaction {
    return {
      ...transactionData,
      // FIXED: Replaced generateId() with the modern, browser-native crypto.randomUUID()
      id: crypto.randomUUID(),
      itemId,
      createdAt: new Date().toISOString(),
    };
  }

  static filterTransactions(
    transactions: Transaction[],
    filter: TransactionFilter
  ): Transaction[] {
    return transactions.filter((transaction) => {
      if (
        filter.type &&
        filter.type !== "all" &&
        transaction.type !== filter.type
      ) {
        return false;
      }
      if (
        filter.itemId &&
        filter.itemId !== "all" &&
        transaction.itemId !== filter.itemId
      ) {
        return false;
      }
      if (filter.dateRange) {
        const transactionDate = new Date(transaction.createdAt);
        const startDate = new Date(filter.dateRange.start);
        const endDate = new Date(filter.dateRange.end);
        if (transactionDate < startDate || transactionDate > endDate) {
          return false;
        }
      }
      if (filter.minAmount && transaction.totalAmount < filter.minAmount) {
        return false;
      }
      if (filter.maxAmount && transaction.totalAmount > filter.maxAmount) {
        return false;
      }
      if (filter.reference) {
        const searchTerm = filter.reference.toLowerCase();
        // FIXED: Removed reference to 'invoiceNumber' which does not exist on the type.
        const hasMatch =
          transaction.reference?.toLowerCase().includes(searchTerm) ||
          transaction.notes?.toLowerCase().includes(searchTerm);
        if (!hasMatch) return false;
      }
      return true;
    });
  }

  static calculateSummary(
    transactions: Transaction[],
    inventory: InventoryItem[]
  ): TransactionSummary {
    const summary = transactions.reduce(
      (acc, transaction) => {
        acc.totalTransactions++;
        switch (transaction.type) {
          case "stock_in":
            acc.totalPurchaseValue += transaction.totalAmount;
            break;
          case "stock_out":
            acc.totalSaleValue += transaction.totalAmount;
            break;
          case "adjustment":
            acc.totalAdjustments++;
            break;
        }
        return acc;
      },
      {
        totalTransactions: 0,
        totalPurchaseValue: 0,
        totalSaleValue: 0,
        totalAdjustments: 0,
      }
    );

    const netCashFlow = summary.totalSaleValue - summary.totalPurchaseValue;
    const grossProfit = transactions
      .filter((t) => t.type === "stock_out")
      .reduce((sum, t) => {
        const item = inventory.find((i) => i.id === t.itemId);
        return item ? sum + (t.unitPrice - item.buyPrice) * t.quantity : sum;
      }, 0);

    const dates = transactions.map((t) => t.createdAt).sort();
    const period = {
      start: dates[0] || new Date().toISOString(),
      end: dates[dates.length - 1] || new Date().toISOString(),
    };

    return {
      ...summary,
      netCashFlow,
      grossProfit,
      period,
    };
  }

  static getRecentTransactions(
    transactions: Transaction[],
    limit: number = 10
  ): Transaction[] {
    return [...transactions]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, limit);
  }

  static getTransactionsByItem(
    transactions: Transaction[],
    itemId: string
  ): Transaction[] {
    return transactions
      .filter((t) => t.itemId === itemId)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }

  static getTransactionsByDateRange(
    transactions: Transaction[],
    startDate: string,
    endDate: string
  ): Transaction[] {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return transactions.filter((transaction) => {
      const transactionDate = new Date(transaction.createdAt);
      return transactionDate >= start && transactionDate <= end;
    });
  }

  static exportTransactions(
    transactions: Transaction[],
    inventory: InventoryItem[]
  ): void {
    const enrichedTransactions = transactions.map((transaction) => {
      const item = inventory.find((i) => i.id === transaction.itemId);
      return {
        ...transaction,
        itemName: item?.name || "Unknown Item",
        itemSKU: item?.sku || "N/A",
        itemCategory: item?.category || "N/A",
      };
    });

    const data = {
      transactions: enrichedTransactions,
      summary: this.calculateSummary(transactions, inventory),
      exportDate: new Date().toISOString(),
    };

    const dataStr = JSON.stringify(data, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
    const exportFileDefaultName = `transactions-export-${
      new Date().toISOString().split("T")[0]
    }.json`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    document.body.appendChild(linkElement);
    linkElement.click();
    document.body.removeChild(linkElement);
  }

  static validateTransaction(transaction: Partial<Transaction>): {
    isValid: boolean;
    errors: Record<string, string>;
  } {
    const errors: Record<string, string> = {};
    if (!transaction.itemId) errors.itemId = "Item is required";
    if (!transaction.type) errors.type = "Transaction type is required";
    if (!transaction.quantity || transaction.quantity <= 0)
      errors.quantity = "Quantity must be greater than 0";
    if (transaction.unitPrice === undefined || transaction.unitPrice < 0)
      errors.unitPrice = "Unit price must be 0 or greater";
    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }
}
