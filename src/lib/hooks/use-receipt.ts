"use client";

import { useState } from "react";

// Define types for the receipt data
interface ReceiptItem {
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface CustomerInfo {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
}

interface Transaction {
  quantity: number;
  unitPrice: number;
  totalAmount: number;
}

interface InventoryItem {
  name: string;
  currentStock: number;
  buyPrice: number;
}

interface InventoryStats {
  totalValue: number;
}

interface ReceiptData {
  type: "sale" | "inventory_report";
  items: ReceiptItem[];
  subtotal: number;
  total: number;
  customerInfo?: CustomerInfo;
  receiptNumber: string;
  date: string;
}

export function useReceiptGenerator() {
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);

  const generateSaleReceipt = (
    transaction: Transaction,
    items: InventoryItem[],
    customerInfo: CustomerInfo = {}
  ) => {
    const receiptItems: ReceiptItem[] = items.map((item) => ({
      name: item.name,
      quantity: transaction.quantity,
      unitPrice: transaction.unitPrice,
      total: transaction.totalAmount,
    }));

    const data: ReceiptData = {
      type: "sale",
      items: receiptItems,
      subtotal: transaction.totalAmount,
      total: transaction.totalAmount,
      customerInfo,
      receiptNumber: `R${Date.now()}`,
      date: new Date().toLocaleDateString(),
    };

    setReceiptData(data);
    setShowReceipt(true);
  };

  const generateInventoryReport = (
    inventory: InventoryItem[],
    stats: InventoryStats
  ) => {
    const reportItems: ReceiptItem[] = inventory.slice(0, 10).map((item) => ({
      name: item.name,
      quantity: item.currentStock,
      unitPrice: item.buyPrice,
      total: item.currentStock * item.buyPrice,
    }));

    const data: ReceiptData = {
      type: "inventory_report",
      items: reportItems,
      subtotal: stats.totalValue,
      total: stats.totalValue,
      receiptNumber: `INV${Date.now()}`,
      date: new Date().toLocaleDateString(),
    };

    setReceiptData(data);
    setShowReceipt(true);
  };

  return {
    showReceipt,
    receiptData,
    generateSaleReceipt,
    generateInventoryReport,
    closeReceipt: () => setShowReceipt(false),
  };
}
