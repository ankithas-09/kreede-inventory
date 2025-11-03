// models/InventoryItem.ts
import mongoose, { Schema, models, model } from "mongoose";

const InventoryItemSchema = new Schema(
  {
    category: { type: String, required: true },
    name: { type: String, required: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// make sure (category, name) is unique
InventoryItemSchema.index({ category: 1, name: 1 }, { unique: true });

const InventoryItem =
  models.InventoryItem || model("InventoryItem", InventoryItemSchema);

export default InventoryItem;
