// src/models/Transaction.ts
import mongoose, { Document, Model, Schema } from "mongoose";
import { StockTransaction } from "@/lib/types/inventory";

export interface TransactionDocument
  extends Omit<StockTransaction, "id">,
    Document {}

// A simple, minimal interface describing the shape we need from Mongoose's 'ret' object.
interface MongooseRet {
  _id: { toString: () => string };
  __v: number;
  [key: string]: unknown;
}

const TransactionSchema: Schema<TransactionDocument> = new Schema(
  {
    itemId: { type: String, required: true, index: true },
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
    performedBy: { type: String },
    createdAt: { type: String, default: () => new Date().toISOString() },
  },
  {
    timestamps: false,
    toJSON: {
      virtuals: true,
      // THE FINAL FIX: Let TypeScript infer the types for 'doc' and 'ret' here.
      transform: (doc, ret) => {
        // THEN, cast 'ret' to our simple, known shape before using it.
        const { _id, __v, ...cleanRet } = ret as MongooseRet;
        return { ...cleanRet, id: _id.toString() };
      },
    },
    toObject: {
      virtuals: true,
      // Also apply the fix here.
      transform: (doc, ret) => {
        const { _id, __v, ...cleanRet } = ret as MongooseRet;
        return { ...cleanRet, id: _id.toString() };
      },
    },
  }
);

const Transaction: Model<TransactionDocument> =
  mongoose.models.Transaction ||
  mongoose.model<TransactionDocument>("Transaction", TransactionSchema);

export default Transaction;
