export interface InventoryItem {
  id?: string;
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
