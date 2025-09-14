"use client";

import React, { useMemo } from "react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import { StockTransaction } from "@/lib/types/inventory";
import { InventoryItem } from "@/lib/types/inventory";
import { formatCurrency } from "@/lib/utils";

interface ProfitLossChartProps {
  transactions: StockTransaction[];
  inventory: InventoryItem[];
  period: "week" | "month" | "quarter" | "year";
  onPeriodChange: (period: "week" | "month" | "quarter" | "year") => void;
}

interface ChartDataPoint {
  date: string;
  revenue: number;
  cost: number;
  profit: number;
  margin: number;
  transactions: number;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    color: string;
    name: string;
    value: number;
    dataKey: string;
  }>;
  label?: string;
}

export default function ProfitLossChart({
  transactions,
  inventory,
  period,
  onPeriodChange,
}: ProfitLossChartProps) {
  const [chartType, setChartType] = React.useState<"line" | "area" | "bar">(
    "line"
  );

  const chartData = useMemo(() => {
    const days =
      period === "week"
        ? 7
        : period === "month"
        ? 30
        : period === "quarter"
        ? 90
        : 365;

    const dataPoints: ChartDataPoint[] = [];
    const grouping = period === "year" ? "month" : "day";

    if (grouping === "day") {
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateKey = date.toISOString().split("T")[0];

        const dayTransactions = transactions.filter(
          (t) => t.createdAt.split("T")[0] === dateKey
        );

        const revenue = dayTransactions
          .filter((t) => t.type === "stock_out")
          .reduce((sum, t) => sum + t.totalAmount, 0);

        const cost = dayTransactions
          .filter((t) => t.type === "stock_in")
          .reduce((sum, t) => sum + t.totalAmount, 0);

        const profit = dayTransactions
          .filter((t) => t.type === "stock_out")
          .reduce((sum, t) => {
            const item = inventory.find((i) => i.id === t.itemId);
            if (item) {
              return sum + (t.unitPrice - item.buyPrice) * t.quantity;
            }
            return sum;
          }, 0);

        const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

        dataPoints.push({
          date: date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          revenue,
          cost,
          profit,
          margin,
          transactions: dayTransactions.length,
        });
      }
    } else {
      for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const year = date.getFullYear();
        const month = date.getMonth();

        const monthTransactions = transactions.filter((t) => {
          const tDate = new Date(t.createdAt);
          return tDate.getFullYear() === year && tDate.getMonth() === month;
        });

        const revenue = monthTransactions
          .filter((t) => t.type === "stock_out")
          .reduce((sum, t) => sum + t.totalAmount, 0);

        const cost = monthTransactions
          .filter((t) => t.type === "stock_in")
          .reduce((sum, t) => sum + t.totalAmount, 0);

        const profit = monthTransactions
          .filter((t) => t.type === "stock_out")
          .reduce((sum, t) => {
            const item = inventory.find((i) => i.id === t.itemId);
            if (item) {
              return sum + (t.unitPrice - item.buyPrice) * t.quantity;
            }
            return sum;
          }, 0);

        const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

        dataPoints.push({
          date: date.toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
          }),
          revenue,
          cost,
          profit,
          margin,
          transactions: monthTransactions.length,
        });
      }
    }

    return dataPoints;
  }, [transactions, inventory, period]);

  const totalStats = useMemo(() => {
    return chartData.reduce(
      (acc, point) => ({
        revenue: acc.revenue + point.revenue,
        cost: acc.cost + point.cost,
        profit: acc.profit + point.profit,
        transactions: acc.transactions + point.transactions,
      }),
      { revenue: 0, cost: 0, profit: 0, transactions: 0 }
    );
  }, [chartData]);

  const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3">
          <p className="font-semibold">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}:{" "}
              {entry.dataKey === "margin"
                ? `${entry.value.toFixed(1)}%`
                : formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    const commonProps = {
      data: chartData,
      margin: { top: 5, right: 30, left: 20, bottom: 5 },
    };

    switch (chartType) {
      case "area":
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area
              type="monotone"
              dataKey="revenue"
              stackId="1"
              stroke="#3b82f6"
              fill="#3b82f6"
              fillOpacity={0.6}
              name="Revenue"
            />
            <Area
              type="monotone"
              dataKey="cost"
              stackId="2"
              stroke="#ef4444"
              fill="#ef4444"
              fillOpacity={0.6}
              name="Cost"
            />
            <Area
              type="monotone"
              dataKey="profit"
              stackId="3"
              stroke="#10b981"
              fill="#10b981"
              fillOpacity={0.6}
              name="Profit"
            />
          </AreaChart>
        );

      case "bar":
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="revenue" fill="#3b82f6" name="Revenue" />
            <Bar dataKey="cost" fill="#ef4444" name="Cost" />
            <Bar dataKey="profit" fill="#10b981" name="Profit" />
          </BarChart>
        );

      default:
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#3b82f6"
              strokeWidth={2}
              name="Revenue"
              dot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="cost"
              stroke="#ef4444"
              strokeWidth={2}
              name="Cost"
              dot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="profit"
              stroke="#10b981"
              strokeWidth={2}
              name="Profit"
              dot={{ r: 4 }}
            />
          </LineChart>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-lg font-bold text-primary">
                  {formatCurrency(totalStats.revenue)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary opacity-60" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Cost</p>
                <p className="text-lg font-bold text-destructive">
                  {formatCurrency(totalStats.cost)}
                </p>
              </div>
              <TrendingDown className="h-8 w-8 text-destructive opacity-60" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Net Profit</p>
                <p
                  className={`text-lg font-bold ${
                    totalStats.profit >= 0 ? "text-success" : "text-destructive"
                  }`}
                >
                  {formatCurrency(totalStats.profit)}
                </p>
              </div>
              <BarChart3
                className={`h-8 w-8 opacity-60 ${
                  totalStats.profit >= 0 ? "text-success" : "text-destructive"
                }`}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Transactions</p>
                <p className="text-lg font-bold">{totalStats.transactions}</p>
              </div>
              <Badge variant="secondary" className="text-xs">
                {period}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Profit & Loss Analysis
            </CardTitle>
            <div className="flex gap-2">
              <Select
                value={period}
                onValueChange={(value: string) =>
                  onPeriodChange(value as "week" | "month" | "quarter" | "year")
                }
              >
                <option value="week">Past Week</option>
                <option value="month">Past Month</option>
                <option value="quarter">Past Quarter</option>
                <option value="year">Past Year</option>
              </Select>
              <Select
                value={chartType}
                onValueChange={(value: string) =>
                  setChartType(value as "line" | "area" | "bar")
                }
              >
                <option value="line">Line Chart</option>
                <option value="area">Area Chart</option>
                <option value="bar">Bar Chart</option>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No transaction data available for the selected period.</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              {renderChart()}
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Profit Margin Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Profit Margin Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip
                formatter={(value: number) => [
                  `${value.toFixed(1)}%`,
                  "Profit Margin",
                ]}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Line
                type="monotone"
                dataKey="margin"
                stroke="#f59e0b"
                strokeWidth={2}
                name="Profit Margin %"
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
