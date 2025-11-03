// components/InventoryForm.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";

type InventoryItem = {
  category: string;
  name: string;
};

type SpendEntry = {
  _id?: string;
  date: string; // ISO in DB
  amount: number;
};

const MASTER_ITEMS: InventoryItem[] = [
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
  { category: "Raw Materials (15 days once)", name: "Channa/black channa (kadlekalu)" },
  { category: "Raw Materials (15 days once)", name: "Chickpeas (white)" },
  { category: "Raw Materials (15 days once)", name: "Greengram" },
  { category: "Raw Materials (15 days once)", name: "Masala peanuts (Congress kadle)" },
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
  { category: "Masalas and spices (depends)", name: "Kashmiri red chilly powder" },
  { category: "Masalas and spices (depends)", name: "Coriander powder" },
  { category: "Masalas and spices (depends)", name: "Jeera powder" },
  { category: "Masalas and spices (depends)", name: "Onion powder" },
  { category: "Masalas and spices (depends)", name: "Garlic powder" },
  { category: "Masalas and spices (depends)", name: "Ginger powder" },
  { category: "Masalas and spices (depends)", name: "Garam masala" },
  { category: "Masalas and spices (depends)", name: "Dry mango powder (aamchur)" },
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

type Props = {
  initialDate?: string;
};

function toDisplayDate(isoDate: string) {
  const [y, m, d] = isoDate.split("-");
  return `${d}/${m}/${y}`;
}

export default function InventoryForm({ initialDate }: Props) {
  // inventory part
  const [date, setDate] = useState<string>(
    initialDate ?? new Date().toISOString().slice(0, 10)
  );
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");

  // inventory data (amount spent) part
  const [spendDate, setSpendDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [spendAmount, setSpendAmount] = useState<string>("");
  const [spendList, setSpendList] = useState<SpendEntry[]>([]);
  const [spendSaving, setSpendSaving] = useState(false);

  const grouped = useMemo(() => {
    const map: Record<string, InventoryItem[]> = {};
    MASTER_ITEMS.forEach((it) => {
      if (!map[it.category]) map[it.category] = [];
      map[it.category].push(it);
    });
    return map;
  }, []);

  // load inventory for selected date
  useEffect(() => {
    async function fetchData() {
      const res = await fetch(`/api/inventory?date=${date}`);
      if (res.ok) {
        const data = await res.json();
        const q: Record<string, string> = {};
        if (data.items) {
          data.items.forEach((it: any) => {
            q[`${it.category}__${it.name}`] = it.quantity;
          });
        }
        setQuantities(q);
      } else {
        setQuantities({});
      }
    }
    if (date) fetchData();
  }, [date]);

  // load spend list
  useEffect(() => {
    async function loadSpends() {
      const res = await fetch("/api/inventory-spend");
      if (res.ok) {
        const data = await res.json();
        setSpendList(data);
      }
    }
    loadSpends();
  }, []);

  function handleChange(category: string, name: string, value: string) {
    setQuantities((prev) => ({
      ...prev,
      [`${category}__${name}`]: value,
    }));
  }

  async function handleSave() {
    setSaving(true);
    setStatus("");
    const items = MASTER_ITEMS.map((it) => ({
      category: it.category,
      name: it.name,
      quantity: quantities[`${it.category}__${it.name}`] || "",
    }));

    const res = await fetch("/api/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, items }),
    });

    if (res.ok) {
      setStatus("Saved!");
    } else {
      setStatus("Error saving");
    }
    setSaving(false);
  }

  function handleDownloadPDF() {
    const doc = new jsPDF();
    const FONT = "helvetica";
    let y = 10;

    const displayDate = toDisplayDate(date);

    doc.setFont(FONT, "bold");
    doc.setFontSize(14);
    doc.text(`Inventory - ${displayDate}`, 10, y);
    y += 8;

    doc.setFont(FONT, "normal");
    doc.setFontSize(10);

    // only filled items
    const filledItems = MASTER_ITEMS
      .map((it) => {
        const key = `${it.category}__${it.name}`;
        const qty = quantities[key]?.trim() ?? "";
        return { ...it, qty };
      })
      .filter((it) => it.qty !== "");

    let currentCategory = "";

    filledItems.forEach((it) => {
      if (currentCategory !== it.category) {
        currentCategory = it.category;
        y += 5;
        doc.setFont(FONT, "bold");
        doc.text(currentCategory, 10, y);
        doc.setFont(FONT, "normal");
        y += 5;
      }
      doc.text(`${it.name}: ${it.qty}`, 12, y);
      y += 5;

      if (y > 280) {
        doc.addPage();
        y = 10;
        doc.setFont(FONT, "normal");
      }
    });

    doc.save(`inventory-${displayDate.replace(/\//g, "-")}.pdf`);
  }

  // save amount spent
  async function handleSpendSave() {
    if (!spendAmount.trim()) return;
    setSpendSaving(true);
    const payload = {
      date: spendDate,
      amount: Number(spendAmount),
    };
    const res = await fetch("/api/inventory-spend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const data = await res.json();
      // reload list
      const listRes = await fetch("/api/inventory-spend");
      const listData = await listRes.json();
      setSpendList(listData);
      setSpendAmount("");
    }
    setSpendSaving(false);
  }

  return (
    <div className="inventory-wrapper">
      {/* INVENTORY SECTION */}
      <div className="inventory-header">
        <h1>Daily Inventory</h1>
        <div className="date-row">
          <label htmlFor="date">Date</label>
          <input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <small>Selected: {toDisplayDate(date)}</small>
        </div>
      </div>

      <div className="inventory-sections">
        {Object.entries(grouped).map(([cat, items]) => (
          <div key={cat} className="inventory-section">
            <h2>{cat}</h2>
            <div className="inventory-items">
              {items.map((it) => {
                const key = `${it.category}__${it.name}`;
                return (
                  <div key={key} className="inventory-item-row">
                    <label>{it.name}</label>
                    <input
                      type="text"
                      placeholder="Enter qty"
                      value={quantities[key] || ""}
                      onChange={(e) =>
                        handleChange(it.category, it.name, e.target.value)
                      }
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="actions-row">
        <button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Inventory"}
        </button>
        <button onClick={handleDownloadPDF}>Download PDF</button>
        {status && <span className="status-text">{status}</span>}
      </div>

      {/* INVENTORY DATA (AMOUNT SPENT) SECTION */}
      <div className="spend-wrapper">
        <div className="spend-header">
          <h2>Inventory Data</h2>
          <p>Track how much was spent on inventory per day.</p>
        </div>
        <div className="spend-form">
          <div className="date-row">
            <label htmlFor="spend-date">Date</label>
            <input
              id="spend-date"
              type="date"
              value={spendDate}
              onChange={(e) => setSpendDate(e.target.value)}
            />
            <small>{toDisplayDate(spendDate)}</small>
          </div>
          <div className="amount-row">
            <label htmlFor="spend-amount">Amount spent (₹)</label>
            <input
              id="spend-amount"
              type="number"
              value={spendAmount}
              onChange={(e) => setSpendAmount(e.target.value)}
              placeholder="Enter amount"
            />
          </div>
          <button onClick={handleSpendSave} disabled={spendSaving}>
            {spendSaving ? "Saving..." : "Save Inventory Data"}
          </button>
        </div>

        <div className="spend-table-wrapper">
          <table className="spend-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              {spendList.length === 0 && (
                <tr>
                  <td colSpan={2}>No records yet</td>
                </tr>
              )}
              {spendList.map((row) => (
                <tr key={row._id || row.date}>
                    <td>{toDisplayDate(row.date)}</td>
                    <td>{row.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
