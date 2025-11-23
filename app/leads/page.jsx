"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import LeadModal from "@/components/LeadModal";
import BulkUploadModal from "@/components/BulkUploadModal";
import { Plus, Upload, Search, Filter, Edit, MoreHorizontal, Phone, Mail, Building } from "lucide-react";

// --- Components ---

function StatusBadge({ status }) {
  const map = {
    "New Lead": "bg-blue-50 text-blue-700 ring-blue-600/20",
    "Not Converted": "bg-gray-50 text-gray-600 ring-gray-500/10",
    Converted: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  };
  const style = map[status] || map["Not Converted"];
  return (
    <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset ${style} whitespace-nowrap`}>
      {status}
    </span>
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
  }, []);

  const filtered = useMemo(() => data, [data]);

  return (
    <div className="flex flex-col h-full w-full max-w-full overflow-hidden bg-white">
      
      {/* --- Header Area --- */}
      <div className="flex-none px-4 py-4 border-b border-gray-200 bg-white">
        <div className="flex flex-col gap-4">
          {/* Title & Actions Row */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Leads</h1>
              <p className="text-xs text-gray-500">Manage your prospects.</p>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowBulkModal(true)}
                className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 sm:px-3 sm:py-2 sm:flex sm:items-center sm:gap-2"
                title="Import"
              >
                <Upload className="h-4 w-4" />
                <span className="hidden sm:inline text-xs font-medium">Import</span>
              </button>
              <button
                onClick={() => { setEditing(null); setShowModal(true); }}
                className="p-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 sm:px-3 sm:py-2 sm:flex sm:items-center sm:gap-2 shadow-sm"
                title="Add Lead"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline text-xs font-medium">Add Lead</span>
              </button>
            </div>
          </div>

          {/* Search Row */}
          <div className="relative w-full">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && load()}
              placeholder="Search leads..."
              className="block w-full rounded-lg border-0 py-2 pl-9 pr-3 text-gray-900 ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm sm:leading-6 bg-gray-50/50"
            />
          </div>
        </div>
      </div>

      {/* --- Responsive Table Container --- */}
      {/* 'flex-1' fills remaining height. 'overflow-auto' handles scrolling. */}
      <div className="flex-1 overflow-auto relative w-full">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-30 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-emerald-600 font-medium text-sm animate-pulse">
              <div className="h-2 w-2 rounded-full bg-emerald-600" /> Loading...
            </div>
          </div>
        )}

        <table className="min-w-full border-separate border-spacing-0 text-left w-full">
          <thead className="bg-gray-50 sticky top-0 z-20 shadow-sm">
            <tr>
              {/* 1. Name (Primary) */}
              <th scope="col" className="border-b border-gray-200 bg-gray-50 py-3 pl-4 pr-2 text-xs font-semibold text-gray-900 w-auto">
                Name / Company
              </th>
              
              {/* 2. Status (Visible on all) */}
              <th scope="col" className="border-b border-gray-200 bg-gray-50 px-2 py-3 text-xs font-semibold text-gray-900 w-[100px] sm:w-auto">
                Status
              </th>

              {/* 3. Contact (Hidden on Mobile) */}
              <th scope="col" className="hidden sm:table-cell border-b border-gray-200 bg-gray-50 px-2 py-3 text-xs font-semibold text-gray-900">
                Contact
              </th>

              {/* 4. Source (Hidden on Mobile/Tablet) */}
              <th scope="col" className="hidden md:table-cell border-b border-gray-200 bg-gray-50 px-2 py-3 text-xs font-semibold text-gray-900">
                Source
              </th>
              
              {/* 5. Actions */}
              <th scope="col" className="border-b border-gray-200 bg-gray-50 py-3 pl-2 pr-4 text-right text-xs font-semibold text-gray-900 w-[50px]">
                <span className="sr-only">Edit</span>
              </th>
            </tr>
          </thead>
          
          <tbody className="divide-y divide-gray-100 bg-white">
            {filtered.length === 0 && !loading && (
              <tr>
                <td colSpan={5} className="py-12 text-center text-sm text-gray-500">
                  No leads found.
                </td>
              </tr>
            )}
            
            {filtered.map((lead) => (
              <tr key={lead._id} className="hover:bg-gray-50 group">
                
                {/* Column 1: Name & Company (Stacked) */}
                <td className="border-b border-gray-100 py-3 pl-4 pr-2 align-middle">
                  <div className="flex flex-col max-w-[160px] sm:max-w-xs">
                    <Link 
                      href={`/leads/${encodeURIComponent(lead._id)}`} 
                      className="text-sm font-medium text-gray-900 hover:text-emerald-600 truncate"
                    >
                      {lead.name}
                    </Link>
                    {lead.company ? (
                      <div className="flex items-center gap-1 mt-0.5">
                        <Building className="h-3 w-3 text-gray-400 hidden sm:block" />
                        <span className="text-xs text-gray-500 truncate">{lead.company}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-300 italic mt-0.5">No Company</span>
                    )}
                  </div>
                </td>

                {/* Column 2: Status */}
                <td className="border-b border-gray-100 px-2 py-3 align-middle">
                  <StatusBadge status={lead.status} />
                </td>

                {/* Column 3: Contact (Hidden on Mobile) */}
                <td className="hidden sm:table-cell border-b border-gray-100 px-2 py-3 align-middle">
                  <div className="flex flex-col gap-1 text-xs text-gray-600">
                    {lead.email && (
                      <div className="flex items-center gap-1.5">
                        <Mail className="h-3 w-3 text-gray-400" />
                        <span className="truncate max-w-[150px]">{lead.email}</span>
                      </div>
                    )}
                    {lead.phone && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="h-3 w-3 text-gray-400" />
                        <span>{lead.phone}</span>
                      </div>
                    )}
                  </div>
                </td>

                {/* Column 4: Source (Hidden on Mobile/Tablet) */}
                <td className="hidden md:table-cell border-b border-gray-100 px-2 py-3 align-middle text-xs text-gray-500">
                  {lead.source || "—"}
                </td>

                {/* Column 5: Action */}
                <td className="border-b border-gray-100 py-3 pl-2 pr-4 text-right align-middle">
                  <button
                    onClick={() => { setEditing(lead); setShowModal(true); }}
                    className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {showModal && (
        <LeadModal
          lead={editing}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); load(); }}
        />
      )}
      {showBulkModal && (
        <BulkUploadModal
          onClose={() => setShowBulkModal(false)}
          onUploaded={() => { setShowBulkModal(false); load(); }}
        />
      )}
    </div>
  );
}