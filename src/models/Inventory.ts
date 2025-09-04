// src/models/Inventory.ts
import mongoose, { Document, Model, Schema } from "mongoose";
import { InventoryItem } from "@/lib/types/inventory"; // Assuming types/inventory.ts has your interface

// 1. Extend the Mongoose Document type with your InventoryItem interface
export interface InventoryDocument extends InventoryItem, Document {}

// 2. Define the Mongoose Schema
const InventorySchema: Schema<InventoryDocument> = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    category: { type: String, required: true, index: true },
    sku: { type: String, required: true, unique: true, index: true },
    currentStock: { type: Number, required: true, default: 0, min: 0 },
    minStockLevel: { type: Number, required: true, default: 0, min: 0 },
    maxStockLevel: { type: Number, min: 0 },
    buyPrice: { type: Number, required: true, min: 0 },
    sellPrice: { type: Number, required: true, min: 0 },
    supplier: { type: String },
    location: { type: String },
    // Timestamps for Mongoose
    createdAt: { type: String, default: () => new Date().toISOString() }, // Store as ISO string
    updatedAt: { type: String, default: () => new Date().toISOString() }, // Store as ISO string
  },
  {
    timestamps: false, // We'll manage createdAt/updatedAt manually as strings to match frontend types
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString(); // Map _id to id for consistency with frontend
        delete ret._id;
        delete ret.__v;
      },
    },
    toObject: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString(); // Map _id to id for consistency with frontend
        delete ret._id;
        delete ret.__v;
      },
    },
  }
);

// 3. Export the Mongoose Model
// Use existing model if it exists to prevent recompilation on hot-reloads
const Inventory: Model<InventoryDocument> =
  mongoose.models.Inventory ||
  mongoose.model<InventoryDocument>("Inventory", InventorySchema);

export default Inventory;
