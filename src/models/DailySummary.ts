// src/models/DailySummary.ts
import mongoose, { Document, Model, Schema } from "mongoose";

// Re-defining DailySummary interface for the backend model,
// ensure it aligns with the frontend's DailySummary type in transactions.tsx
interface IDailySummary {
  date: string; // Formatted date string, e.g., "Jan 1, 2023" or "YYYY-MM-DD" for _id
  totalTransactionsCount: number;
  totalMoneyIn: number; // Sum of stock_out totalAmount
  totalMoneyOut: number; // Sum of stock_in totalAmount
  netFlow: number; // totalMoneyIn - totalMoneyOut
  grossProfitFromSales: number; // (sellPrice - buyPrice) * quantity for stock_out
  lossFromBelowCostSales: number; // (buyPrice - sellPrice) * quantity for stock_out where sellPrice < buyPrice
  updatedAt: string; // When this summary was last calculated/updated
}

export interface DailySummaryDocument extends IDailySummary, Document {}

const DailySummarySchema: Schema<DailySummaryDocument> = new Schema(
  {
    // Use date string as _id for easy lookup and uniqueness per day
    _id: { type: String, required: true }, // e.g., "YYYY-MM-DD"
    date: { type: String, required: true }, // Formatted for display, e.g., "Jan 1, 2023"
    totalTransactionsCount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    totalMoneyIn: { type: Number, required: true, default: 0, min: 0 },
    totalMoneyOut: { type: Number, required: true, default: 0, min: 0 },
    netFlow: { type: Number, required: true, default: 0 },
    grossProfitFromSales: { type: Number, required: true, default: 0 },
    lossFromBelowCostSales: { type: Number, required: true, default: 0 },
    updatedAt: { type: String, default: () => new Date().toISOString() },
  },
  {
    timestamps: false,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id; // _id is already the date string we want
        const { __v, ...cleanRet } = ret;
        return { ...cleanRet, id: ret._id };
      },
    },
    toObject: {
      virtuals: true,
      transform: (doc, ret) => {
        const { __v, ...cleanRet } = ret;
        return { ...cleanRet, id: ret._id };
      },
    },
  }
);

const DailySummary: Model<DailySummaryDocument> =
  mongoose.models.DailySummary ||
  mongoose.model<DailySummaryDocument>("DailySummary", DailySummarySchema);

export default DailySummary;
