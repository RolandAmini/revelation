// src/lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

// Ensure date strings are consistent for daily summary keys and display
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    // If you need time elsewhere, make a separate formatDateTime function.
  }).format(new Date(date));
}

// REMOVED: generateId() as backend will handle ID generation

export function calculateProfit(
  sellPrice: number,
  buyPrice: number,
  quantity: number
): number {
  return (sellPrice - buyPrice) * quantity;
}

export function getStockStatus(
  currentStock: number,
  minLevel: number
): {
  status: "in_stock" | "low_stock" | "out_of_stock";
  variant: "success" | "warning" | "destructive";
} {
  if (currentStock <= 0) {
    return { status: "out_of_stock", variant: "destructive" };
  } else if (currentStock <= minLevel) {
    return { status: "low_stock", variant: "warning" };
  }
  return { status: "in_stock", variant: "success" };
}

// This function is now centralized here and imported where needed.
export const mapStatusToBadgeVariant = (statusVariant: string) => {
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
