// src/app/transactions/page.tsx
"use client";

import React, { useState, useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  XCircle,
  Download,
  ArrowRightLeft,
  // REMOVED: Calendar, DollarSign - no longer used in the simplified cards
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Navbar from "@/components/layout/navbar";
import Sidebar from "@/components/layout/sidebar";
import { useInventory } from "@/lib/hooks/use-inventory";
import {
  formatCurrency,
  formatDate,
  mapStatusToBadgeVariant,
} from "@/lib/utils";
import { InventoryItem } from "@/lib/types/inventory";
import jsPDF from "jspdf";
import autoTable, { UserOptions } from "jspdf-autotable";

interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: UserOptions) => jsPDF;
}

const transactionTypeConfig = {
  stock_in: {
    label: "Purchase",
    icon: TrendingUp,
    variant: "success" as const,
  },
  stock_out: {
    label: "Sale",
    icon: TrendingDown,
    variant: "destructive" as const,
  },
  adjustment: {
    label: "Adjustment",
    icon: RefreshCw,
    variant: "warning" as const,
  },
  transfer: {
    label: "Transfer",
    icon: RefreshCw,
    variant: "secondary" as const,
  },
};

export default function TransactionsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [itemFilter, setItemFilter] = useState("all");

  const { inventory, transactions, stats, exportData, importData } =
    useInventory();

  const processedTransactions = useMemo(() => {
    let filtered = transactions;
    if (typeFilter !== "all") {
      filtered = filtered.filter((t) => t.type === typeFilter);
    }
    if (itemFilter !== "all") {
      filtered = filtered.filter((t) => t.itemId === itemFilter);
    }
    if (dateFilter !== "all") {
      const now = new Date();
      const filterStartDate = new Date();
      switch (dateFilter) {
        case "today":
          filterStartDate.setHours(0, 0, 0, 0);
          break;
        case "week":
          filterStartDate.setDate(now.getDate() - 7);
          break;
        case "month":
          filterStartDate.setMonth(now.getMonth() - 1);
          break;
        case "quarter":
          filterStartDate.setMonth(now.getMonth() - 3);
          break;
      }
      filtered = filtered.filter(
        (t) => new Date(t.createdAt) >= filterStartDate
      );
    }

    return filtered
      .map((transaction) => {
        const item = inventory.find((i) => i.id === transaction.itemId);
        const config =
          transactionTypeConfig[
            transaction.type as keyof typeof transactionTypeConfig
          ];
        let profit = 0;
        if (transaction.type === "stock_out" && item) {
          profit =
            (transaction.unitPrice - item.buyPrice) * transaction.quantity;
        }

        return {
          ...transaction,
          itemName: item?.name || `Unknown Item (ID: ${transaction.itemId})`,
          itemConfig: config || {
            label: transaction.type,
            icon: RefreshCw,
            variant: "secondary",
          },
          profit: profit,
        };
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }, [transactions, inventory, typeFilter, itemFilter, dateFilter]);

  const summaryStats = useMemo(() => {
    return processedTransactions.reduce(
      (acc, t) => {
        acc.totalTransactions++;
        if (t.type === "stock_in") acc.totalPurchaseCost += t.totalAmount;
        else if (t.type === "stock_out") {
          acc.totalSaleRevenue += t.totalAmount;
          acc.grossProfit += t.profit;
        }
        return acc;
      },
      {
        totalTransactions: 0,
        totalPurchaseCost: 0,
        totalSaleRevenue: 0,
        grossProfit: 0,
      }
    );
  }, [processedTransactions]);

  const netCashFlow =
    summaryStats.totalSaleRevenue - summaryStats.totalPurchaseCost;

  const itemsWithTransactions = useMemo(() => {
    const itemIds = new Set(transactions.map((t) => t.itemId));
    return inventory
      .filter((item) => item.id && itemIds.has(item.id))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [inventory, transactions]);

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            const importedData = JSON.parse(event.target?.result as string);
            const success = await importData(importedData);
            alert(
              success
                ? "Data imported successfully!"
                : "Invalid file format or failed import."
            );
          } catch {
            alert("Error reading or parsing file.");
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleDownloadPdfSummary = () => {
    if (processedTransactions.length === 0) {
      alert("No data available for the current filters to generate a report.");
      return;
    }

    const doc = new jsPDF() as jsPDFWithAutoTable;
    doc.setFontSize(18);
    doc.text("Transaction Report", 14, 22);
    doc.setFontSize(11);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 29);

    const tableColumn = ["Date", "Item", "Type", "Qty", "Unit Price", "Impact"];
    const tableRows: (string | number)[][] = [];

    processedTransactions.forEach((transaction) => {
      let impact = "";
      if (transaction.type === "stock_in")
        impact = `Cost: ${formatCurrency(transaction.totalAmount)}`;
      else if (transaction.type === "stock_out")
        impact = `Profit: ${formatCurrency(transaction.profit)}`;

      const transactionDate = new Date(
        transaction.createdAt
      ).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });

      tableRows.push([
        transactionDate,
        transaction.itemName,
        transaction.itemConfig.label,
        transaction.quantity,
        formatCurrency(transaction.unitPrice),
        impact,
      ]);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 36,
    });

    doc.save(
      `transactions-report-${new Date().toISOString().split("T")[0]}.pdf`
    );
  };

  const hasActiveFilters =
    typeFilter !== "all" || dateFilter !== "all" || itemFilter !== "all";

  return (
    <div className={`min-h-screen bg-gray-100 ${darkMode ? "dark" : ""}`}>
      <Navbar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onExport={exportData}
        onImport={handleImport}
      />

      <div className="flex h-[calc(100vh-4rem)]">
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          stats={stats}
        />

        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
          <div className="max-w-7xl mx-auto p-4 lg:p-8 space-y-6">
            <div>
              <h1 className="text-3xl font-bold">Transaction History</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Track all inventory movements and financial transactions.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">
                    Total Transactions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {summaryStats.totalTransactions}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">
                    Total Sale Revenue
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(summaryStats.totalSaleRevenue)}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">
                    Net Cash Flow
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className={`text-2xl font-bold ${
                      netCashFlow >= 0 ? "" : "text-red-600"
                    }`}
                  >
                    {formatCurrency(netCashFlow)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Revenue - Purchases
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">
                    Gross Profit
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className={`text-2xl font-bold ${
                      summaryStats.grossProfit >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {formatCurrency(summaryStats.grossProfit)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Profit from sales
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardContent className="p-4 md:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                  <div>
                    <Label htmlFor="type-filter">Transaction Type</Label>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger id="type-filter">
                        <SelectValue placeholder="All Types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        {Object.entries(transactionTypeConfig).map(
                          ([key, { label }]) => (
                            <SelectItem key={key} value={key}>
                              {label}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="item-filter">Item Name</Label>
                    <Select value={itemFilter} onValueChange={setItemFilter}>
                      <SelectTrigger id="item-filter">
                        <SelectValue placeholder="All Items" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Items</SelectItem>
                        {itemsWithTransactions.map((item) => (
                          <SelectItem key={item.id} value={item.id!}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="date-filter">Date Range</Label>
                    <Select value={dateFilter} onValueChange={setDateFilter}>
                      <SelectTrigger id="date-filter">
                        <SelectValue placeholder="All Time" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Time</SelectItem>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="week">Past Week</SelectItem>
                        <SelectItem value="month">Past Month</SelectItem>
                        <SelectItem value="quarter">Past Quarter</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setTypeFilter("all");
                        setItemFilter("all");
                        setDateFilter("all");
                      }}
                      disabled={!hasActiveFilters}
                      className="w-full flex items-center gap-2"
                    >
                      <XCircle className="h-4 w-4" /> Clear Filters
                    </Button>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t">
                  <Button
                    onClick={handleDownloadPdfSummary}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" /> Download Report (PDF)
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>
                  Transaction Details ({processedTransactions.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {processedTransactions.length === 0 ? (
                  <div className="text-center py-8">
                    <h3>No transactions found</h3>
                    <p>Try adjusting your filters.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date & Time</TableHead>
                          <TableHead>Item</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Unit Price</TableHead>
                          <TableHead>Financial Impact</TableHead>
                          <TableHead>Reference</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {processedTransactions.map((t) => (
                          <TableRow key={t.id}>
                            <TableCell>
                              <div>{formatDate(t.createdAt)}</div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(t.createdAt).toLocaleTimeString()}
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">
                              {t.itemName}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={mapStatusToBadgeVariant(
                                  t.itemConfig.variant
                                )}
                              >
                                {t.itemConfig.label}
                              </Badge>
                            </TableCell>
                            <TableCell>{t.quantity}</TableCell>
                            <TableCell>{formatCurrency(t.unitPrice)}</TableCell>
                            <TableCell>
                              {t.type === "stock_in" ? (
                                <div>
                                  <span className="font-semibold text-blue-600">
                                    {formatCurrency(t.totalAmount)}
                                  </span>
                                  <p className="text-xs text-muted-foreground">
                                    Purchase Cost
                                  </p>
                                </div>
                              ) : t.type === "stock_out" ? (
                                <div>
                                  <span
                                    className={`font-semibold ${
                                      t.profit > 0
                                        ? "text-green-600"
                                        : t.profit < 0
                                        ? "text-red-600"
                                        : ""
                                    }`}
                                  >
                                    {formatCurrency(t.profit)}
                                  </span>
                                  <p className="text-xs text-muted-foreground">
                                    {t.profit < 0 ? "Loss" : "Profit"}
                                  </p>
                                </div>
                              ) : (
                                <span>-</span>
                              )}
                            </TableCell>
                            <TableCell>{t.reference}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
