export interface InventoryItem {
  id: string;
  name: string;
  description?: string;
  category: string;
  sku: string;
  currentStock: number;
  minStockLevel: number;
  maxStockLevel?: number;
  buyPrice: number;
  sellPrice: number;
  supplier?: string;
  location?: string;
  createdAt: string;
  updatedAt: string;
}
export type CreateInventoryItemData = Omit<
  InventoryItem,
  "id" | "createdAt" | "updatedAt"
>;
// This represents the data for updating. All fields are optional.
export type UpdateInventoryItemData = Partial<CreateInventoryItemData>;

export interface StockTransaction {
  id: string;
  itemId: string;
  type: "stock_in" | "stock_out" | "adjustment" | "transfer";
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  reference?: string;
  notes?: string;
  performedBy?: string;
  createdAt: string;
}

export type Transaction = StockTransaction;

export interface TransactionFilter {
  type?: "all" | "stock_in" | "stock_out" | "adjustment" | "transfer";
  itemId?: "all" | string;
  dateRange?: {
    start: string;
    end: string;
  };
  minAmount?: number;
  maxAmount?: number;
  reference?: string;
}

export interface TransactionSummary {
  totalTransactions: number;
  totalPurchaseValue: number;
  totalSaleValue: number;
  totalAdjustments: number;
  netCashFlow: number;
  grossProfit: number;
  period: {
    start: string;
    end: string;
  };
}

export interface FinancialRecord {
  id: string;
  date: string;
  type: "profit" | "loss" | "investment";
  amount: number;
  description: string;
  category: string;
  relatedTransactionId?: string;
}

export interface InventoryStats {
  totalItems: number;
  totalValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  totalProfit: number;
  totalLoss: number;
  monthlyProfit: number;
  monthlyLoss: number;
}
