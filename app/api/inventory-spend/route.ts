// app/api/inventory-spend/route.ts
import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { InventorySpendModel } from "@/models/InventorySpend";

export async function GET() {
  await dbConnect();
  const items = await InventorySpendModel.find().sort({ date: -1, createdAt: -1 }).lean();
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { date, amount } = body;
  if (!date || typeof amount !== "number") {
    return NextResponse.json({ error: "date and amount are required" }, { status: 400 });
  }
  await dbConnect();

  // you can upsert by date if you want only 1 per day:
  const saved = await InventorySpendModel.findOneAndUpdate(
    { date },
    { date, amount },
    { new: true, upsert: true }
  );

  return NextResponse.json(saved);
}
