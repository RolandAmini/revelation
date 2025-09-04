// src/models/Transaction.ts
import mongoose, { Document, Model, Schema } from "mongoose";
import { StockTransaction } from "@/lib/types/inventory"; // Assuming types/inventory.ts has your interface

// 1. Extend the Mongoose Document type with your StockTransaction interface
export interface TransactionDocument extends StockTransaction, Document {}

// 2. Define the Mongoose Schema
const TransactionSchema: Schema<TransactionDocument> = new Schema(
  {
    itemId: { type: String, required: true, index: true }, // ID of the related InventoryItem
    type: {
      type: String,
      enum: ["stock_in", "stock_out", "adjustment", "transfer"],
      required: true,
      index: true,
    },
    quantity: { type: Number, required: true, min: 0 },
    unitPrice: { type: Number, required: true, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    reference: { type: String },
    notes: { type: String },
    performedBy: { type: String }, // e.g., user ID or name
    // Timestamps for Mongoose
    createdAt: { type: String, default: () => new Date().toISOString() }, // Store as ISO string
  },
  {
    timestamps: false, // Manage createdAt manually as string
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
const Transaction: Model<TransactionDocument> =
  mongoose.models.Transaction ||
  mongoose.model<TransactionDocument>("Transaction", TransactionSchema);

export default Transaction;
