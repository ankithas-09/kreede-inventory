// components/InventoryForm.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";

type InventoryItem = {
  _id?: string;
  category: string;
  name: string;
  active?: boolean;
};

type SpendEntry = {
  _id?: string;
  date: string; // ISO
  amount: number;
};

type Props = {
  initialDate?: string;
};

function toDisplayDate(isoDate: string) {
  const [y, m, d] = isoDate.split("-");
  return `${d}/${m}/${y}`;
}

export default function InventoryForm({ initialDate }: Props) {
  // date + quantities
  const [date, setDate] = useState<string>(
    initialDate ?? new Date().toISOString().slice(0, 10)
  );
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");

  // items from DB
  const [items, setItems] = useState<InventoryItem[]>([]);

  // add-item ui
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItemCategory, setNewItemCategory] = useState("");
  const [newItemName, setNewItemName] = useState("");

  // delete-item ui
  const [showDeleteItem, setShowDeleteItem] = useState(false);
  const [deleteSearch, setDeleteSearch] = useState("");

  // hidden (soft deleted for this UI session) – but we also PATCH the DB
  const [hiddenItems, setHiddenItems] = useState<string[]>([]);

  // spend
  const [spendDate, setSpendDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [spendAmount, setSpendAmount] = useState<string>("");
  const [spendList, setSpendList] = useState<SpendEntry[]>([]);
  const [spendSaving, setSpendSaving] = useState(false);

  // load items from DB once
  useEffect(() => {
    async function loadItems() {
      const res = await fetch("/api/inventory-items");
      const data = await res.json();
      setItems(data);
      setHiddenItems([]); // reset
    }
    loadItems();
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
      // on date change, clear hidden
      setHiddenItems([]);
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

  // categories from items
  const allCategories = useMemo(() => {
    const set = new Set<string>();
    items.forEach((it) => set.add(it.category));
    return Array.from(set);
  }, [items]);

  // grouped items (excluding hidden)
  const grouped = useMemo(() => {
    const map: Record<string, InventoryItem[]> = {};
    items.forEach((it) => {
      const key = `${it.category}__${it.name}`;
      if (hiddenItems.includes(key)) return;
      if (!map[it.category]) map[it.category] = [];
      map[it.category].push(it);
    });
    return map;
  }, [items, hiddenItems]);

  function handleChange(category: string, name: string, value: string) {
    setQuantities((prev) => ({
      ...prev,
      [`${category}__${name}`]: value,
    }));
  }

  async function handleSave() {
    setSaving(true);
    setStatus("");

    // save only visible items
    const itemsToSave = items
      .filter((it) => !hiddenItems.includes(`${it.category}__${it.name}`))
      .map((it) => ({
        category: it.category,
        name: it.name,
        quantity: quantities[`${it.category}__${it.name}`] || "",
      }));

    const res = await fetch("/api/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, items: itemsToSave }),
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

    const filledItems = items
      .filter((it) => !hiddenItems.includes(`${it.category}__${it.name}`))
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

  // add item → POST to DB
  async function handleAddItem() {
    if (!newItemCategory || !newItemName.trim()) return;

    const payload = {
      category: newItemCategory,
      name: newItemName.trim(),
    };

    const res = await fetch("/api/inventory-items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const saved = await res.json();
      setItems((prev) => {
        const exists = prev.some(
          (p) => p.category === saved.category && p.name === saved.name
        );
        if (exists) return prev;
        return [...prev, saved];
      });
    }

    setNewItemName("");
    setShowAddItem(false);
  }

  // delete item → PATCH to DB + hide locally
  async function handleDeleteItem(category: string, name: string) {
    await fetch("/api/inventory-items", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, name, active: false }),
    });

    const key = `${category}__${name}`;
    setHiddenItems((prev) => (prev.includes(key) ? prev : [...prev, key]));

    // also update items array so it doesn't come back until next GET
    setItems((prev) =>
      prev.filter((it) => !(it.category === category && it.name === name))
    );

    setDeleteSearch("");
    setShowDeleteItem(false);
  }

  const deleteCandidates = items
    .filter((it) => !hiddenItems.includes(`${it.category}__${it.name}`))
    .filter((it) =>
      deleteSearch.trim()
        ? it.name.toLowerCase().includes(deleteSearch.toLowerCase()) ||
          it.category.toLowerCase().includes(deleteSearch.toLowerCase())
        : true
    )
    .slice(0, 10);

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
      const listRes = await fetch("/api/inventory-spend");
      const listData = await listRes.json();
      setSpendList(listData);
      setSpendAmount("");
    }
    setSpendSaving(false);
  }

  return (
    <div className="inventory-wrapper">
      <div className="inventory-header">
        <h1>Daily Inventory</h1>
        <div className="inventory-header-actions">
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
          <button
            type="button"
            className="add-item-btn"
            onClick={() => {
              setShowAddItem((p) => !p);
              setShowDeleteItem(false);
              if (!newItemCategory && allCategories.length > 0) {
                setNewItemCategory(allCategories[0]);
              }
            }}
          >
            + Add Item
          </button>
          <button
            type="button"
            className="delete-item-btn"
            onClick={() => {
              setShowDeleteItem((p) => !p);
              setShowAddItem(false);
            }}
          >
            Delete Item
          </button>
        </div>
      </div>

      {showAddItem && (
        <div className="add-item-bar">
          <select
            className="add-item-select"
            value={newItemCategory}
            onChange={(e) => setNewItemCategory(e.target.value)}
          >
            {allCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <input
            className="add-item-input"
            type="text"
            placeholder="Enter item name"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
          />
          <button className="add-item-submit" onClick={handleAddItem}>
            Add
          </button>
          <button
            className="add-item-close"
            onClick={() => setShowAddItem(false)}
          >
            Close
          </button>
        </div>
      )}

      {showDeleteItem && (
        <div className="delete-item-bar">
          <input
            className="delete-item-input"
            type="text"
            placeholder="Search item to delete..."
            value={deleteSearch}
            onChange={(e) => setDeleteSearch(e.target.value)}
          />
          <button
            className="add-item-close"
            onClick={() => setShowDeleteItem(false)}
          >
            Close
          </button>
          <div className="delete-item-list">
            {deleteCandidates.length === 0 && (
              <div className="delete-item-empty">No matching items</div>
            )}
            {deleteCandidates.map((it) => {
              const key = `${it.category}__${it.name}`;
              return (
                <button
                  key={key}
                  type="button"
                  className="delete-item-row"
                  onClick={() => handleDeleteItem(it.category, it.name)}
                >
                  <span className="delete-item-name">{it.name}</span>
                  <span className="delete-item-cat">{it.category}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="inventory-sections">
        {Object.entries(grouped).map(([cat, list]) => (
          <div key={cat} className="inventory-section">
            <h2>{cat}</h2>
            <div className="inventory-items">
              {list.map((it) => {
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

      {/* SPEND SECTION */}
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
