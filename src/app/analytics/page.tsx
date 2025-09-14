"use client";

import React, { useState, useMemo } from "react";
import { BarChart3, PieChart, TrendingUp, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Cell,
  Pie,
} from "recharts";
import Navbar from "@/components/layout/navbar";
import Sidebar from "@/components/layout/sidebar";
import FinancialSummary from "@/components/analytics/financial-summary";
import { useInventory } from "@/lib/hooks/use-inventory";
import { formatCurrency } from "@/lib/utils";

const CHART_COLORS = [
  "#3b82f6",
  "#ef4444",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
];

export default function AnalyticsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [dateRange, setDateRange] = useState("month");

  const { inventory, transactions, stats, exportData, importData } =
    useInventory();

  // Prepare chart data
  const profitTrendData = useMemo(() => {
    const days = dateRange === "week" ? 7 : dateRange === "month" ? 30 : 90;
    const data = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      const dayTransactions = transactions.filter(
        (t) => t.createdAt.split("T")[0] === dateStr && t.type === "stock_out"
      );

      const dayProfit = dayTransactions.reduce((sum, t) => {
        const item = inventory.find((i) => i.id === t.itemId);
        if (!item) return sum;
        return sum + (t.unitPrice - item.buyPrice) * t.quantity;
      }, 0);

      const dayRevenue = dayTransactions.reduce(
        (sum, t) => sum + t.totalAmount,
        0
      );

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
  }, [transactions, inventory, dateRange]);

  const categoryData = useMemo(() => {
    const categoryStats = new Map();

    inventory.forEach((item) => {
      const current = categoryStats.get(item.category) || {
        category: item.category,
        value: 0,
        items: 0,
        profit: 0,
      };

      current.value += item.currentStock * item.buyPrice;
      current.items += 1;

      // Calculate profit from transactions
      const itemTransactions = transactions.filter(
        (t) => t.itemId === item.id && t.type === "stock_out"
      );
      current.profit += itemTransactions.reduce(
        (sum, t) => sum + (t.unitPrice - item.buyPrice) * t.quantity,
        0
      );

      categoryStats.set(item.category, current);
    });

    return Array.from(categoryStats.values());
  }, [inventory, transactions]);

  const topPerformingItems = useMemo(() => {
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
      .slice(0, 10);
  }, [inventory, transactions]);

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
            const result = await importData(importedData);
            if (result) {
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

  return (
    <div className={`min-h-screen bg-background ${darkMode ? "dark" : ""}`}>
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
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          stats={stats}
        />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-4 lg:p-8 space-y-8">
            {/* Page Header */}
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold">Analytics</h1>
                <p className="text-muted-foreground">
                  Detailed insights into your inventory performance.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Select value={dateRange} onValueChange={setDateRange}>
                  <option value="week">Past Week</option>
                  <option value="month">Past Month</option>
                  <option value="quarter">Past Quarter</option>
                </Select>
                <Button variant="outline" onClick={exportData}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Report
                </Button>
              </div>
            </div>

            {/* Financial Summary */}
            <FinancialSummary stats={stats} />

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Profit Trend */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Profit & Revenue Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={profitTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip
                        formatter={(value: number) => formatCurrency(value)}
                      />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        name="Revenue"
                      />
                      <Line
                        type="monotone"
                        dataKey="profit"
                        stroke="#10b981"
                        strokeWidth={2}
                        name="Profit"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Category Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Category Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ category, value }) =>
                          `${category}: ${formatCurrency(value ?? 0)}`
                        }
                      >
                        {categoryData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={CHART_COLORS[index % CHART_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => formatCurrency(value)}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Category Performance */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Category Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={categoryData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" />
                      <YAxis />
                      <Tooltip
                        formatter={(value: number) => formatCurrency(value)}
                      />
                      <Bar dataKey="profit" fill="#10b981" name="Profit" />
                      <Bar
                        dataKey="value"
                        fill="#3b82f6"
                        name="Inventory Value"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Top Performers */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Performing Items</CardTitle>
                </CardHeader>
                <CardContent>
                  {topPerformingItems.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No sales data available yet.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {topPerformingItems.slice(0, 5).map((item, index) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                              {index + 1}
                            </div>
                            <div>
                              <h4 className="font-medium">{item.name}</h4>
                              <p className="text-xs text-muted-foreground">
                                {item.unitsSold} units sold
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-success">
                              {formatCurrency(item.profit)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatCurrency(item.revenue)} revenue
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
