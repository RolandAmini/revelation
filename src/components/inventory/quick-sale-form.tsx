"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";
import { InventoryItem } from "@/lib/types/inventory";

interface QuickSaleFormProps {
  item: InventoryItem;
  onSale: (
    itemId: string,
    quantity: number,
    salePrice: number,
    customerInfo: { name: string; phone: string },
    shouldGenerateReceipt: boolean
  ) => void;
  onClose: () => void;
}

export default function QuickSaleForm({
  item,
  onSale,
  onClose,
}: QuickSaleFormProps) {
  const [quantity, setQuantity] = useState(1);
  const [salePrice, setSalePrice] = useState(item.sellPrice);
  const [customerInfo, setCustomerInfo] = useState({ name: "", phone: "" });

  const isFormValid =
    quantity > 0 && quantity <= item.currentStock && salePrice > 0;

  const handleCompleteSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (!item.id) {
      alert("Error: Cannot perform sale on an item without an ID.");
      return;
    }
    if (isFormValid) {
      onSale(item.id, quantity, salePrice, customerInfo, false);
    }
  };

  const handleCompleteSaleAndPrint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!item.id) {
      alert("Error: Cannot perform sale on an item without an ID.");
      return;
    }

    if (isFormValid) {
      onSale(item.id, quantity, salePrice, customerInfo, true);
    }
  };

  const profit = (salePrice - item.buyPrice) * quantity;
  const maxQuantity = item.currentStock;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold mb-4">Quick Sale - {item.name}</h3>

        <form className="space-y-4">
          {/* Customer Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="customer-name">Customer Name (Optional)</Label>
              <Input
                id="customer-name"
                value={customerInfo.name}
                onChange={(e) =>
                  setCustomerInfo((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Customer name"
              />
            </div>
            <div>
              <Label htmlFor="customer-phone">Phone (Optional)</Label>
              <Input
                id="customer-phone"
                value={customerInfo.phone}
                onChange={(e) =>
                  setCustomerInfo((prev) => ({
                    ...prev,
                    phone: e.target.value,
                  }))
                }
                placeholder="Phone number"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="sale-quantity">
              Quantity (Available: {maxQuantity})
            </Label>
            <Input
              id="sale-quantity"
              type="number"
              min="1"
              max={maxQuantity}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="sale-price">Sale Price per Unit</Label>
            <Input
              id="sale-price"
              type="number"
              step="0.01"
              min="0.01"
              value={salePrice}
              onChange={(e) => setSalePrice(parseFloat(e.target.value) || 0)}
              className="mt-1"
            />
          </div>

          <div className="bg-gray-50 p-3 rounded">
            <div className="flex justify-between text-sm">
              <span>Total Sale:</span>
              <span className="font-semibold">
                {formatCurrency(quantity * salePrice)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Profit:</span>
              <span
                className={`font-semibold ${
                  profit >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {formatCurrency(profit)}
              </span>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            {/* NEW: Button for sale without receipt - using 'secondary' variant for visual distinction */}
            <Button
              type="button"
              variant="secondary" // Makes it visually less prominent than the primary "Print" button
              onClick={handleCompleteSale}
              disabled={!isFormValid}
              className="bg-green-600 hover:bg-blue-700"
            >
              Complete Sale
            </Button>
            <Button
              type="button"
              onClick={handleCompleteSaleAndPrint}
              disabled={!isFormValid}
              className="bg-green-600 hover:bg-green-700"
            >
              Print Receipt
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
