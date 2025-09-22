"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Loader2 } from "lucide-react";
import Link from "next/link";
import InvoiceCreateModal from "@/components/InvoiceCreateModal";
import { listInvoices, deleteInvoice } from "@/lib/requests";

/* ---------------- currency helpers ---------------- */

// map symbols and a few common aliases to ISO codes
const SYMBOL_TO_CODE = {
  "৳": "BDT",
  "tk": "BDT",
  "taka": "BDT",
  "$": "USD",
  "€": "EUR",
  "£": "GBP",
};

function toCurrencyCode(cur) {
  if (!cur) return "USD";
  const s = String(cur).trim();
  const mapped = SYMBOL_TO_CODE[s.toLowerCase()] || SYMBOL_TO_CODE[s] || s.toUpperCase();
  // allow only 3-letter codes; fallback to USD
  return /^[A-Z]{3}$/.test(mapped) ? mapped : "USD";
}

function formatMoney(n, curLike = "USD") {
  const code = toCurrencyCode(curLike);
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(n || 0));
  } catch {
    // ultra-safe fallback
    const sym = code === "BDT" ? "৳" : "$";
    return `${sym} ${Number(n || 0).toFixed(2)}`;
  }
}

/* ---------------- search filter ---------------- */

function useSearchFilter(rows, q) {
  const query = (q || "").toLowerCase();
  return useMemo(() => {
    if (!query) return rows;
    return rows.filter((r) =>
      [r.invoiceId, r.clientName, String(r.total)]
        .filter(Boolean)
        .some((x) => String(x).toLowerCase().includes(query))
    );
  }, [rows, query]);
}

/* ---------------- page ---------------- */

export default function InvoicesPage() {
  const [openCreate, setOpenCreate] = useState(false);
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [currency, setCurrency] = useState("USD"); // default

  async function refresh() {
    setLoading(true);
    try {
      const res = await listInvoices();
      const data = Array.isArray(res?.rows) ? res.rows : [];
      setRows(data);
      // infer currency from first row if present
      if (data[0]?.currency) setCurrency(data[0].currency);
    } catch (e) {
      console.error("List invoices error:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const filtered = useSearchFilter(rows, q);

  async function handleDelete(inv) {
    const ok = window.confirm(`Delete invoice ${inv.invoiceId}? This will also remove its PDF.`);
    if (!ok) return;
    try {
      await deleteInvoice(inv._id);
      setRows((prev) => prev.filter((r) => String(r._id) !== String(inv._id)));
    } catch (e) {
      console.error("Delete invoice error:", e);
      alert("Failed to delete invoice.");
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Invoices</h1>
            <p className="mt-1 text-sm text-gray-600">Create, manage, and track invoices.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setOpenCreate(true)}
              className="flex items-center justify-center gap-2 bg-green-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-green-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">New Invoice</span>
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
              <div className="relative w-full lg:max-w-xl">
                <svg
                  className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M12.9 14.32a8 8 0 111.414-1.414l4.387 4.387a1 1 0 01-1.414 1.414l-4.387-4.387zM14 8a6 6 0 11-12 0 6 6 0 0112 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <input
                  type="text"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search invoices…"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 sm:text-sm"
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <colgroup>
                <col className="w-[160px]" />
                <col className="w-[28%]" />
                <col className="w-[18%]" />
                <col className="w-[16%]" />
                <col className="w-[120px]" />
              </colgroup>
              <thead className="bg-gray-50">
                <tr>
                  <Th>Invoice ID</Th>
                  <Th>Client</Th>
                  <Th>Total</Th>
                  <Th>Status</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-gray-500 text-sm">
                      <Loader2 className="inline-block h-5 w-5 animate-spin text-gray-400 mr-2" />
                      Loading invoices…
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-gray-500 text-sm">
                      No invoices found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((row) => (
                    <tr key={row._id} className="hover:bg-gray-50 transition-colors">
                      <Td>
                        <Link
                          href={`/api/invoices/${row._id}/pdf`}
                          target="_blank"
                          className="text-green-700 hover:underline font-medium break-all"
                        >
                          {row.invoiceId}
                        </Link>
                      </Td>
                      <Td>{row.clientName || "—"}</Td>
                      <Td>{formatMoney(row.total, row.currency || currency)}</Td>
                      <Td>
                        <StatusBadge status={row.status} />
                      </Td>
                      <Td className="text-right">
                        <button
                          onClick={() => handleDelete(row)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-md text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </button>
                      </Td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal */}
        {openCreate && (
          <InvoiceCreateModal
            onClose={() => setOpenCreate(false)}
            onCreated={(inv) => {
              setOpenCreate(false);
              setRows((prev) => [{ ...inv }, ...prev]);
            }}
          />
        )}
      </div>
    </main>
  );
}

/* --- tiny table helpers --- */
function Th({ children, className = "" }) {
  return (
    <th
      className={`px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider ${className}`}
    >
      <span className="block min-w-0 truncate">{children}</span>
    </th>
  );
}

function Td({ children, className = "" }) {
  return (
    <td className={`px-4 sm:px-6 py-4 align-top text-sm text-gray-900 ${className}`}>
      <div className="min-w-0 whitespace-normal break-words hyphens-auto">{children}</div>
    </td>
  );
}

/* --- status badge helper --- */
function StatusBadge({ status }) {
  const map = {
    Created: "bg-emerald-100 text-emerald-800",
    Paid: "bg-blue-100 text-blue-800",
    Overdue: "bg-rose-100 text-rose-800",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        map[status] || "bg-gray-100 text-gray-700"
      }`}
    >
      {status || "—"}
    </span>
  );
}
