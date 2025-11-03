// models/InventorySpend.ts
import mongoose, { Schema, model, models } from "mongoose";

export interface IInventorySpend extends mongoose.Document {
  date: string; // yyyy-mm-dd
  amount: number;
  createdAt: Date;
}

const InventorySpendSchema = new Schema<IInventorySpend>(
  {
    date: { type: String, required: true },
    amount: { type: Number, required: true },
  },
  { timestamps: true }
);

// store in "inventoryspends" collection
export const InventorySpendModel =
  models.InventorySpend || model<IInventorySpend>("InventorySpend", InventorySpendSchema);
