"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InventoryItem, StockTransaction } from "@/lib/types/inventory";
// import { validateStockTransaction } from "@/lib/validations";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import { validateStockTransaction } from "@/lib/validations";

interface StockTransactionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InventoryItem | null;
  type: "stock_in" | "stock_out" | "adjustment";
  onSubmit: (
    itemId: string,
    transaction: Omit<StockTransaction, "id" | "itemId" | "createdAt">
  ) => void;
}

const transactionTypes = {
  stock_in: {
    label: "Stock In",
    icon: TrendingUp,
    description: "Add items to inventory",
    color: "text-success",
  },
  stock_out: {
    label: "Stock Out",
    icon: TrendingDown,
    description: "Remove items from inventory",
    color: "text-destructive",
  },
  adjustment: {
    label: "Stock Adjustment",
    icon: RefreshCw,
    description: "Adjust stock to exact quantity",
    color: "text-warning",
  },
};

export default function StockTransactionForm({
  open,
  onOpenChange,
  item,
  type,
  onSubmit,
}: StockTransactionFormProps) {
  const [formData, setFormData] = useState({
    quantity: 1,
    unitPrice: 0,
    reference: "",
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const transactionConfig = transactionTypes[type];
  const Icon = transactionConfig.icon;

  useEffect(() => {
    if (item && open) {
      setFormData({
        quantity: type === "adjustment" ? item.currentStock : 1,
        unitPrice: type === "stock_out" ? item.sellPrice : item.buyPrice,
        reference: "",
        notes: "",
      });
      setErrors({});
    }
  }, [item, type, open]);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const calculateNewStock = () => {
    if (!item) return 0;

    switch (type) {
      case "stock_in":
        return item.currentStock + formData.quantity;
      case "stock_out":
        return Math.max(0, item.currentStock - formData.quantity);
      case "adjustment":
        return formData.quantity;
      default:
        return item.currentStock;
    }
  };

  const isStockSufficient = () => {
    if (type !== "stock_out" || !item) return true;
    return formData.quantity <= item.currentStock;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!item) return;

    const validation = validateStockTransaction({
      quantity: formData.quantity,
      unitPrice: formData.unitPrice,
      type,
    });

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    if (!isStockSufficient()) {
      setErrors({ quantity: "Insufficient stock available" });
      return;
    }

    setLoading(true);

    try {
      const transaction = {
        type,
        quantity: formData.quantity,
        unitPrice: formData.unitPrice,
        totalAmount: formData.quantity * formData.unitPrice,
        reference: formData.reference || undefined,
        notes: formData.notes || undefined,
      };

      await onSubmit(item.id, transaction);

      setFormData({
        quantity: 1,
        unitPrice: 0,
        reference: "",
        notes: "",
      });
      setErrors({});
      onOpenChange(false);
    } catch (error) {
      console.error("Error recording transaction:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      quantity: 1,
      unitPrice: 0,
      reference: "",
      notes: "",
    });
    setErrors({});
    onOpenChange(false);
  };

  if (!item) return null;

  const totalAmount = formData.quantity * formData.unitPrice;
  const newStock = calculateNewStock();
  const stockSufficient = isStockSufficient();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className={`h-5 w-5 ${transactionConfig.color}`} />
            {transactionConfig.label}
          </DialogTitle>
          <DialogDescription>
            {transactionConfig.description} for <strong>{item.name}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 p-6 pt-0">
          {/* Current Stock Info */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Current Stock</p>
                  <p className="font-semibold text-lg">{item.currentStock}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Category</p>
                  <Badge variant="secondary">{item.category}</Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Buy Price</p>
                  <p className="font-medium">{formatCurrency(item.buyPrice)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Sell Price</p>
                  <p className="font-medium">
                    {formatCurrency(item.sellPrice)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quantity">
                  {type === "adjustment" ? "New Stock Level" : "Quantity"} *
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  min={type === "adjustment" ? "0" : "1"}
                  max={type === "stock_out" ? item.currentStock : undefined}
                  value={formData.quantity}
                  onChange={(e) =>
                    handleInputChange("quantity", parseInt(e.target.value) || 0)
                  }
                  className={errors.quantity ? "border-destructive" : ""}
                />
                {errors.quantity && (
                  <p className="text-xs text-destructive mt-1">
                    {errors.quantity}
                  </p>
                )}
                {type === "stock_out" && !stockSufficient && (
                  <p className="text-xs text-destructive mt-1">
                    Only {item.currentStock} units available
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="unitPrice">Unit Price *</Label>
                <Input
                  id="unitPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.unitPrice}
                  onChange={(e) =>
                    handleInputChange(
                      "unitPrice",
                      parseFloat(e.target.value) || 0
                    )
                  }
                  className={errors.unitPrice ? "border-destructive" : ""}
                />
                {errors.unitPrice && (
                  <p className="text-xs text-destructive mt-1">
                    {errors.unitPrice}
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="reference">Reference/Invoice #</Label>
              <Input
                id="reference"
                value={formData.reference}
                onChange={(e) => handleInputChange("reference", e.target.value)}
                placeholder="e.g., INV-001, PO-123"
              />
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                placeholder="Additional notes about this transaction..."
                rows={3}
              />
            </div>

            {/* Transaction Summary */}
            <Card className="bg-muted/50">
              <CardContent className="p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total Amount:</span>
                  <span className="text-lg font-bold text-primary">
                    {formatCurrency(totalAmount)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">
                    New Stock Level:
                  </span>
                  <span
                    className={`font-medium ${
                      newStock <= item.minStockLevel
                        ? "text-warning"
                        : "text-foreground"
                    }`}
                  >
                    {newStock} {newStock <= item.minStockLevel && "⚠️"}
                  </span>
                </div>
                {type === "stock_out" && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">
                      Estimated Profit:
                    </span>
                    <span
                      className={`font-medium ${
                        formData.unitPrice - item.buyPrice >= 0
                          ? "text-success"
                          : "text-destructive"
                      }`}
                    >
                      {formatCurrency(
                        (formData.unitPrice - item.buyPrice) * formData.quantity
                      )}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || !stockSufficient}
                variant={type === "stock_out" ? "destructive" : "default"}
              >
                {loading
                  ? "Processing..."
                  : `Confirm ${transactionConfig.label}`}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
