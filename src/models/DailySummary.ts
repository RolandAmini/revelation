
import mongoose, { Document, Model, Schema } from "mongoose";


interface IDailySummary {
  date: string; 
  totalTransactionsCount: number;
  totalMoneyIn: number; 
  totalMoneyOut: number; 
  netFlow: number; 
  grossProfitFromSales: number; 
  lossFromBelowCostSales: number; 
  updatedAt: string; 
}

export interface DailySummaryDocument extends IDailySummary, Document {}

const DailySummarySchema: Schema<DailySummaryDocument> = new Schema(
  {
    
    _id: { type: String, required: true }, 
    date: { type: String, required: true }, 
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
       
        const { __v: _v, _id, ...cleanRet } = ret;
        return { ...cleanRet, id: ret._id };
      },
    },
    toObject: {
      virtuals: true,
      transform: (doc, ret) => {
    
        const { __v: _v, _id, ...cleanRet } = ret;
        return { ...cleanRet, id: ret._id };
      },
    },
  }
);

const DailySummary: Model<DailySummaryDocument> =
  mongoose.models.DailySummary ||
  mongoose.model<DailySummaryDocument>("DailySummary", DailySummarySchema);

export default DailySummary;