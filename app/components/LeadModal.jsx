// components/LeadModal.jsx
"use client";

import { useState } from "react";

export default function LeadModal({ lead, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: lead?.name || "",
    email: lead?.email || "",
    phone: lead?.phone || "",
    company: lead?.company || "",
    priority: lead?.priority || "Normal",
    status: lead?.status || "New Lead",
  });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const method = lead ? "PATCH" : "POST";
      const url = lead ? `/api/leads/${lead._id}` : `/api/leads`;
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to save");
      onSaved();
    } catch (e) {
      alert("Error saving lead");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl border border-gray-200 w-full max-w-lg p-6 shadow-xl">
        <h2 className="text-xl font-semibold mb-4">
          {lead ? "Edit Lead" : "Add Lead"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="Phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="Company"
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
            >
              <option>Normal</option>
              <option>Medium</option>
              <option>High</option>
            </select>

            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option>New Lead</option>
              <option>Not Converted</option>
              <option>Converted</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              disabled={saving}
              type="submit"
              className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
            >
              {saving ? "Saving..." : "Save Lead"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
