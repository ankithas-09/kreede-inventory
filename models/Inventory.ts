// models/Inventory.ts
import mongoose, { Schema, model, models } from "mongoose";

type ItemEntry = {
  name: string;
  category: string;
  quantity: string; // keep as string to allow "3 l", "500 gms" etc.
};

export interface IInventory extends mongoose.Document {
  date: string; // yyyy-mm-dd
  items: ItemEntry[];
  createdAt: Date;
}

const ItemSchema = new Schema<ItemEntry>(
  {
    name: { type: String, required: true },
    category: { type: String, required: true },
    quantity: { type: String, required: true },
  },
  { _id: false }
);

const InventorySchema = new Schema<IInventory>(
  {
    date: { type: String, required: true },
    items: { type: [ItemSchema], default: [] },
  },
  { timestamps: true }
);

// collection name will be "inventories"
export const InventoryModel =
  models.Inventory || model<IInventory>("Inventory", InventorySchema);
