// src/app/api/inventory/route.ts
import { NextResponse } from "next/server";
import dbConnect from "@/app/api/db/connect"; // Import DB connection
import Inventory from "@/models/Inventory"; // Import Inventory Model
import { InventoryItem, StockTransaction } from "@/lib/types/inventory"; // For typing
import Transaction from "@/models/Transaction";

// GET /api/inventory - Fetch all inventory items
export async function GET() {
  await dbConnect();
  try {
    const inventory = await Inventory.find({});
    return NextResponse.json(inventory);
  } catch (error: any) {
    console.error("API Error fetching inventory:", error);
    return NextResponse.json(
      { message: "Failed to fetch inventory", error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/inventory - Create a new inventory item
export async function POST(req: Request) {
  await dbConnect();
  try {
    const itemData: InventoryItem = await req.json();

    // Mongoose will automatically add _id, createdAt, updatedAt based on schema
    const newItem = await Inventory.create({
      ...itemData,
      createdAt: new Date().toISOString(), // Ensure ISO string for consistency
      updatedAt: new Date().toISOString(), // Ensure ISO string for consistency
    });

    // If initial stock > 0, record a stock_in transaction for consistency
    if (newItem.currentStock > 0) {
      const initialTransaction: StockTransaction = {
        itemId: newItem.id!, // Mongoose _id is converted to id by virtual in model
        type: "stock_in",
        quantity: newItem.currentStock,
        unitPrice: newItem.buyPrice,
        totalAmount: newItem.currentStock * newItem.buyPrice,
        notes: "Initial stock via item creation",
        createdAt: new Date().toISOString(),
        id: "",
      };
      await Transaction.create(initialTransaction);
    }

    return NextResponse.json(newItem, { status: 201 });
  } catch (error: any) {
    console.error("API Error creating item:", error);
    return NextResponse.json(
      { message: "Failed to create item", error: error.message },
      { status: 500 }
    );
  }
}
