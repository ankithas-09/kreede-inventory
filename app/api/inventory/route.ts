// app/api/inventory/route.ts
import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { InventoryModel } from "@/models/Inventory";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");

  if (!date) {
    return NextResponse.json({ error: "date is required" }, { status: 400 });
  }

  await dbConnect();

  const inv = await InventoryModel.findOne({ date }).lean();

  return NextResponse.json(inv || { date, items: [] });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { date, items } = body;

  if (!date) {
    return NextResponse.json({ error: "date is required" }, { status: 400 });
  }

  await dbConnect();

  // upsert: if exists, replace
  const saved = await InventoryModel.findOneAndUpdate(
    { date },
    { date, items },
    { new: true, upsert: true }
  );

  return NextResponse.json(saved);
}
