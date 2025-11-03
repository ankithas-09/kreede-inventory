// app/api/inventory-items/route.ts
import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import InventoryItem from "@/models/InventoryItem";

// master list to seed on first run
const MASTER_ITEMS = [
  // ===== Fresh Procurement (daily) =====
  { category: "Fresh Procurement (daily)", name: "Milk" },
  { category: "Fresh Procurement (daily)", name: "Yogurt" },
  { category: "Fresh Procurement (daily)", name: "Paneer" },
  { category: "Fresh Procurement (daily)", name: "Garlic herb butter" },
  { category: "Fresh Procurement (daily)", name: "Cream" },
  { category: "Fresh Procurement (daily)", name: "Sandwich Bread" },
  { category: "Fresh Procurement (daily)", name: "Cheese – amul diced" },
  { category: "Fresh Procurement (daily)", name: "Mozzarella Block" },
  { category: "Fresh Procurement (daily)", name: "Processed cheese cubes" },

  // ===== Exotic Veggies (alternate days) =====
  { category: "Exotic Veggies (alternate days)", name: "Mushroom" },
  { category: "Exotic Veggies (alternate days)", name: "English Cucumber" },
  { category: "Exotic Veggies (alternate days)", name: "Baby corn" },
  { category: "Exotic Veggies (alternate days)", name: "Broccoli" },
  { category: "Exotic Veggies (alternate days)", name: "Lettuce" },
  { category: "Exotic Veggies (alternate days)", name: "Sweetcorn" },

  // ===== Local Veggies (alternate days) =====
  { category: "Local Veggies (alternate days)", name: "Potato" },
  { category: "Local Veggies (alternate days)", name: "Tomato" },
  { category: "Local Veggies (alternate days)", name: "Green chillies" },
  { category: "Local Veggies (alternate days)", name: "Capsicum" },
  { category: "Local Veggies (alternate days)", name: "Onion" },
  { category: "Local Veggies (alternate days)", name: "Beetroot" },
  { category: "Local Veggies (alternate days)", name: "Carrot" },
  { category: "Local Veggies (alternate days)", name: "Cucumber" },
  { category: "Local Veggies (alternate days)", name: "Spinach" },
  { category: "Local Veggies (alternate days)", name: "Lemon" },
  { category: "Local Veggies (alternate days)", name: "Coriander" },
  { category: "Local Veggies (alternate days)", name: "Curry Leaves" },
  { category: "Local Veggies (alternate days)", name: "Mint leaves" },
  { category: "Local Veggies (alternate days)", name: "Garlic peeled" },
  { category: "Local Veggies (alternate days)", name: "Ginger" },

  // ===== Fruits (Alternate days) =====
  { category: "Fruits (Alternate days)", name: "Apple" },
  { category: "Fruits (Alternate days)", name: "Banana" },
  { category: "Fruits (Alternate days)", name: "Pomegranate" },
  { category: "Fruits (Alternate days)", name: "Papaya" },
  { category: "Fruits (Alternate days)", name: "Guava" },
  { category: "Fruits (Alternate days)", name: "Pineapple" },
  { category: "Fruits (Alternate days)", name: "Watermelon" },
  { category: "Fruits (Alternate days)", name: "Muskmelon" },
  { category: "Fruits (Alternate days)", name: "Avocado" },

  // ===== Raw Materials (15 days once) =====
  { category: "Raw Materials (15 days once)", name: "Oil" },
  { category: "Raw Materials (15 days once)", name: "Salt" },
  {
    category: "Raw Materials (15 days once)",
    name: "Channa/black channa (kadlekalu)",
  },
  { category: "Raw Materials (15 days once)", name: "Chickpeas (white)" },
  { category: "Raw Materials (15 days once)", name: "Greengram" },
  {
    category: "Raw Materials (15 days once)",
    name: "Masala peanuts (Congress kadle)",
  },
  { category: "Raw Materials (15 days once)", name: "Soya Chunks" },
  { category: "Raw Materials (15 days once)", name: "Chili Oil" },
  { category: "Raw Materials (15 days once)", name: "Mayonnaise" },
  { category: "Raw Materials (15 days once)", name: "Guntur red chilly" },
  { category: "Raw Materials (15 days once)", name: "Byadagi red chilly" },
  { category: "Raw Materials (15 days once)", name: "Besan" },
  { category: "Raw Materials (15 days once)", name: "Maida" },
  { category: "Raw Materials (15 days once)", name: "Cornflour" },
  { category: "Raw Materials (15 days once)", name: "Riceflour" },
  { category: "Raw Materials (15 days once)", name: "Oats" },
  { category: "Raw Materials (15 days once)", name: "Cocoa powder" },
  { category: "Raw Materials (15 days once)", name: "Chia seeds" },
  { category: "Raw Materials (15 days once)", name: "Peanut butter" },
  { category: "Raw Materials (15 days once)", name: "Honey" },
  { category: "Raw Materials (15 days once)", name: "Sugar" },
  { category: "Raw Materials (15 days once)", name: "Yellow Jaggery (cubes)" },
  { category: "Raw Materials (15 days once)", name: "Rice paper" },
  { category: "Raw Materials (15 days once)", name: "Ginger garlic paste" },
  { category: "Raw Materials (15 days once)", name: "Sev (chaat)" },
  { category: "Raw Materials (15 days once)", name: "Dryfruits – wet dates" },
  { category: "Raw Materials (15 days once)", name: "Dryfruits – cashew" },
  { category: "Raw Materials (15 days once)", name: "Dryfruits – raisins" },
  { category: "Raw Materials (15 days once)", name: "Dryfruits – almonds" },

  // ===== Masalas and spices (depends) =====
  { category: "Masalas and spices (depends)", name: "Pepper powder" },
  { category: "Masalas and spices (depends)", name: "Black salt" },
  { category: "Masalas and spices (depends)", name: "Pink salt" },
  {
    category: "Masalas and spices (depends)",
    name: "Kashmiri red chilly powder",
  },
  { category: "Masalas and spices (depends)", name: "Coriander powder" },
  { category: "Masalas and spices (depends)", name: "Jeera powder" },
  { category: "Masalas and spices (depends)", name: "Onion powder" },
  { category: "Masalas and spices (depends)", name: "Garlic powder" },
  { category: "Masalas and spices (depends)", name: "Ginger powder" },
  { category: "Masalas and spices (depends)", name: "Garam masala" },
  {
    category: "Masalas and spices (depends)",
    name: "Dry mango powder (aamchur)",
  },
  { category: "Masalas and spices (depends)", name: "Chat masala" },
  { category: "Masalas and spices (depends)", name: "Chole masala" },
  { category: "Masalas and spices (depends)", name: "Peri peri masala" },
  { category: "Masalas and spices (depends)", name: "Cheese powder" },
  { category: "Masalas and spices (depends)", name: "Chilly flakes" },
  { category: "Masalas and spices (depends)", name: "Oregano" },

  // ===== Whole spices (depends) =====
  { category: "Whole spices (depends)", name: "Pepper corn" },
  { category: "Whole spices (depends)", name: "Fennel (saunf)" },
  { category: "Whole spices (depends)", name: "Cloves" },
  { category: "Whole spices (depends)", name: "Jeera" },
  { category: "Whole spices (depends)", name: "Anardhana powder" },
  { category: "Whole spices (depends)", name: "Hing" },
];

export async function GET() {
  await dbConnect({ dbName: "kreede-inventory" });

  const count = await InventoryItem.countDocuments({});
  if (count === 0) {
    // seed
    const docs = MASTER_ITEMS.map((it) => ({ ...it, active: true }));
    await InventoryItem.insertMany(docs);
  }

  const items = await InventoryItem.find({ active: true })
    .sort({ category: 1, name: 1 })
    .lean();

  return NextResponse.json(items);
}

export async function POST(req: Request) {
  await dbConnect({ dbName: "kreede-inventory" });
  const body = await req.json();

  const { category, name } = body;
  if (!category || !name) {
    return NextResponse.json(
      { error: "category and name are required" },
      { status: 400 }
    );
  }

  // upsert so duplicates don't crash
  const item = await InventoryItem.findOneAndUpdate(
    { category, name },
    { $set: { category, name, active: true } },
    { upsert: true, new: true }
  );

  return NextResponse.json(item);
}

export async function PATCH(req: Request) {
  await dbConnect({ dbName: "kreede-inventory" });
  const body = await req.json();

  const { category, name, active } = body;
  if (!category || !name) {
    return NextResponse.json(
      { error: "category and name are required" },
      { status: 400 }
    );
  }

  const item = await InventoryItem.findOneAndUpdate(
    { category, name },
    { $set: { active: active ?? false } },
    { new: true }
  );

  return NextResponse.json(item);
}
