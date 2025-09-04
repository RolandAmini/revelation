"use client";

import { useState } from "react";

export function useReceiptGenerator() {
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState(null);

  const generateSaleReceipt = (transaction, items, customerInfo = {}) => {
    const receiptItems = items.map((item) => ({
      name: item.name,
      quantity: transaction.quantity,
      unitPrice: transaction.unitPrice,
      total: transaction.totalAmount,
    }));

    const data = {
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

  const generateInventoryReport = (inventory, stats) => {
    const reportItems = inventory.slice(0, 10).map((item) => ({
      name: item.name,
      quantity: item.currentStock,
      unitPrice: item.buyPrice,
      total: item.currentStock * item.buyPrice,
    }));

    const data = {
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
