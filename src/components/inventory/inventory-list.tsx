// components/inventory/inventory-list.tsx
"use client";

import React, { useState } from "react";
import {
  Package,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Edit,
  Trash2,
  MoreVertical,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { InventoryItem } from "@/lib/types/inventory";
import {
  formatCurrency,
  getStockStatus,
  mapStatusToBadgeVariant,
} from "@/lib/utils";

interface InventoryListProps {
  items: InventoryItem[];
  onStockTransaction: (
    item: InventoryItem,
    type: "stock_in" | "stock_out" | "adjustment"
  ) => void;
  onEdit: (item: InventoryItem) => void;
  onDelete: (item: InventoryItem) => void;
  onViewDetails: (item: InventoryItem) => void;
}

export default function InventoryList({
  items,
  onStockTransaction,
  onEdit,
  onDelete,
  onViewDetails,
}: InventoryListProps) {
  // selectedItems should only store IDs of items that actually have an ID
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // toggleSelectItem expects a string ID, so ensure it's called with one
  const toggleSelectItem = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const selectAllItems = () => {
    if (
      selectedItems.size ===
      items.filter((item) => typeof item.id === "string").length
    ) {
      // Clear selection if all currently displayed items with IDs are selected
      setSelectedItems(new Set());
    } else {
      // Select all items that have a defined ID
      setSelectedItems(
        new Set(
          items
            .map((item) => item.id)
            .filter((id): id is string => typeof id === "string")
        )
      );
    }
  };

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Package className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
            No inventory items
          </h3>
          <p className="text-sm text-muted-foreground text-center mb-4">
            Get started by adding your first inventory item.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Bulk Actions */}
      {selectedItems.size > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {selectedItems.size} item{selectedItems.size !== 1 ? "s" : ""}{" "}
                selected
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  Bulk Export
                </Button>
                <Button variant="destructive" size="sm">
                  Delete Selected
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Desktop Table View */}
      <Card className="hidden md:block">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-gray-100">
            Inventory Items
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader className="[&_tr]:border-b border-gray-200 dark:border-gray-700">
              <TableRow className="bg-gray-50 hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-800">
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    checked={
                      selectedItems.size ===
                        items.filter((item) => typeof item.id === "string")
                          .length && items.length > 0
                    }
                    onChange={selectAllItems}
                    className="rounded dark:bg-gray-700 dark:border-gray-600 dark:checked:bg-blue-500"
                  />
                </TableHead>
                <TableHead className="text-gray-600 dark:text-gray-300">
                  Item
                </TableHead>
                <TableHead className="text-gray-600 dark:text-gray-300">
                  Category
                </TableHead>
                <TableHead className="text-gray-600 dark:text-gray-300">
                  Stock
                </TableHead>
                <TableHead className="text-gray-600 dark:text-gray-300">
                  Prices
                </TableHead>
                <TableHead className="text-gray-600 dark:text-gray-300">
                  Value
                </TableHead>
                <TableHead className="text-gray-600 dark:text-gray-300">
                  Status
                </TableHead>
                <TableHead className="text-gray-600 dark:text-gray-300 text-center">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => {
                const stockStatus = getStockStatus(
                  item.currentStock,
                  item.minStockLevel
                );
                const currentValue = item.currentStock * item.buyPrice;
                const potentialProfit =
                  (item.sellPrice - item.buyPrice) * item.currentStock;

                return (
                  // Assuming items in this list always have an ID for React key
                  <TableRow
                    key={item.id!}
                    className="text-gray-900 dark:text-gray-100"
                  >
                    <TableCell className="py-3">
                      <input
                        type="checkbox"
                        checked={
                          typeof item.id === "string"
                            ? selectedItems.has(item.id)
                            : false
                        }
                        onChange={() =>
                          typeof item.id === "string" &&
                          toggleSelectItem(item.id)
                        }
                        className="rounded dark:bg-gray-700 dark:border-gray-600 dark:checked:bg-blue-500"
                      />
                    </TableCell>

                    <TableCell className="py-3">
                      <div className="space-y-0.5">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          SKU: {item.sku}
                        </p>
                        {item.description && (
                          <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="py-3">
                      <Badge variant="secondary">{item.category}</Badge>
                    </TableCell>

                    <TableCell className="py-3">
                      <div className="space-y-0.5">
                        <p className="font-medium">{item.currentStock}</p>
                        <p className="text-xs text-muted-foreground">
                          Min: {item.minStockLevel}
                        </p>
                      </div>
                    </TableCell>

                    <TableCell className="py-3">
                      <div className="space-y-0.5">
                        <p className="text-xs text-muted-foreground">
                          Buy: {formatCurrency(item.buyPrice)}
                        </p>
                        <p className="text-xs">
                          Sell: {formatCurrency(item.sellPrice)}
                        </p>
                      </div>
                    </TableCell>

                    <TableCell className="py-3">
                      <div className="space-y-0.5">
                        <p className="font-medium">
                          {formatCurrency(currentValue)}
                        </p>
                        <p
                          className={`text-xs ${
                            potentialProfit >= 0
                              ? "text-green-600 dark:text-green-500"
                              : "text-red-600 dark:text-red-500"
                          }`}
                        >
                          P/L: {formatCurrency(potentialProfit)}
                        </p>
                      </div>
                    </TableCell>

                    <TableCell className="py-3">
                      <Badge
                        variant={mapStatusToBadgeVariant(stockStatus.variant)}
                        className={
                          stockStatus.variant === "success"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                            : stockStatus.variant === "warning"
                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
                            : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                        }
                      >
                        {stockStatus.status.replace("_", " ").toUpperCase()}
                      </Badge>
                    </TableCell>

                    <TableCell className="py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onViewDetails(item)}
                          className="h-8 w-8"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onStockTransaction(item, "stock_in")}
                          className="h-8 w-8 text-green-600 hover:text-green-700"
                          title="Stock In"
                        >
                          <TrendingUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onStockTransaction(item, "stock_out")}
                          className="h-8 w-8 text-red-600 hover:text-red-700"
                          disabled={item.currentStock <= 0}
                          title="Stock Out"
                        >
                          <TrendingDown className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit(item)}
                          className="h-8 w-8"
                          title="Edit Item"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDelete(item)}
                          className="h-8 w-8 text-red-600 hover:text-red-700"
                          title="Delete Item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {items.map((item) => {
          const stockStatus = getStockStatus(
            item.currentStock,
            item.minStockLevel
          );
          const currentValue = item.currentStock * item.buyPrice;
          const potentialProfit =
            (item.sellPrice - item.buyPrice) * item.currentStock;

          return (
            // Assuming items in this list always have an ID for React key
            <Card key={item.id!} className="relative dark:bg-gray-800">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 flex items-center gap-2">
                    {/* FIXED: Added type guard for item.id */}
                    <input
                      type="checkbox"
                      checked={
                        typeof item.id === "string"
                          ? selectedItems.has(item.id)
                          : false
                      }
                      onChange={() =>
                        typeof item.id === "string" && toggleSelectItem(item.id)
                      }
                      className="rounded dark:bg-gray-700 dark:border-gray-600 dark:checked:bg-blue-500"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                        {item.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {item.category} • SKU: {item.sku}
                      </p>
                    </div>
                    <Badge
                      variant={mapStatusToBadgeVariant(stockStatus.variant)}
                      className={
                        stockStatus.variant === "success"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                          : stockStatus.variant === "warning"
                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
                          : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                      }
                    >
                      {stockStatus.status.replace("_", " ")}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4 text-sm border-t pt-4 border-gray-200 dark:border-gray-700">
                  <div>
                    <p className="text-muted-foreground">Stock Level</p>
                    <p className="font-medium flex items-center gap-1 text-gray-900 dark:text-gray-100">
                      {item.currentStock}
                      {item.currentStock <= item.minStockLevel && (
                        <AlertTriangle className="h-3 w-3 text-yellow-500 ml-1" />
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Current Value</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {formatCurrency(currentValue)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Buy / Sell Price</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {formatCurrency(item.buyPrice)} /{" "}
                      {formatCurrency(item.sellPrice)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Potential P/L</p>
                    <p
                      className={`font-medium ${
                        potentialProfit >= 0
                          ? "text-green-600 dark:text-green-500"
                          : "text-red-600 dark:text-red-500"
                      }`}
                    >
                      {formatCurrency(potentialProfit)}
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewDetails(item)}
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
                  >
                    <Eye className="h-4 w-4" />
                    Details
                  </Button>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onStockTransaction(item, "stock_in")}
                      className="flex items-center gap-1 text-green-600 border-green-200 hover:bg-green-50"
                    >
                      <TrendingUp className="h-4 w-4" />
                      In
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onStockTransaction(item, "stock_out")}
                      disabled={item.currentStock <= 0}
                      className="flex items-center gap-1 text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <TrendingDown className="h-4 w-4" />
                      Out
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(item)}>
                          <Edit className="mr-2 h-4 w-4" /> Edit Item
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onDelete(item)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete Item
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
