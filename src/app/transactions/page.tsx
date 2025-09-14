// src/app/transactions/page.tsx
"use client";

import React, { useState, useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Calendar,
  DollarSign,
  XCircle, // New icon for clear filters
  Download, // For PDF download
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
import { useInventory } from "@/lib/hooks/use-inventory"; // Ensure this hook fetches from API
import {
  formatCurrency,
  formatDate,
  mapStatusToBadgeVariant,
} from "@/lib/utils";
import { InventoryItem } from "@/lib/types/inventory";

// Import jsPDF
import jsPDF from "jspdf";

interface DailySummaryResult {
  date: string;
  totalTransactionsCount: number;
  totalMoneyIn: number;
  totalMoneyOut: number;
  netFlow: number;
  grossProfitFromSales: number;
  lossFromBelowCostSales: number;
}

const transactionTypeConfig = {
  stock_in: {
    label: "Stock In (Purchase)",
    icon: TrendingUp,
    variant: "success" as const,
    description: "Items added to inventory",
  },
  stock_out: {
    label: "Stock Out (Sale)",
    icon: TrendingDown,
    variant: "destructive" as const,
    description: "Items removed from inventory",
  },
  adjustment: {
    label: "Adjustment",
    icon: RefreshCw,
    variant: "warning" as const,
    description: "Stock level adjustments",
  },
  transfer: {
    label: "Transfer",
    icon: RefreshCw,
    variant: "secondary" as const,
    description: "Items moved between locations",
  },
};

export default function TransactionsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [itemFilter, setItemFilter] = useState("all");

  const { inventory, transactions, stats, exportData, importData } =
    useInventory(); // Ensure useInventory fetches from API

  // Get unique items that have transactions
  const itemsWithTransactions = useMemo(() => {
    const itemIds = new Set(transactions.map((t) => t.itemId));
    return inventory
      .filter((item) => itemIds.has(item.id!))
      .filter(
        (item): item is InventoryItem & { id: string } =>
          typeof item.id === "string"
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [inventory, transactions]);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    let filtered = transactions;

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter((t) => t.type === typeFilter);
    }

    // Item filter
    if (itemFilter !== "all") {
      filtered = filtered.filter((t) => t.itemId === itemFilter);
    }

    // Date filter
    if (dateFilter !== "all") {
      const now = new Date();
      const filterStartDate = new Date(); // This will be the start of the filter period

      switch (dateFilter) {
        case "today":
          filterStartDate.setHours(0, 0, 0, 0);
          break;
        case "week":
          filterStartDate.setDate(now.getDate() - 7); // Past 7 days
          filterStartDate.setHours(0, 0, 0, 0);
          break;
        case "month":
          filterStartDate.setMonth(now.getMonth() - 1); // Past month
          filterStartDate.setHours(0, 0, 0, 0);
          break;
        case "quarter":
          filterStartDate.setMonth(now.getMonth() - 3); // Past quarter
          filterStartDate.setHours(0, 0, 0, 0);
          break;
        default:
          // For 'all' or unrecognized, don't apply a date filter
          break;
      }

      if (dateFilter !== "all") {
        filtered = filtered.filter(
          (t) => new Date(t.createdAt) >= filterStartDate
        );
      }
    }

    return filtered.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [transactions, typeFilter, itemFilter, dateFilter]);

  const transactionStats = useMemo(() => {
    const totalTransactions = filteredTransactions.length;
    let totalStockInValue = 0;
    let totalStockOutValue = 0;
    let totalGrossProfit = 0;
    let totalLossSales = 0;

    filteredTransactions.forEach((t) => {
      if (t.type === "stock_in") {
        totalStockInValue += t.totalAmount;
      } else if (t.type === "stock_out") {
        totalStockOutValue += t.totalAmount;
        const soldItem = inventory.find((item) => item.id === t.itemId);
        if (soldItem) {
          const profit = (t.unitPrice - soldItem.buyPrice) * t.quantity;
          if (profit > 0) {
            totalGrossProfit += profit;
          } else {
            totalLossSales += Math.abs(profit);
          }
        }
      }
    });

    const netFlow = totalStockOutValue - totalStockInValue;

    return {
      totalTransactions,
      totalStockInValue,
      totalStockOutValue,
      netFlow,
      totalGrossProfit,
      totalLossSales,
    };
  }, [filteredTransactions, inventory]);

  const getItemName = (itemId: string) => {
    const item = inventory.find((i) => i.id === itemId);
    return item?.name || `Unknown Item (ID: ${itemId})`;
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const importedData = JSON.parse(e.target?.result as string);
            const success = await importData(importedData);
            if (success) {
              alert("Data imported successfully!");
            } else {
              alert("Invalid file format");
            }
          } catch {
            alert("Error reading file");
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const hasActiveFilters =
    typeFilter !== "all" || dateFilter !== "all" || itemFilter !== "all";

  const handleDownloadPdfSummary = async (period: string) => {
    try {
      const response = await fetch(`/api/daily-summaries?range=${period}`);
      if (!response.ok) {
        throw new Error(
          `Error fetching ${period} summary: ${response.statusText}`
        );
      }
      const summaryData: DailySummaryResult = await response.json();

      if (!summaryData || summaryData.totalTransactionsCount === 0) {
        alert(
          `No transaction data found for the ${period} period to generate a summary.`
        );
        return;
      }

      const doc = new jsPDF();
      let yOffset = 20;

      // Title
      doc.setFontSize(24);
      doc.text("Inventory Summary Report", 105, yOffset, { align: "center" });
      yOffset += 15;

      // Period
      doc.setFontSize(14);
      // Use the 'date' field from summaryData, which will be "Aggregated: start - end" for range, or actual date for 'today'
      doc.text(
        `Period: ${
          summaryData.date || period.charAt(0).toUpperCase() + period.slice(1)
        }`,
        10,
        yOffset
      );
      yOffset += 10;
      doc.text(`Generated On: ${formatDate(new Date())}`, 10, yOffset);
      yOffset += 20;

      // Key Metrics - For a 5-year-old
      doc.setFontSize(18);
      doc.text("Here's what happened:", 10, yOffset);
      yOffset += 10;

      const addMetric = (label: string, value: number, color?: string) => {
        doc.setFontSize(14);
        doc.text(label, 20, yOffset);
        doc.setTextColor(color || "#000000");
        doc.setFont("helvetica", "bold");
        doc.text(formatCurrency(value), 190, yOffset, { align: "right" });
        doc.setTextColor("#000000");
        doc.setFont("helvetica", "normal");
        yOffset += 8;
      };

      doc.setFontSize(14);
      doc.text(
        `Total transactions: ${summaryData.totalTransactionsCount} times!`,
        20,
        yOffset
      );
      yOffset += 15;

      addMetric(
        "Money we earned (Sales Revenue):",
        summaryData.totalMoneyIn,
        "#22C55E"
      );
      addMetric(
        "Money we spent (Purchase Cost):",
        summaryData.totalMoneyOut,
        "#3B82F6"
      );

      yOffset += 10;

      let netFlowColor = "#6B7280";
      let netFlowEmoji = "😐";
      let netFlowText = "You broke even!";
      if (summaryData.netFlow > 0) {
        netFlowColor = "#10B981";
        netFlowEmoji = "💰";
        netFlowText = "Great job! You made money!";
      } else if (summaryData.netFlow < 0) {
        netFlowColor = "#EF4444";
        netFlowEmoji = "💸";
        netFlowText = "Oops! You spent more than you earned.";
      }

      doc.setFontSize(16);
      doc.setTextColor(netFlowColor);
      doc.setFont("helvetica", "bold");
      doc.text(
        `Overall Money Flow: ${formatCurrency(
          summaryData.netFlow
        )} ${netFlowEmoji}`,
        20,
        yOffset
      );
      doc.setFontSize(12);
      doc.text(netFlowText, 20, yOffset + 7);
      doc.setTextColor("#000000");
      doc.setFont("helvetica", "normal");
      yOffset += 20;

      doc.setFontSize(14);
      addMetric(
        "Profit from good sales:",
        summaryData.grossProfitFromSales,
        "#22C55E"
      );
      addMetric(
        "Loss from tricky sales:",
        summaryData.lossFromBelowCostSales,
        "#EF4444"
      );

      // Footer
      doc.setFontSize(10);
      doc.text(
        "--- End of Report ---",
        105,
        doc.internal.pageSize.height - 15,
        { align: "center" }
      );

      doc.save(
        `inventory-summary-${period}-${
          new Date().toISOString().split("T")[0]
        }.pdf`
      );
      alert(`Downloaded ${period} summary PDF.`);
    } catch (error: unknown) {
      console.error("Download summary error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      alert(`Failed to download ${period} summary: ${errorMessage}`);
    }
  };

  return (
    <div className={`min-h-screen bg-gray-100 ${darkMode ? "dark" : ""}`}>
      {/* Navigation */}
      <Navbar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onExport={exportData}
        onImport={handleImport}
      />

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar */}
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          stats={stats}
        />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
          <div className="max-w-7xl mx-auto p-4 lg:p-8 space-y-6">
            {/* Page Header */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                Transaction History
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Track all inventory movements and financial transactions.
              </p>
            </div>

            {/* Transaction Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    Total Transactions
                  </CardTitle>
                  <Calendar className="h-4 w-4 text-gray-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {transactionStats.totalTransactions}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    Total Purchases
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-blue-500" />{" "}
                  {/* Blue icon for purchase costs */}
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-500">
                    {formatCurrency(transactionStats.totalStockInValue)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    Total Sales Revenue
                  </CardTitle>
                  <TrendingDown className="h-4 w-4 text-green-500" />{" "}
                  {/* Green icon for sales revenue */}
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-500">
                    {formatCurrency(transactionStats.totalStockOutValue)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    Net Profit/Loss
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-gray-400" />
                </CardHeader>
                <CardContent>
                  <div
                    className={`text-2xl font-bold ${
                      transactionStats.netFlow > 0
                        ? "text-green-600 dark:text-green-500"
                        : transactionStats.netFlow < 0
                        ? "text-red-600 dark:text-red-500"
                        : "text-gray-600 dark:text-gray-400"
                    }`}
                  >
                    {formatCurrency(transactionStats.netFlow)}
                  </div>
                  {/* Displays total gross profit and total loss sales breakdown */}
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Gross Profit:{" "}
                    <span className="text-green-600 dark:text-green-500 font-medium">
                      {formatCurrency(transactionStats.totalGrossProfit)}
                    </span>{" "}
                    | Loss Sales:{" "}
                    <span className="text-red-600 dark:text-red-500 font-medium">
                      {formatCurrency(transactionStats.totalLossSales)}
                    </span>
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card>
              <CardContent className="p-4 md:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                  {/* Type Filter */}
                  <div className="flex flex-col gap-1.5">
                    <Label
                      htmlFor="type-filter"
                      className="text-gray-700 dark:text-gray-300"
                    >
                      Transaction Type
                    </Label>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger id="type-filter">
                        <SelectValue placeholder="All Types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        {Object.keys(transactionTypeConfig).map((type) => (
                          <SelectItem key={type} value={type}>
                            {
                              transactionTypeConfig[
                                type as keyof typeof transactionTypeConfig
                              ].label
                            }
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Item Filter */}
                  <div className="flex flex-col gap-1.5">
                    <Label
                      htmlFor="item-filter"
                      className="text-gray-700 dark:text-gray-300"
                    >
                      Item Name
                    </Label>
                    <Select value={itemFilter} onValueChange={setItemFilter}>
                      <SelectTrigger id="item-filter">
                        <SelectValue placeholder="All Items" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Items</SelectItem>
                        {itemsWithTransactions.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Date Filter */}
                  <div className="flex flex-col gap-1.5">
                    <Label
                      htmlFor="date-filter"
                      className="text-gray-700 dark:text-gray-300"
                    >
                      Date Range
                    </Label>
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

                  {/* Clear Filters Button */}
                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setTypeFilter("all");
                        setItemFilter("all");
                        setDateFilter("all");
                      }}
                      disabled={!hasActiveFilters}
                      className="w-full flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                    >
                      <XCircle className="h-4 w-4" />
                      Clear Filters
                    </Button>
                  </div>
                </div>

                {/* Download Summary Buttons */}
                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex flex-wrap gap-3">
                  <h3 className="w-full text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Download Summary Reports (PDF)
                  </h3>
                  <Button
                    variant="secondary"
                    onClick={() => handleDownloadPdfSummary("today")}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" /> Daily Summary
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => handleDownloadPdfSummary("week")}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" /> Weekly Summary
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => handleDownloadPdfSummary("month")}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" /> Monthly Summary
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => handleDownloadPdfSummary("quarter")}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" /> Quarterly Summary
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-gray-100">
                  Transaction History ({filteredTransactions.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {filteredTransactions.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
                      No transactions found
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {transactions.length === 0
                        ? "Start making transactions to see them here."
                        : "Try adjusting your filters to see more transactions."}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="[&_tr]:border-b border-gray-200 dark:border-gray-700">
                        <TableRow className="bg-gray-50 hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-800">
                          <TableHead className="text-gray-600 dark:text-gray-300">
                            Date & Time
                          </TableHead>
                          <TableHead className="text-gray-600 dark:text-gray-300">
                            Item
                          </TableHead>
                          <TableHead className="text-gray-600 dark:text-gray-300">
                            Type
                          </TableHead>
                          <TableHead className="text-gray-600 dark:text-gray-300">
                            Quantity
                          </TableHead>
                          <TableHead className="text-gray-600 dark:text-gray-300">
                            Unit Price
                          </TableHead>
                          <TableHead className="text-gray-600 dark:text-gray-300">
                            Financial Impact
                          </TableHead>
                          <TableHead className="text-gray-600 dark:text-gray-300">
                            Reference
                          </TableHead>
                          <TableHead className="text-gray-600 dark:text-gray-300">
                            Notes
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredTransactions.map((transaction) => {
                          const config =
                            transactionTypeConfig[
                              transaction.type as keyof typeof transactionTypeConfig
                            ];
                          const Icon = config ? config.icon : RefreshCw;
                          // Find item here for profit/loss calculation
                          const item = inventory.find(
                            (i) => i.id === transaction.itemId
                          );

                          let financialImpactAmount = transaction.totalAmount;
                          let financialImpactColorClass =
                            "text-gray-900 dark:text-gray-100";
                          let financialImpactLabel = "";

                          if (transaction.type === "stock_out") {
                            if (item) {
                              const profitPerUnit =
                                item.sellPrice - item.buyPrice;
                              const totalProfit =
                                profitPerUnit * transaction.quantity;
                              financialImpactAmount = totalProfit; // Display profit/loss for sales

                              if (totalProfit > 0) {
                                financialImpactColorClass =
                                  "text-green-600 dark:text-green-500";
                                financialImpactLabel = "Profit";
                              } else if (totalProfit < 0) {
                                financialImpactColorClass =
                                  "text-red-600 dark:text-red-500";
                                financialImpactLabel = "Loss";
                              } else {
                                financialImpactColorClass =
                                  "text-gray-600 dark:text-gray-400";
                                financialImpactLabel = "Break-Even Sale";
                              }
                            } else {
                              // Item not found, display sale revenue in green as a general inflow
                              financialImpactColorClass =
                                "text-green-600 dark:text-green-500";
                              financialImpactLabel = "Sale Revenue";
                              financialImpactAmount = transaction.totalAmount;
                            }
                          } else if (transaction.type === "stock_in") {
                            // Purchases are costs, display in blue
                            financialImpactColorClass =
                              "text-blue-600 dark:text-blue-500";
                            financialImpactLabel = "Purchase Cost";
                            financialImpactAmount = transaction.totalAmount; // Display actual cost
                          } else {
                            // Default for adjustment, transfer etc.
                            financialImpactLabel = "Net Value";
                          }

                          return (
                            <TableRow key={transaction.id}>
                              <TableCell className="align-top py-3">
                                <div className="space-y-0.5">
                                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                    {formatDate(transaction.createdAt)}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(
                                      transaction.createdAt
                                    ).toLocaleTimeString()}
                                  </p>
                                </div>
                              </TableCell>

                              <TableCell className="align-top py-3">
                                <p className="font-medium text-gray-900 dark:text-gray-100">
                                  {getItemName(transaction.itemId)}
                                </p>
                              </TableCell>

                              <TableCell className="align-top py-3">
                                <Badge
                                  variant={mapStatusToBadgeVariant(
                                    config?.variant || "secondary"
                                  )}
                                  className={`flex items-center gap-1 w-fit ${
                                    config?.variant === "success"
                                      ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                                      : config?.variant === "warning"
                                      ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
                                      : config?.variant === "destructive"
                                      ? "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                                      : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                                  }`}
                                >
                                  <Icon className="h-3 w-3" />
                                  {config?.label || transaction.type}
                                </Badge>
                              </TableCell>

                              <TableCell className="align-top py-3">
                                <span className="font-medium text-gray-900 dark:text-gray-100">
                                  {transaction.quantity}
                                </span>
                              </TableCell>

                              <TableCell className="align-top py-3 text-gray-900 dark:text-gray-100">
                                {formatCurrency(transaction.unitPrice)}
                              </TableCell>

                              {/* MODIFIED: Financial Impact column */}
                              <TableCell className="align-top py-3">
                                <span
                                  className={`font-semibold ${financialImpactColorClass}`}
                                >
                                  {formatCurrency(financialImpactAmount)}
                                </span>
                                {financialImpactLabel && (
                                  <p className="text-xs text-muted-foreground">
                                    {financialImpactLabel}
                                  </p>
                                )}
                              </TableCell>

                              <TableCell className="align-top py-3">
                                {transaction.reference && (
                                  <code className="text-xs bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-gray-700 dark:text-gray-200">
                                    {transaction.reference}
                                  </code>
                                )}
                              </TableCell>

                              <TableCell className="align-top py-3">
                                {transaction.notes && (
                                  <p className="text-xs text-muted-foreground max-w-[150px] truncate">
                                    {transaction.notes}
                                  </p>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
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
