"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import LeadModal from "@/components/LeadModal";
import BulkUploadModal from "@/components/BulkUploadModal";
import { Plus, Upload, Search, Mail, Phone, Building, Edit, MoreVertical } from "lucide-react"; 

// --- StatusBadge Component (No changes) ---
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

// --- Table Header (No changes) ---
function Th({ children, className = "" }) {
  return (
    <th className={`px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider ${className}`}>
      {children}
    </th>
  );
}

// --- Table Cell (No changes) ---
function Td({ children, className = "" }) {
  return <td className={`px-4 sm:px-6 py-4 text-sm text-gray-900 ${className}`}>{children}</td>;
}

// --- Lead Card Component for Mobile (No changes) ---
function LeadCard({ lead, onEditClick }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Card Header: Name, Status, and Actions */}
      <div className="p-4 border-b border-gray-200 flex justify-between items-start gap-4">
        <div>
          <h3 className="font-semibold text-gray-900 break-words">{lead.name || "—"}</h3>
          <div className="mt-1">
            <StatusBadge status={lead.status} />
          </div>
        </div>
        <div className="flex-shrink-0 flex items-center gap-2">
          <Link href={`/leads/${encodeURIComponent(lead._id)}`} className="text-emerald-700 font-medium text-sm hover:underline">
            Open
          </Link>
          <button
            onClick={onEditClick}
            className="text-gray-600 hover:underline text-sm"
          >
            Edit
          </button>
        </div>
      </div>
      
      {/* Card Body: Contact Info */}
      <div className="p-4 space-y-3">
        {lead.email && (
          <div className="flex items-center gap-3">
            <Mail className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-800 break-all">{lead.email}</span>
          </div>
        )}
        {lead.phone && (
          <div className="flex items-center gap-3">
            <Phone className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-800">{lead.phone}</span>
          </div>
        )}
        {lead.company && (
          <div className="flex items-center gap-3">
            <Building className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-800">{lead.company}</span>
          </div>
        )}
      </div>
    </div>
  );
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
    <div>
      {/* --- Page Header (No changes) --- */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900">Leads</h1>
          <p className="mt-1 text-sm text-gray-600">Manage and track prospects with speed.</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setShowBulkModal(true)}
            className="flex items-center gap-2 bg-white border border-gray-300 text-gray-800 rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-100 shadow-sm"
          >
            <Upload size={16} />
            Bulk Upload
          </button>
          <button
            onClick={() => {
              setEditing(null);
              setShowModal(true);
            }}
            className="flex items-center gap-2 bg-emerald-600 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-emerald-700 shadow-sm"
          >
            <Plus size={16} />
            Add Lead
          </button>
        </div>
      </div>

      {/* --- Data Container (No changes) --- */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Search Bar (No changes) */}
        <div className="p-4 sm:p-6 border-b border-gray-200 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full flex-1">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && load()}
              placeholder="Search by name, email, phone, company…"
              className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
            />
            <button
              onClick={load}
              className="absolute inset-y-0 right-0 flex items-center justify-center px-3 text-gray-500 hover:text-emerald-600"
            >
              <Search size={18} />
            </button>
          </div>
        </div>

        {/* --- Content Area (No changes) --- */}
        {loading ? (
          <div className="py-16 text-center text-gray-500">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-500">No leads found.</div>
        ) : (
          <>
            {/* --- Mobile: Card List (No changes) --- */}
            <div className="p-4 space-y-4 md:hidden">
              {filtered.map((lead) => (
                <LeadCard
                  key={lead._id}
                  lead={lead}
                  onEditClick={() => {
                    setEditing(lead);
                    setShowModal(true);
                  }}
                />
              ))}
            </div>

            {/* --- THIS IS THE FIX ---
              The table is hidden below 'md' (768px).
              Columns are progressively revealed at 'lg' (1024px), 'xl' (1280px), and '2xl' (1536px).
            */}
            <div className="overflow-x-auto hidden md:block">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <Th>Name</Th>
                    <Th className="hidden lg:table-cell">Company</Th>
                    <Th className="hidden xl:table-cell">Email</Th>
                    <Th className="hidden 2xl:table-cell">Phone</Th>
                    <Th>Status</Th>
                    <Th className="text-right">Actions</Th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filtered.map((lead) => (
                    <tr key={lead._id} className="hover:bg-gray-50">
                      <Td>{lead.name || "—"}</Td>
                      <Td className="hidden lg:table-cell">{lead.company || "—"}</Td>
                      <Td className="hidden xl:table-cell">{lead.email || "—"}</Td>
                      <Td className="hidden 2xl:table-cell">{lead.phone || "—"}</Td>
                      <Td><StatusBadge status={lead.status} /></Td>
                      <Td className="text-right space-x-3 whitespace-nowrap">
                        <Link href={`/leads/${encodeURIComponent(lead._id)}`} className="text-emerald-700 hover:underline font-medium">
                          Open
                        </Link>
                        <button
                          onClick={() => {
                            setEditing(lead);
                            setShowModal(true);
                          }}
                          className="text-gray-600 hover:underline font-medium"
                        >
                          Edit
                        </button>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* --- Modals (No changes) --- */}
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