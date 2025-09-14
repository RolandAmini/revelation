import { NextResponse } from "next/server";
import dbConnect from "@/app/api/db/connect";
import Inventory from "@/models/Inventory";
import Transaction from "@/models/Transaction";
import { InventoryItem } from "@/lib/types/inventory"; // For typing

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await dbConnect();
  try {
    const { id } = await params;
    const item = await Inventory.findById(id);
    if (!item) {
      return NextResponse.json({ message: "Item not found" }, { status: 404 });
    }
    return NextResponse.json(item);
  } catch (error: unknown) {
    console.error("API Error fetching item:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json(
      { message: "Failed to fetch item", error: errorMessage },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await dbConnect();
  try {
    const { id } = await params;
    const updates: Partial<InventoryItem> = await req.json();
    const updatedItem = await Inventory.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: new Date().toISOString() },
      { new: true, runValidators: true }
    );
    if (!updatedItem) {
      return NextResponse.json({ message: "Item not found" }, { status: 404 });
    }
    return NextResponse.json(updatedItem);
  } catch (error: unknown) {
    console.error("API Error updating item:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json(
      { message: "Failed to update item", error: errorMessage },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await dbConnect();
  try {
    const { id } = await params;
    const deletedItem = await Inventory.findByIdAndDelete(id);
    if (!deletedItem) {
      return NextResponse.json({ message: "Item not found" }, { status: 404 });
    }
    await Transaction.deleteMany({ itemId: id });
    return new Response(null, { status: 204 });
  } catch (error: unknown) {
    console.error("API Error deleting item:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json(
      { message: "Failed to delete item", error: errorMessage },
      { status: 500 }
    );
  }
}
