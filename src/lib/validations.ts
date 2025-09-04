export interface InventoryItemValidation {
  name: string;
  category: string;
  sku: string;
  buyPrice: number;
  sellPrice: number;
  minStockLevel: number;
  currentStock?: number;
}

export function validateInventoryItem(data: Partial<InventoryItemValidation>): {
  isValid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  if (!data.name?.trim()) {
    errors.name = "Product name is required";
  }

  if (!data.category?.trim()) {
    errors.category = "Category is required";
  }

  if (!data.sku?.trim()) {
    errors.sku = "SKU is required";
  }

  if (!data.buyPrice || data.buyPrice <= 0) {
    errors.buyPrice = "Buy price must be greater than 0";
  }

  if (!data.sellPrice || data.sellPrice <= 0) {
    errors.sellPrice = "Sell price must be greater than 0";
  }

  if (data.sellPrice && data.buyPrice && data.sellPrice <= data.buyPrice) {
    errors.sellPrice = "Sell price must be greater than buy price";
  }

  if (data.minStockLevel === undefined || data.minStockLevel < 0) {
    errors.minStockLevel = "Minimum stock level must be 0 or greater";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateStockTransaction(data: {
  quantity: number;
  unitPrice: number;
  type: string;
}): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (!data.quantity || data.quantity <= 0) {
    errors.quantity = "Quantity must be greater than 0";
  }

  if (!data.unitPrice || data.unitPrice <= 0) {
    errors.unitPrice = "Unit price must be greater than 0";
  }

  if (!data.type) {
    errors.type = "Transaction type is required";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
