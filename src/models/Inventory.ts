
import mongoose, { Document, Model, Schema } from "mongoose";
import { InventoryItem } from "@/lib/types/inventory";


export interface InventoryDocument
  extends Omit<InventoryItem, "id">,
    Document {}


interface MongooseRet {
  _id: { toString: () => string };
  __v: number;
  [key: string]: unknown;
}

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
    createdAt: { type: String, default: () => new Date().toISOString() },
    updatedAt: { type: String, default: () => new Date().toISOString() },
  },
  {
    timestamps: false,
    toJSON: {
      virtuals: true,
     
      transform: (doc, ret) => {
       
        const { _id, __v: _v, ...cleanRet } = ret as MongooseRet;
        return { ...cleanRet, id: _id.toString() };
      },
    },
    toObject: {
      virtuals: true,
      transform: (doc, ret) => {
      
        const { _id, __v: _v, ...cleanRet } = ret as MongooseRet;
        return { ...cleanRet, id: _id.toString() };
      },
    },
  }
);

const Inventory: Model<InventoryDocument> =
  mongoose.models.Inventory ||
  mongoose.model<InventoryDocument>("Inventory", InventorySchema);

export default Inventory;