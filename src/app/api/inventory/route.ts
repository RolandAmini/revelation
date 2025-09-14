// src/app/api/inventory/route.ts
import { NextResponse } from "next/server";
import dbConnect from "@/app/api/db/connect";
import Inventory from "@/models/Inventory";
import { InventoryItem, StockTransaction } from "@/lib/types/inventory";
import Transaction from "@/models/Transaction";
export async function GET() {
  await dbConnect();
  try {
    const inventory = await Inventory.find({});
    return NextResponse.json(inventory);
  } catch (error: unknown) {
    console.error("API Error fetching inventory:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json(
      { message: "Failed to fetch inventory", error: errorMessage },
      { status: 500 }
    );
  }
}
export async function POST(req: Request) {
  await dbConnect();
  try {
    const itemData: InventoryItem = await req.json();

    const newItem = await Inventory.create({
      ...itemData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    if (newItem.currentStock > 0) {
      const initialTransaction: Omit<StockTransaction, "id"> = {
        itemId: newItem.id,
        type: "stock_in",
        quantity: newItem.currentStock,
        unitPrice: newItem.buyPrice,
        totalAmount: newItem.currentStock * newItem.buyPrice,
        notes: "Initial stock via item creation",
        createdAt: new Date().toISOString(),
      };
      await Transaction.create(initialTransaction);
    }

    return NextResponse.json(newItem, { status: 201 });
  } catch (error: unknown) {
    console.error("API Error creating item:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json(
      { message: "Failed to create item", error: errorMessage },
      { status: 500 }
    );
  }
}
