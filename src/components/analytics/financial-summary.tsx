"use client";

import React from "react";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Package,
  Calendar,
  Target,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InventoryStats } from "@/lib/types/inventory";
import { formatCurrency } from "@/lib/utils";

interface FinancialSummaryProps {
  stats: InventoryStats;
}

export default function FinancialSummary({ stats }: FinancialSummaryProps) {
  const netProfit = stats.totalProfit - stats.totalLoss;
  const monthlyNet = stats.monthlyProfit - stats.monthlyLoss;
  const profitMargin =
    stats.totalProfit > 0 ? (netProfit / stats.totalProfit) * 100 : 0;

  const summaryCards = [
    {
      title: "Total Inventory Value",
      value: formatCurrency(stats.totalValue),
      icon: Package,
      description: `${stats.totalItems} items in stock`,
      trend: null,
      color: "text-blue-600",
    },
    {
      title: "Total Profit",
      value: formatCurrency(stats.totalProfit),
      icon: TrendingUp,
      description: "All-time profits",
      trend: stats.totalProfit > 0 ? "positive" : "neutral",
      color: "text-green-600",
    },
    {
      title: "Total Loss",
      value: formatCurrency(stats.totalLoss),
      icon: TrendingDown,
      description: "All-time losses",
      trend: stats.totalLoss > 0 ? "negative" : "neutral",
      color: "text-red-600",
    },
    {
      title: "Net Profit",
      value: formatCurrency(netProfit),
      icon: DollarSign,
      description: "Profit minus losses",
      trend:
        netProfit > 0 ? "positive" : netProfit < 0 ? "negative" : "neutral",
      color:
        netProfit > 0
          ? "text-green-600"
          : netProfit < 0
          ? "text-red-600"
          : "text-muted-foreground",
    },
    {
      title: "Monthly Profit",
      value: formatCurrency(stats.monthlyProfit),
      icon: Calendar,
      description: "This month's profits",
      trend: stats.monthlyProfit > 0 ? "positive" : "neutral",
      color: "text-green-600",
    },
    {
      title: "Profit Margin",
      value: `${profitMargin.toFixed(1)}%`,
      icon: Target,
      description: "Overall margin",
      trend:
        profitMargin > 20
          ? "positive"
          : profitMargin > 10
          ? "neutral"
          : "negative",
      color:
        profitMargin > 20
          ? "text-green-600"
          : profitMargin > 10
          ? "text-yellow-600"
          : "text-red-600",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;

          return (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {card.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${card.color}`}>
                  {card.value}
                </div>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-muted-foreground">
                    {card.description}
                  </p>
                  {card.trend && (
                    <Badge
                      variant={
                        card.trend === "positive"
                          ? "default"
                          : card.trend === "negative"
                          ? "destructive"
                          : "secondary"
                      }
                      className={`text-xs ${
                        card.trend === "positive"
                          ? "bg-green-100 text-green-800 hover:bg-green-200"
                          : ""
                      }`}
                    >
                      {card.trend === "positive"
                        ? "↗"
                        : card.trend === "negative"
                        ? "↘"
                        : "→"}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Detailed Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Profit Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                All-time Profit
              </span>
              <span className="font-semibold text-green-600">
                {formatCurrency(stats.totalProfit)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">This Month</span>
              <span className="font-semibold text-green-600">
                {formatCurrency(stats.monthlyProfit)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                Monthly Growth
              </span>
              <Badge
                variant={monthlyNet > 0 ? "default" : "destructive"}
                className={
                  monthlyNet > 0
                    ? "bg-green-100 text-green-800 hover:bg-green-200"
                    : ""
                }
              >
                {monthlyNet > 0 ? "+" : ""}
                {formatCurrency(monthlyNet)}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              Inventory Health
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Items</span>
              <span className="font-semibold">{stats.totalItems}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                Low Stock Items
              </span>
              <Badge
                variant={stats.lowStockItems > 0 ? "outline" : "default"}
                className={
                  stats.lowStockItems > 0
                    ? "border-yellow-500 text-yellow-700"
                    : "bg-green-100 text-green-800 hover:bg-green-200"
                }
              >
                {stats.lowStockItems}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                Out of Stock
              </span>
              <Badge
                variant={stats.outOfStockItems > 0 ? "destructive" : "default"}
                className={
                  stats.outOfStockItems === 0
                    ? "bg-green-100 text-green-800 hover:bg-green-200"
                    : ""
                }
              >
                {stats.outOfStockItems}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
