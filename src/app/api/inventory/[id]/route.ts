// src/app/api/inventory/[id]/route.ts
import { NextResponse } from "next/server";
import dbConnect from "@/app/api/db/connect"; // Import DB connection
import Inventory from "@/models/Inventory"; // Import Inventory Model
import Transaction from "@/models/Transaction"; // Import Transaction Model to delete associated transactions
import { InventoryItem } from "@/lib/types/inventory"; // For typing

// GET /api/inventory/:id - Fetch a single inventory item
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  await dbConnect();
  try {
    const { id } = params;
    const item = await Inventory.findById(id);

    if (!item) {
      return NextResponse.json({ message: "Item not found" }, { status: 404 });
    }
    return NextResponse.json(item);
  } catch (error: any) {
    console.error("API Error fetching item:", error);
    return NextResponse.json(
      { message: "Failed to fetch item", error: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/inventory/:id - Update an inventory item
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  await dbConnect();
  try {
    const { id } = params;
    const updates: Partial<InventoryItem> = await req.json();

    const updatedItem = await Inventory.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: new Date().toISOString() }, // Update updatedAt
      { new: true, runValidators: true } // Return the updated document, run schema validators
    );

    if (!updatedItem) {
      return NextResponse.json({ message: "Item not found" }, { status: 404 });
    }

    return NextResponse.json(updatedItem);
  } catch (error: any) {
    console.error("API Error updating item:", error);
    return NextResponse.json(
      { message: "Failed to update item", error: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/inventory/:id - Delete an inventory item
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  await dbConnect();
  try {
    const { id } = params;

    const deletedItem = await Inventory.findByIdAndDelete(id);

    if (!deletedItem) {
      return NextResponse.json({ message: "Item not found" }, { status: 404 });
    }

    // Also delete associated transactions for this item
    await Transaction.deleteMany({ itemId: id });

    return new Response(null, { status: 204 }); // No Content
  } catch (error: any) {
    console.error("API Error deleting item:", error);
    return NextResponse.json(
      { message: "Failed to delete item", error: error.message },
      { status: 500 }
    );
  }
}
