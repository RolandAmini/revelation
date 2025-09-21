// components/inventory/add-item-form.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Package } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { InventoryItem } from "@/lib/types/inventory"; // Assuming this type exists

// Define a type for the data managed *by the form state itself*
// This type explicitly does NOT include 'id', 'createdAt', 'updatedAt'
type AddItemFormDataType = Omit<
  InventoryItem,
  "id" | "createdAt" | "updatedAt"
>;

interface AddItemFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // MODIFIED: onSubmit now takes AddItemFormDataType PLUS an optional 'id'
  onSubmit: (
    itemData: AddItemFormDataType & { id?: string } // Combined type for onSubmit
  ) => void | Promise<void>; // <--- Change this line
  categories: string[];
  itemToEdit?: InventoryItem | null;
}

const CATEGORY_SELECT_PLACEHOLDER = "__SELECT_CATEGORY_PLACEHOLDER__";
const CATEGORY_ADD_NEW_OPTION = "__ADD_NEW_CATEGORY__";

export default function AddItemForm({
  open,
  onOpenChange,
  onSubmit,
  categories,
  itemToEdit,
}: AddItemFormProps) {
  const isEditing = !!itemToEdit;

  // Use the defined AddItemFormDataType for initial state and formData
  const initialFormState: AddItemFormDataType = useMemo(
    () => ({
      name: "",
      description: "",
      category: "",
      sku: "",
      currentStock: 0,
      minStockLevel: 10,
      maxStockLevel: 100,
      buyPrice: 0,
      sellPrice: 0,
      supplier: "",
      location: "",
    }),
    []
  );

  const [formData, setFormData] =
    useState<AddItemFormDataType>(initialFormState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isNewCategoryInputActive, setIsNewCategoryInputActive] =
    useState(false);

  useEffect(() => {
    if (open) {
      if (isEditing && itemToEdit) {
        setFormData({
          name: itemToEdit.name,
          description: itemToEdit.description || "",
          category: itemToEdit.category,
          sku: itemToEdit.sku,
          buyPrice: itemToEdit.buyPrice,
          sellPrice: itemToEdit.sellPrice,
          currentStock: itemToEdit.currentStock,
          minStockLevel: itemToEdit.minStockLevel,
          maxStockLevel: itemToEdit.maxStockLevel || 100,
          supplier: itemToEdit.supplier || "",
          location: itemToEdit.location || "",
        });
        setIsNewCategoryInputActive(!categories.includes(itemToEdit.category));
      } else {
        setFormData(initialFormState);
        setIsNewCategoryInputActive(false);
      }
      setErrors({});
    }
  }, [open, isEditing, itemToEdit, categories, initialFormState]);

  const handleInputChange = (
    field: keyof AddItemFormDataType, // Use AddItemFormDataType here
    value: string | number
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const generateSKU = () => {
    const prefix = formData.category
      ? formData.category.substring(0, 3).toUpperCase()
      : "ITM";
    const suffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    const sku = `${prefix}-${suffix}`;
    setFormData((prev) => ({ ...prev, sku }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Product name is required.";
    }
    if (!formData.category.trim()) {
      newErrors.category = "Category is required.";
    }
    if (!formData.sku.trim()) {
      newErrors.sku = "SKU is required.";
    }
    if (isNaN(formData.buyPrice ?? 0) || (formData.buyPrice ?? 0) <= 0) {
      newErrors.buyPrice = "Buy price must be a positive number.";
    }
    if (isNaN(formData.sellPrice ?? 0) || (formData.sellPrice ?? 0) <= 0) {
      newErrors.sellPrice = "Sell price must be a positive number.";
    }
    if (
      (formData.buyPrice ?? 0) > 0 &&
      (formData.sellPrice ?? 0) <= (formData.buyPrice ?? 0)
    ) {
      newErrors.sellPrice = "Sell price must be greater than buy price.";
    }
    if (isNaN(formData.currentStock ?? 0) || (formData.currentStock ?? 0) < 0) {
      newErrors.currentStock = "Current stock cannot be negative.";
    }
    if (
      isNaN(formData.minStockLevel ?? 0) ||
      (formData.minStockLevel ?? 0) < 0
    ) {
      newErrors.minStockLevel = "Min stock level cannot be negative.";
    }
    if (
      isNaN(formData.maxStockLevel ?? 0) ||
      (formData.maxStockLevel ?? 0) < (formData.minStockLevel ?? 0)
    ) {
      newErrors.maxStockLevel =
        "Max stock must be greater than or equal to min stock.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Now, explicitly create the object that matches the onSubmit prop's type
    const submitData: AddItemFormDataType & { id?: string } = isEditing
      ? { ...formData, id: itemToEdit!.id }
      : { ...formData, id: undefined }; // Explicitly set id to undefined for new items

    onSubmit(submitData);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const displayCategoryValue = useMemo(() => {
    if (isNewCategoryInputActive) return CATEGORY_ADD_NEW_OPTION;
    if (formData.category && categories.includes(formData.category))
      return formData.category;
    return CATEGORY_SELECT_PLACEHOLDER;
  }, [formData.category, isNewCategoryInputActive, categories]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <Package className="h-5 w-5 text-blue-600" />
            {isEditing
              ? `Edit Item: ${itemToEdit?.name}`
              : "Add New Inventory Item"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the details for this inventory item."
              : "Fill in the details for a new inventory item."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-6 py-4">
          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 border-b pb-2">
           Informations de base
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="item-name">Nom du produit *</Label>
                <Input
                  id="item-name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Enter product name"
                  className={`mt-1 ${errors.name ? "border-destructive" : ""}`}
                  autoComplete="off"
                />
                {errors.name && (
                  <p className="text-xs text-destructive mt-1">{errors.name}</p>
                )}
              </div>
              <div>
                <Label htmlFor="item-category">Catégorie *</Label>
                <div className="mt-1 space-y-2">
                  <Select
                    value={displayCategoryValue}
                    onValueChange={(value) => {
                      if (value === CATEGORY_ADD_NEW_OPTION) {
                        setIsNewCategoryInputActive(true);
                        handleInputChange("category", "");
                      } else if (value === CATEGORY_SELECT_PLACEHOLDER) {
                        setIsNewCategoryInputActive(false);
                        handleInputChange("category", "");
                      } else {
                        setIsNewCategoryInputActive(false);
                        handleInputChange("category", value);
                      }
                    }}
                  >
                    <SelectTrigger
                      id="item-category"
                      className={errors.category ? "border-destructive" : ""}
                    >
                      <SelectValue placeholder="Select existing category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={CATEGORY_SELECT_PLACEHOLDER}>
                       Sélectionnez une catégorie existante
                      </SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                      <SelectItem
                        value={CATEGORY_ADD_NEW_OPTION}
                        className="font-semibold text-blue-600"
                      >
                      + Ajouter une nouvelle catégorie
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  {isNewCategoryInputActive && (
                    <Input
                      placeholder="Type new category name"
                      value={formData.category}
                      onChange={(e) =>
                        handleInputChange("category", e.target.value)
                      }
                      className={`w-full ${
                        errors.category ? "border-destructive" : ""
                      }`}
                      autoComplete="off"
                    />
                  )}
                </div>
                {errors.category && (
                  <p className="text-xs text-destructive mt-1">
                    {errors.category}
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="item-description">Description (Optional)</Label>
              <Textarea
                id="item-description"
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                placeholder="Product description"
                rows={3}
                className="mt-1"
                autoComplete="off"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="item-sku">SKU *</Label>
                <div className="mt-1 flex gap-2">
                  <Input
                    id="item-sku"
                    type="text"
                    value={formData.sku}
                    onChange={(e) => handleInputChange("sku", e.target.value)}
                    placeholder="Product SKU"
                    className={errors.sku ? "border-destructive" : ""}
                    autoComplete="off"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={generateSKU}
                    disabled={!formData.category}
                    className="whitespace-nowrap"
                  >
                    Générer
                  </Button>
                </div>
                {errors.sku && (
                  <p className="text-xs text-destructive mt-1">{errors.sku}</p>
                )}
              </div>

              <div>
                <Label htmlFor="item-supplier">Fournisseur(Optional)</Label>
                <Input
                  id="item-supplier"
                  type="text"
                  value={formData.supplier}
                  onChange={(e) =>
                    handleInputChange("supplier", e.target.value)
                  }
                  placeholder="Supplier name"
                  className="mt-1"
                  autoComplete="off"
                />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 border-b pb-2">
             Tarifs
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="buy-price">Prix ​​dachat *</Label>
                <Input
                  id="buy-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.buyPrice === 0 ? "" : formData.buyPrice}
                  onChange={(e) =>
                    handleInputChange(
                      "buyPrice",
                      parseFloat(e.target.value) || 0
                    )
                  }
                  placeholder="0.00"
                  className={`mt-1 ${
                    errors.buyPrice ? "border-destructive" : ""
                  }`}
                  autoComplete="off"
                />
                {errors.buyPrice && (
                  <p className="text-xs text-destructive mt-1">
                    {errors.buyPrice}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="sell-price">Prix ​​de vente*</Label>
                <Input
                  id="sell-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.sellPrice === 0 ? "" : formData.sellPrice}
                  onChange={(e) =>
                    handleInputChange(
                      "sellPrice",
                      parseFloat(e.target.value) || 0
                    )
                  }
                  placeholder="0.00"
                  className={`mt-1 ${
                    errors.sellPrice ? "border-destructive" : ""
                  }`}
                  autoComplete="off"
                />
                {errors.sellPrice && (
                  <p className="text-xs text-destructive mt-1">
                    {errors.sellPrice}
                  </p>
                )}
              </div>
            </div>

            {formData.buyPrice > 0 && formData.sellPrice > 0 && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-700">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Marge bénéficiaire:</span>{" "}
                  <span
                    className={
                      formData.sellPrice > formData.buyPrice
                        ? "text-green-600 dark:text-green-500 font-semibold"
                        : "text-red-600 dark:text-red-500 font-semibold"
                    }
                  >
                    {formatCurrency(formData.sellPrice - formData.buyPrice)} (
                    {(
                      ((formData.sellPrice - formData.buyPrice) /
                        formData.buyPrice) *
                      100
                    ).toFixed(1)}
                    %)
                  </span>
                </p>
              </div>
            )}
          </section>

          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 border-b pb-2">
           Gestion des stocks
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="current-stock">Stock initial</Label>
                <Input
                  id="current-stock"
                  type="number"
                  min="0"
                  value={
                    formData.currentStock === 0 ? "" : formData.currentStock
                  }
                  onChange={(e) =>
                    handleInputChange(
                      "currentStock",
                      parseInt(e.target.value) || 0
                    )
                  }
                  placeholder="0"
                  className="mt-1"
                  autoComplete="off"
                  disabled={isEditing}
                  title={
                    isEditing
                      ? "Adjust stock using 'Stock In' or 'Stock Out' transactions"
                      : ""
                  }
                />
                {errors.currentStock && (
                  <p className="text-xs text-destructive mt-1">
                    {errors.currentStock}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="min-stock">Niveau de stock minimum</Label>
                <Input
                  id="min-stock"
                  type="number"
                  min="0"
                  value={
                    formData.minStockLevel === 0 ? "" : formData.minStockLevel
                  }
                  onChange={(e) =>
                    handleInputChange(
                      "minStockLevel",
                      parseInt(e.target.value) || 0
                    )
                  }
                  placeholder="10"
                  className="mt-1"
                  autoComplete="off"
                />
                {errors.minStockLevel && (
                  <p className="text-xs text-destructive mt-1">
                    {errors.minStockLevel}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="max-stock">Niveau de stock maximum</Label>
                <Input
                  id="max-stock"
                  type="number"
                  min="0"
                  value={
                    formData.maxStockLevel === 0 ? "" : formData.maxStockLevel
                  }
                  onChange={(e) =>
                    handleInputChange(
                      "maxStockLevel",
                      parseInt(e.target.value) || 0
                    )
                  }
                  placeholder="100"
                  className="mt-1"
                  autoComplete="off"
                />
                {errors.maxStockLevel && (
                  <p className="text-xs text-destructive mt-1">
                    {errors.maxStockLevel}
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="storage-location">
               Emplacement de stockage (Optional)
              </Label>
              <Input
                id="storage-location"
                type="text"
                value={formData.location}
                onChange={(e) => handleInputChange("location", e.target.value)}
                placeholder="e.g., Warehouse A, Shelf 3"
                className="mt-1"
                autoComplete="off"
              />
            </div>
          </section>

          <DialogFooter className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isEditing ? "Save Changes" : "Add Item"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
