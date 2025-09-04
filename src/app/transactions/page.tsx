"use client";

import React, { useState, useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Calendar,
  DollarSign,
  XCircle, // New icon for clear filters
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
// IMPORTANT: Ensure you have shadcn/ui's Select, SelectTrigger, SelectContent, SelectItem, SelectValue
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label"; // Imported Label for better form semantics
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

const transactionTypeConfig = {
  stock_in: {
    label: "Stock In",
    icon: TrendingUp,
    variant: "success" as const,
    description: "Items added to inventory",
  },
  stock_out: {
    label: "Stock Out",
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
  // If 'transfer' is not used, you might remove it or fully implement its logic
  transfer: {
    label: "Transfer",
    icon: RefreshCw, // Or a different icon for transfer
    variant: "secondary" as const, // Changed to secondary for general default
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
    useInventory();

  // Get unique items that have transactions
  const itemsWithTransactions = useMemo(() => {
    const itemIds = new Set(transactions.map((t) => t.itemId));
    return inventory
      .filter((item) => itemIds.has(item.id!)) // Add ! here, assuming items in transactions have IDs
      .filter(
        (item): item is InventoryItem & { id: string } =>
          typeof item.id === "string"
      ) // Explicitly filter for defined IDs
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
      const filterDate = new Date(); // This will be the start of the filter period

      switch (dateFilter) {
        case "today":
          filterDate.setHours(0, 0, 0, 0);
          break;
        case "week":
          filterDate.setDate(now.getDate() - 7);
          filterDate.setHours(0, 0, 0, 0); // Start of the day 7 days ago
          break;
        case "month":
          filterDate.setMonth(now.getMonth() - 1);
          filterDate.setDate(1); // Start of the month 1 month ago
          filterDate.setHours(0, 0, 0, 0);
          break;
        case "quarter":
          filterDate.setMonth(now.getMonth() - 3);
          filterDate.setDate(1); // Start of the month 3 months ago
          filterDate.setHours(0, 0, 0, 0);
          break;
        default:
          // For 'all' or unrecognized, don't apply a date filter
          break;
      }

      if (dateFilter !== "all") {
        filtered = filtered.filter((t) => new Date(t.createdAt) >= filterDate);
      }
    }

    return filtered.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [transactions, typeFilter, itemFilter, dateFilter]);

  // Calculate transaction stats
  const transactionStats = useMemo(() => {
    const totalTransactions = filteredTransactions.length;
    const totalStockInValue = filteredTransactions
      .filter((t) => t.type === "stock_in")
      .reduce((sum, t) => sum + t.totalAmount, 0);
    const totalStockOutValue = filteredTransactions
      .filter((t) => t.type === "stock_out")
      .reduce((sum, t) => sum + t.totalAmount, 0);
    const netFlow = totalStockOutValue - totalStockInValue; // Assuming stock_out is revenue, stock_in is cost

    return {
      totalTransactions,
      totalStockInValue,
      totalStockOutValue,
      netFlow,
    };
  }, [filteredTransactions]);

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
        reader.onload = (e) => {
          try {
            const importedData = JSON.parse(e.target?.result as string);
            if (importData(importedData)) {
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
                    Stock In Value
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-500" />{" "}
                  {/* Changed to explicit green */}
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-500">
                    {formatCurrency(transactionStats.totalStockInValue)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    Stock Out Value
                  </CardTitle>
                  <TrendingDown className="h-4 w-4 text-red-500" />{" "}
                  {/* Changed to explicit red */}
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600 dark:text-red-500">
                    {formatCurrency(transactionStats.totalStockOutValue)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    Net Flow
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
                    {formatCurrency(Math.abs(transactionStats.netFlow))}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {transactionStats.netFlow > 0
                      ? "Net Profit"
                      : transactionStats.netFlow < 0
                      ? "Net Outflow"
                      : "Net Zero"}
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
                        <SelectItem value="all">All Items</SelectItem>
                        {itemsWithTransactions.map((item) => (
                          // item.id is now guaranteed to be 'string' due to the filter above
                          <SelectItem key={item.id} value={item.id}>
                            {item.name}
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
                    {" "}
                    {/* Align button to the bottom if other inputs are taller */}
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
                            Total Amount
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

                          return (
                            <TableRow key={transaction.id}>
                              <TableCell className="align-top py-3">
                                {" "}
                                {/* Aligned top for multi-line content */}
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

                              <TableCell className="align-top py-3">
                                <span
                                  className={`font-semibold ${
                                    transaction.type === "stock_out"
                                      ? "text-red-600 dark:text-red-500"
                                      : "text-green-600 dark:text-green-500"
                                  }`}
                                >
                                  {formatCurrency(transaction.totalAmount)}
                                </span>
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
