import {
  InventoryItem,
  StockTransaction,
  InventoryStats,
} from "@/lib/types/inventory";

export class AnalyticsService {
  static calculateStats(
    inventory: InventoryItem[],
    transactions: StockTransaction[]
  ): InventoryStats {
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

    // Calculate profit/loss from transactions
    let totalProfit = 0;
    let totalLoss = 0;
    let monthlyProfit = 0;
    let monthlyLoss = 0;

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    transactions.forEach((transaction) => {
      if (transaction.type !== "stock_out") return;

      const item = inventory.find((i) => i.id === transaction.itemId);
      if (!item) return;

      const transactionDate = new Date(transaction.createdAt);
      const profit =
        (transaction.unitPrice - item.buyPrice) * transaction.quantity;

      if (profit > 0) {
        totalProfit += profit;

        if (
          transactionDate.getMonth() === currentMonth &&
          transactionDate.getFullYear() === currentYear
        ) {
          monthlyProfit += profit;
        }
      } else {
        totalLoss += Math.abs(profit);

        if (
          transactionDate.getMonth() === currentMonth &&
          transactionDate.getFullYear() === currentYear
        ) {
          monthlyLoss += Math.abs(profit);
        }
      }
    });

    return {
      totalItems,
      totalValue,
      lowStockItems,
      outOfStockItems,
      totalProfit,
      totalLoss,
      monthlyProfit,
      monthlyLoss,
    };
  }

  static getProfitTrend(
    inventory: InventoryItem[],
    transactions: StockTransaction[],
    days: number = 30
  ): Array<{ date: string; profit: number; revenue: number }> {
    const data = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      const dayTransactions = transactions.filter(
        (t) => t.createdAt.split("T")[0] === dateStr && t.type === "stock_out"
      );

      let dayProfit = 0;
      let dayRevenue = 0;

      dayTransactions.forEach((transaction) => {
        const item = inventory.find((i) => i.id === transaction.itemId);
        if (item) {
          const profit =
            (transaction.unitPrice - item.buyPrice) * transaction.quantity;
          dayProfit += profit;
          dayRevenue += transaction.totalAmount;
        }
      });

      data.push({
        date: date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        profit: dayProfit,
        revenue: dayRevenue,
      });
    }

    return data;
  }

  static getCategoryBreakdown(inventory: InventoryItem[]): Array<{
    category: string;
    value: number;
    items: number;
    percentage: number;
  }> {
    const totalValue = inventory.reduce(
      (sum, item) => sum + item.currentStock * item.buyPrice,
      0
    );

    const categoryStats = new Map();

    inventory.forEach((item) => {
      const value = item.currentStock * item.buyPrice;
      const current = categoryStats.get(item.category) || {
        category: item.category,
        value: 0,
        items: 0,
      };

      current.value += value;
      current.items += 1;

      categoryStats.set(item.category, current);
    });

    return Array.from(categoryStats.values()).map((stat) => ({
      ...stat,
      percentage: totalValue > 0 ? (stat.value / totalValue) * 100 : 0,
    }));
  }

  static getTopPerformers(
    inventory: InventoryItem[],
    transactions: StockTransaction[],
    limit: number = 10
  ): Array<
    InventoryItem & { profit: number; revenue: number; unitsSold: number }
  > {
    return inventory
      .map((item) => {
        const itemTransactions = transactions.filter(
          (t) => t.itemId === item.id && t.type === "stock_out"
        );

        const profit = itemTransactions.reduce(
          (sum, t) => sum + (t.unitPrice - item.buyPrice) * t.quantity,
          0
        );

        const revenue = itemTransactions.reduce(
          (sum, t) => sum + t.totalAmount,
          0
        );
        const unitsSold = itemTransactions.reduce(
          (sum, t) => sum + t.quantity,
          0
        );

        return {
          ...item,
          profit,
          revenue,
          unitsSold,
        };
      })
      .filter((item) => item.revenue > 0)
      .sort((a, b) => b.profit - a.profit)
      .slice(0, limit);
  }

  static getLowStockAlerts(inventory: InventoryItem[]): {
    critical: InventoryItem[];
    warning: InventoryItem[];
    overstock: InventoryItem[];
  } {
    const critical = inventory.filter((item) => item.currentStock === 0);
    const warning = inventory.filter(
      (item) => item.currentStock > 0 && item.currentStock <= item.minStockLevel
    );
    const overstock = inventory.filter(
      (item) => item.maxStockLevel && item.currentStock > item.maxStockLevel
    );

    return { critical, warning, overstock };
  }
}
