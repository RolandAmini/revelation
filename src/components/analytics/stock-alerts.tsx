"use client";

import React from "react";
import { AlertTriangle, Package, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InventoryItem } from "@/lib/types/inventory";
import { formatCurrency, getStockStatus } from "@/lib/utils";

interface StockAlertsProps {
  items: InventoryItem[];
  onStockIn: (item: InventoryItem) => void;
}

export default function StockAlerts({ items, onStockIn }: StockAlertsProps) {
  const lowStockItems = items.filter(
    (item) => item.currentStock > 0 && item.currentStock <= item.minStockLevel
  );

  const outOfStockItems = items.filter((item) => item.currentStock === 0);

  const overstockItems = items.filter(
    (item) => item.maxStockLevel && item.currentStock > item.maxStockLevel
  );

  if (
    lowStockItems.length === 0 &&
    outOfStockItems.length === 0 &&
    overstockItems.length === 0
  ) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-success" />
            Stock Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-success mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-success mb-2">
              All Good! 🎉
            </h3>
            <p className="text-sm text-muted-foreground">
              All your inventory items are properly stocked.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Out of Stock - Critical */}
      {outOfStockItems.length > 0 && (
        <Card className="border-destructive bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Critical: Out of Stock ({outOfStockItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {outOfStockItems.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-background rounded-lg border border-destructive/20"
                >
                  <div className="flex-1">
                    <h4 className="font-medium">{item.name}</h4>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <span>SKU: {item.sku}</span>
                      <span>Category: {item.category}</span>
                      <span>
                        Value Lost:{" "}
                        {formatCurrency(item.sellPrice * item.minStockLevel)}
                      </span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => onStockIn(item)}
                    className="ml-4"
                  >
                    Restock Now
                  </Button>
                </div>
              ))}
              {outOfStockItems.length > 5 && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  And {outOfStockItems.length - 5} more items...
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Low Stock - Warning */}
      {lowStockItems.length > 0 && (
        <Card className="border-warning bg-warning/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-warning">
              <TrendingDown className="h-5 w-5" />
              Warning: Low Stock ({lowStockItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lowStockItems.slice(0, 5).map((item) => {
                const daysLeft = Math.floor(
                  item.currentStock / Math.max(1, item.minStockLevel / 7)
                );

                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-background rounded-lg border border-warning/20"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{item.name}</h4>
                        <Badge
                          variant="outline"
                          className="text-xs border-yellow-500 text-yellow-700"
                        >
                          {item.currentStock} left
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Min: {item.minStockLevel}</span>
                        <span>Est. {daysLeft} days left</span>
                        <span>Reorder: {item.minStockLevel * 2} units</span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onStockIn(item)}
                      className="ml-4"
                    >
                      Restock
                    </Button>
                  </div>
                );
              })}
              {lowStockItems.length > 5 && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  And {lowStockItems.length - 5} more items...
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overstock - Info */}
      {overstockItems.length > 0 && (
        <Card className="border-blue-500 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-600">
              <Package className="h-5 w-5" />
              Info: Overstocked ({overstockItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {overstockItems.slice(0, 3).map((item) => {
                const excessStock =
                  item.currentStock - (item.maxStockLevel || 0);
                const excessValue = excessStock * item.buyPrice;

                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-background rounded-lg border border-blue-200"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{item.name}</h4>
                        <Badge variant="secondary" className="text-xs">
                          +{excessStock} excess
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Current: {item.currentStock}</span>
                        <span>Max: {item.maxStockLevel}</span>
                        <span>Excess Value: {formatCurrency(excessValue)}</span>
                      </div>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      <p>Consider reducing</p>
                      <p>future orders</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
