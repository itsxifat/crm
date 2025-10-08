// app/leads/page.jsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import LeadModal from "@/components/LeadModal";
import BulkUploadModal from "@/components/BulkUploadModal";

function StatusBadge({ status }) {
  const map = {
    "New Lead": "bg-blue-100 text-blue-800",
    "Not Converted": "bg-gray-100 text-gray-800",
    Converted: "bg-emerald-100 text-emerald-800",
  };
  return (
    <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${map[status] || map["Not Converted"]}`}>
      {status}
    </span>
  );
}

function Th({ children, className = "" }) {
  return (
    <th className={`px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider ${className}`}>
      {children}
    </th>
  );
}
function Td({ children, className = "" }) {
  return <td className={`px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${className}`}>{children}</td>;
}

export default function LeadsPage() {
  const [data, setData] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [editing, setEditing] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/leads?q=${encodeURIComponent(q)}`, { cache: "no-store" });
      const json = await res.json();
      setData(Array.isArray(json) ? json : json?.rows ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => data, [data]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white text-gray-800">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Leads</h1>
            <p className="mt-1 text-sm text-gray-600">Manage and track prospects with speed.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowBulkModal(true)}
              className="bg-white border border-gray-300 text-gray-800 rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-100 shadow-sm"
            >
              Bulk Upload
            </button>
            <button
              onClick={() => {
                setEditing(null);
                setShowModal(true);
              }}
              className="bg-emerald-600 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-emerald-700 shadow-sm"
            >
              Add Lead
            </button>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-200 flex items-center gap-3">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && load()}
              placeholder="Search by name, email, phone, company…"
              className="flex-1 block w-full pl-3 pr-3 py-2 border border-gray-300 rounded-lg bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
            />
            <button
              onClick={load}
              className="px-4 py-2 rounded-lg bg-gray-100 border border-gray-300 text-gray-800 hover:bg-gray-200"
            >
              Search
            </button>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-16 text-center text-gray-500">Loading…</div>
            ) : filtered.length === 0 ? (
              <div className="py-16 text-center text-gray-500">No leads found.</div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <Th>Name</Th>
                    <Th>Email</Th>
                    <Th className="hidden sm:table-cell">Phone</Th>
                    <Th className="hidden md:table-cell">Company</Th>
                    <Th className="hidden lg:table-cell">Priority</Th>
                    <Th>Status</Th>
                    <Th className="text-right">Actions</Th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filtered.map((lead) => (
                    <tr key={lead._id} className="hover:bg-gray-50">
                      <Td>{lead.name || "—"}</Td>
                      <Td>{lead.email || "—"}</Td>
                      <Td className="hidden sm:table-cell">{lead.phone || "—"}</Td>
                      <Td className="hidden md:table-cell">{lead.company || "—"}</Td>
                      <Td className="hidden lg:table-cell">{lead.priority || "Normal"}</Td>
                      <Td><StatusBadge status={lead.status} /></Td>
                      <Td className="text-right space-x-3">
                        <Link href={`/leads/${encodeURIComponent(lead._id)}`} className="text-emerald-700 hover:underline">
                          Open
                        </Link>
                        <button
                          onClick={() => {
                            setEditing(lead);
                            setShowModal(true);
                          }}
                          className="text-gray-600 hover:underline"
                        >
                          Edit
                        </button>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>

      {showModal && (
        <LeadModal
          lead={editing}
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false);
            load();
          }}
        />
      )}
      {showBulkModal && (
        <BulkUploadModal
          onClose={() => setShowBulkModal(false)}
          onUploaded={() => {
            setShowBulkModal(false);
            load();
          }}
        />
      )}
    </div>
  );
}
