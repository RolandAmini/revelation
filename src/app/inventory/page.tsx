// pages/inventory.tsx
"use client";

import React, { useState, useMemo } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Navbar from "@/components/layout/navbar";
import Sidebar from "@/components/layout/sidebar";
import InventoryList from "@/components/inventory/inventory-list";
import InventoryFilters from "@/components/inventory/inventory-filters";
import AddItemForm from "@/components/inventory/add-item-form";
import StockTransactionForm from "@/components/inventory/stock-transaction-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useInventory } from "@/lib/hooks/use-inventory";
import {
  InventoryItem,
  CreateInventoryItemData,
  UpdateInventoryItemData,
} from "@/lib/types/inventory";
import { getStockStatus, formatCurrency, formatDate } from "@/lib/utils";

// Helper function to map your internal status variants to shadcn/ui's Badge variants

export default function InventoryPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [showStockTransaction, setShowStockTransaction] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [transactionType, setTransactionType] = useState<
    "stock_in" | "stock_out" | "adjustment"
  >("stock_in");

  const [showEditItem, setShowEditItem] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<InventoryItem | null>(null);

  const [showItemDetails, setShowItemDetails] = useState(false);
  const [itemForDetails, setItemForDetails] = useState<InventoryItem | null>(
    null
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name_asc");

  const {
    inventory,
    stats,
    addItem,
    updateItem,
    deleteItem,
    recordTransaction,
    exportData,
    importData,
  } = useInventory();

  const categories = useMemo(
    () => Array.from(new Set(inventory.map((item) => item.category))),
    [inventory]
  );

  const filteredInventory = useMemo(() => {
    const filtered = inventory.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        categoryFilter === "all" || item.category === categoryFilter;

      let matchesStatus = true;
      if (statusFilter !== "all") {
        const status = getStockStatus(item.currentStock, item.minStockLevel);
        matchesStatus = status.status === statusFilter;
      }

      return matchesSearch && matchesCategory && matchesStatus;
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name_asc":
          return a.name.localeCompare(b.name);
        case "name_desc":
          return b.name.localeCompare(a.name);
        case "stock_asc":
          return a.currentStock - b.currentStock;
        case "stock_desc":
          return b.currentStock - a.currentStock;
        case "value_asc":
          return a.currentStock * a.buyPrice - b.currentStock * b.buyPrice;
        case "value_desc":
          return b.currentStock * b.buyPrice - a.currentStock * a.buyPrice;
        case "updated_desc":
          return (
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
        default:
          return 0;
      }
    });

    return filtered;
  }, [inventory, searchTerm, categoryFilter, statusFilter, sortBy]);

  const handleStockTransaction = (
    item: InventoryItem,
    type: "stock_in" | "stock_out" | "adjustment"
  ) => {
    setSelectedItem(item);
    setTransactionType(type);
    setShowStockTransaction(true);
  };

  const handleEdit = (item: InventoryItem) => {
    setItemToEdit(item);
    setShowEditItem(true);
  };

  const handleAddItemSubmit = (itemData: CreateInventoryItemData) => {
    addItem(itemData);
    setShowAddItem(false);
  };

  const handleUpdateItem = async (
    id: string,
    itemData: UpdateInventoryItemData
  ) => {
    await updateItem(id, itemData);
    setShowEditItem(false);
    setItemToEdit(null);
   alert(`Item "${itemData.name || "Item"}" updated successfully!`);
  };

  const handleDelete = async (item: InventoryItem) => {
    if (
      confirm(
        `Are you sure you want to delete "${item.name}"? This action cannot be undone.`
      )
    ) {
      try {
        if (item.id) {
          await deleteItem(item.id);
          alert(`Item "${item.name}" deleted successfully!`);
        } else {
          throw new Error("Item ID is missing.");
        }
      } catch (error) {
        console.error("Failed to delete item:", error);
        alert(`Failed to delete "${item.name}". Please try again.`);
      }
    }
  };

  const handleViewDetails = (item: InventoryItem) => {
    setItemForDetails(item);
    setShowItemDetails(true);
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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                Inventaire
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                 Gérez vos articles en stock et vos niveaux de stock.
                </p>
              </div>
              <Button
                onClick={() => setShowAddItem(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
             Ajouter un article
              </Button>
            </div>

            <Card className="p-6">
              <CardHeader className="p-0 pb-4">
                <CardTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Filtrer et trier l'inventaire
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <InventoryFilters
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                  categoryFilter={categoryFilter}
                  onCategoryChange={setCategoryFilter}
                  statusFilter={statusFilter}
                  onStatusChange={setStatusFilter}
                  sortBy={sortBy}
                  onSortChange={setSortBy}
                  categories={categories}
                  onExport={exportData}
                  onImport={handleImport}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-gray-100">
                 Articles en stock
                </CardTitle>
              </CardHeader>
              <CardContent>
                <InventoryList
                  items={filteredInventory}
                  onStockTransaction={handleStockTransaction}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onViewDetails={handleViewDetails}
                />
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      <AddItemForm
        open={showAddItem}
        onOpenChange={setShowAddItem}
        onSubmit={handleAddItemSubmit}
        categories={categories}
      />

      <AddItemForm
        open={showEditItem}
        onOpenChange={setShowEditItem}
        onSubmit={(data) => {
          if (itemToEdit?.id) {
            handleUpdateItem(itemToEdit.id, data);
          }
        }}
        categories={categories}
        itemToEdit={itemToEdit}
      />

      <StockTransactionForm
        open={showStockTransaction}
        onOpenChange={setShowStockTransaction}
        item={selectedItem}
        type={transactionType}
        onSubmit={recordTransaction}
      />

      {showItemDetails && itemForDetails && (
        <Dialog open={showItemDetails} onOpenChange={setShowItemDetails}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-gray-900 dark:text-gray-100">
                {itemForDetails.name} Details
              </DialogTitle>
              <DialogDescription>
               Vue d'ensemble de votre article en stock.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4 text-gray-900 dark:text-gray-100">
              <div>
                <Label className="text-muted-foreground">SKU</Label>
                <p className="font-medium">{itemForDetails.sku}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Description</Label>
                <p>{itemForDetails.description || "N/A"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Categorie</Label>
                <Badge variant="secondary">{itemForDetails.category}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Stock actuel</Label>
                  <p className="font-medium">{itemForDetails.currentStock}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">
                    Niveau de stock minimum
                  </Label>
                  <p className="font-medium">{itemForDetails.minStockLevel}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Prix d&apos;achat</Label>
                  <p className="font-medium">
                    {formatCurrency(itemForDetails.buyPrice)}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Prix ​​de vente</Label>
                  <p className="font-medium">
                    {formatCurrency(itemForDetails.sellPrice)}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Créé à</Label>
                  <p className="font-medium">
                    {formatDate(itemForDetails.createdAt)}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Dernière mise à jour</Label>
                  <p className="font-medium">
                    {formatDate(itemForDetails.updatedAt)}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setShowItemDetails(false)}>Fermer</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
