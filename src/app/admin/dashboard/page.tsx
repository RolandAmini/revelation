"use client";

import React, { useState, useMemo } from "react";
import {
  Plus,
  Package,
  DollarSign,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/layout/navbar";
import Sidebar from "@/components/layout/sidebar";
import AddItemForm from "@/components/inventory/add-item-form";
import QuickSaleForm from "@/components/inventory/quick-sale-form";
import ReceiptGenerator from "@/components/common/receipt-generator";
import { useInventory } from "@/lib/hooks/use-inventory";
import { InventoryItem } from "@/lib/types/inventory";
import { formatCurrency, getStockStatus } from "@/lib/utils";

const mapStatusToBadgeVariant = (statusVariant: string) => {
  switch (statusVariant) {
    case "success":
      return "default";
    case "warning":
      return "secondary";
    case "destructive":
      return "destructive";
    case "in_stock":
      return "default";
    case "low_stock":
      return "secondary";
    case "out_of_stock":
      return "destructive";
    default:
      return "default";
  }
};

interface ReceiptData {
  type: "sale";
  items: {
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
  subtotal: number;
  total: number;
  customerInfo: { name: string; phone: string };
  receiptNumber: string;
  date: string;
}

const SIDEBAR_WIDTH_CLASS = "w-64";

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showSaleForm, setShowSaleForm] = useState(false);
  const [selectedSaleItem, setSelectedSaleItem] =
    useState<InventoryItem | null>(null);

  const [showReceiptDisplay, setShowReceiptDisplay] = useState(false);
  const [receiptDataToDisplay, setReceiptDataToDisplay] =
    useState<ReceiptData | null>(null);

  const {
    inventory,
    stats,
    addItem,
    recordTransaction,
    exportData,
    importData,
  } = useInventory();

  const categories = useMemo(
    () => Array.from(new Set(inventory.map((item) => item.category))),
    [inventory]
  );

  const handleAddItem = (
    itemData: Omit<InventoryItem, "id" | "createdAt" | "updatedAt">
  ) => {
    addItem(itemData);
    setShowAddForm(false);
  };

  const handleStockIn = (item: InventoryItem) => {
    const quantity = prompt("Enter quantity to add:");
    if (quantity && parseInt(quantity) > 0) {
      if (item.id) {
        recordTransaction(item.id, {
          type: "stock_in",
          quantity: parseInt(quantity),
          unitPrice: item.buyPrice,
          totalAmount: parseInt(quantity) * item.buyPrice,
        });
      } else {
        console.error("Item ID is undefined, cannot record transaction.");
      }
    }
  };

  const handleQuickSale = (item: InventoryItem) => {
    setSelectedSaleItem(item);
    setShowSaleForm(true);
  };

  const handleRecordSale = (
    itemId: string,
    quantity: number,
    salePrice: number,
    customerInfo: { name: string; phone: string },
    shouldGenerateReceipt: boolean
  ) => {
    recordTransaction(itemId, {
      type: "stock_out",
      quantity,
      unitPrice: salePrice,
      totalAmount: quantity * salePrice,
      notes: "Quick sale from dashboard",
    });

    if (shouldGenerateReceipt) {
      const soldItem = inventory.find((item) => item.id === itemId);
      if (!soldItem) {
        console.error("Sold item not found for receipt generation:", itemId);
        return;
      }

      const receipt: ReceiptData = {
        type: "sale",
        items: [
          {
            name: soldItem.name,
            quantity,
            unitPrice: salePrice,
            total: quantity * salePrice,
          },
        ],
        subtotal: quantity * salePrice,
        total: quantity * salePrice,
        customerInfo,
        receiptNumber: `R${Date.now()}`,
        date: new Date().toLocaleDateString(),
      };

      setReceiptDataToDisplay(receipt);
      setShowReceiptDisplay(true);
    }

    setShowSaleForm(false);
    setSelectedSaleItem(null);
  };

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
            if (success) {
              alert("Data imported successfully!");
            } else {
              alert("Invalid file format or failed import.");
            }
          } catch {
            alert("Error reading or parsing file.");
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const lowStockItems = inventory.filter(
    (item) => item.currentStock > 0 && item.currentStock <= item.minStockLevel
  );
  const outOfStockItems = inventory.filter((item) => item.currentStock === 0);

  return (
    <div className={`min-h-screen bg-background ${darkMode ? "dark" : ""}`}>
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
          className={`${SIDEBAR_WIDTH_CLASS} fixed left-0 top-16 h-[calc(100vh-4rem)] z-40 transition-transform duration-300 ease-in-out ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } lg:translate-x-0`}
        />

        <main
          className={`flex-1 overflow-y-auto bg-background transition-all duration-300 ease-in-out
                      ${
                        sidebarOpen
                          ? `ml-${SIDEBAR_WIDTH_CLASS.replace("w-", "")}`
                          : "ml-0"
                      } lg:ml-${SIDEBAR_WIDTH_CLASS.replace("w-", "")}`}
        >
          <div className="max-w-7xl mx-auto p-4 lg:p-8 space-y-8">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                {/* Use text-foreground for dynamic text color */}
                <h1 className="text-3xl font-bold text-foreground">
                  Tableau de bord
                </h1>
                <p className="text-muted-foreground">
                 Bienvenue ! Voici un aperçu de votre inventaire.
                </p>
              </div>
              <Button
                onClick={() => setShowAddForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
              Ajouter un article
              </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="bg-card text-card-foreground">
                {" "}
                {/* Use bg-card/text-card-foreground */}
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                   Total des articles
                  </CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    {stats.totalItems}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Articles en inventaire
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card text-card-foreground">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                  Valeur totale
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-500">
                    {formatCurrency(stats.totalValue)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Valeur actuelle de l&apos;inventaire
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card text-card-foreground">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Bénéfice total
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div
                    className={`text-2xl font-bold ${
                      stats.totalProfit >= 0
                        ? "text-green-600 dark:text-green-500"
                        : "text-red-600 dark:text-red-500"
                    }`}
                  >
                    {formatCurrency(stats.totalProfit)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Revenus moins coûts
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card text-card-foreground">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Alertes boursières
                  </CardTitle>
                  <AlertTriangle className="h-4 w-4 text-yellow-500 dark:text-yellow-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-500">
                    {lowStockItems.length + outOfStockItems.length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                   Les éléments nécessitent une attention particulière
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Stock Alerts */}
            {(lowStockItems.length > 0 || outOfStockItems.length > 0) && (
              <Card className="border-yellow-300 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-700">
                <CardHeader>
                  <CardTitle className="text-yellow-700 dark:text-yellow-300 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Stock Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {outOfStockItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between items-center p-3 bg-red-50 border border-red-200 rounded-lg dark:bg-red-950 dark:border-red-700"
                      >
                        <span className="font-medium text-red-800 dark:text-red-300">
                          {item.name}
                        </span>
                        <Button
                          size="sm"
                          onClick={() => handleStockIn(item)}
                          className="bg-red-600 hover:bg-red-700 text-white"
                        >
                          Restock
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Inventory Items */}
            <Card className="bg-card text-card-foreground">
              <CardHeader>
                <CardTitle className="text-foreground">
                  Recent Inventory Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                {inventory.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      No inventory items
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Get started by adding your first item
                    </p>
                    <Button
                      onClick={() => setShowAddForm(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Item
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {inventory.slice(0, 5).map((item) => {
                      const status = getStockStatus(
                        item.currentStock,
                        item.minStockLevel
                      );
                      return (
                        <div
                          key={item.id}
                          className="flex justify-between items-center p-4 border border-border rounded-lg bg-background"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-foreground">
                                {item.name}
                              </h4>
                              <Badge
                                variant={mapStatusToBadgeVariant(
                                  status.variant
                                )}
                                className={
                                  status.variant === "success"
                                    ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                                    : status.variant === "warning"
                                    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
                                    : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                                }
                              >
                                {status.status.replace("_", " ").toUpperCase()}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {item.category} • Stock: {item.currentStock} •
                              Buy: {formatCurrency(item.buyPrice)} • Sell:{" "}
                              {formatCurrency(item.sellPrice)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStockIn(item)}
                              className="text-blue-600 border-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-700 dark:hover:bg-blue-900/20"
                            >
                              Stock In
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleQuickSale(item)}
                              disabled={item.currentStock <= 0}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              Quick Sale
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      <AddItemForm
        open={showAddForm}
        onOpenChange={setShowAddForm}
        onSubmit={handleAddItem}
        categories={categories}
      />

      {showSaleForm && selectedSaleItem && (
        <QuickSaleForm
          item={selectedSaleItem}
          onSale={handleRecordSale}
          onClose={() => {
            setShowSaleForm(false);
            setSelectedSaleItem(null);
          }}
        />
      )}

      {showReceiptDisplay && receiptDataToDisplay && (
        <ReceiptGenerator
          data={receiptDataToDisplay}
          onClose={() => {
            setShowReceiptDisplay(false);
            setReceiptDataToDisplay(null);
          }}
        />
      )}
    </div>
  );
}
