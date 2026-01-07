"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Edit, Trash2, ChevronDown, Check, Loader2 } from "lucide-react";

// --- Configuration ---
const STATUS_CONFIG = {
  "New Lead":      { bg: "bg-blue-100", text: "text-blue-800", ring: "ring-blue-500/30" },
  "Contacted":     { bg: "bg-indigo-100", text: "text-indigo-800", ring: "ring-indigo-500/30" },
  "Qualified":     { bg: "bg-purple-100", text: "text-purple-800", ring: "ring-purple-500/30" },
  "Proposal Sent": { bg: "bg-yellow-100", text: "text-yellow-800", ring: "ring-yellow-500/30" },
  "Negotiation":   { bg: "bg-orange-100", text: "text-orange-800", ring: "ring-orange-500/30" },
  "Closed - Won":  { bg: "bg-emerald-100", text: "text-emerald-800", ring: "ring-emerald-500/30" },
  "Closed - Lost": { bg: "bg-red-100", text: "text-red-800", ring: "ring-red-500/30" },
  "Follow-Up":     { bg: "bg-cyan-100", text: "text-cyan-800", ring: "ring-cyan-500/30" },
};

const STATUS_OPTIONS = Object.keys(STATUS_CONFIG);

// --- Status Dropdown Component ---
function StatusDropdown({ initialStatus, leadId }) {
  const [status, setStatus] = useState(initialStatus);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => { setStatus(initialStatus); }, [initialStatus]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = async (newStatus) => {
    if (newStatus === status) {
      setIsOpen(false);
      return;
    }
    setIsOpen(false);
    setIsLoading(true);
    
    try {
      const oldStatus = status; 
      setStatus(newStatus); // Optimistic Update

      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error("Failed to update");
    } catch (error) {
      console.error("Status update failed:", error);
      setStatus(initialStatus); // Revert
    } finally {
      setIsLoading(false);
    }
  };

  const styles = STATUS_CONFIG[status] || STATUS_CONFIG["New Lead"];

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !isLoading && setIsOpen(!isOpen)}
        disabled={isLoading}
        className={`group inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-full transition-all duration-200 border border-transparent
          ${styles.bg} ${styles.text} ${isOpen ? `ring-2 ${styles.ring}` : "hover:brightness-95"}
          ${isLoading ? "opacity-75 cursor-wait" : "cursor-pointer"}
        `}
      >
        {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <span className="truncate max-w-[80px] sm:max-w-[100px]">{status}</span>}
        {!isLoading && (
          <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${isOpen ? "rotate-180" : "text-current/60"}`} />
        )}
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          <div className="py-1 max-h-[300px] overflow-y-auto custom-scrollbar">
            {STATUS_OPTIONS.map((option) => {
              const optStyle = STATUS_CONFIG[option];
              const isSelected = status === option;
              return (
                <button
                  key={option}
                  onClick={() => handleSelect(option)}
                  className={`w-full text-left px-4 py-2.5 text-xs font-medium flex items-center justify-between group transition-colors
                    ${isSelected ? "bg-gray-50 text-gray-900" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}
                  `}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${optStyle.text.replace('text-', 'bg-').replace('800', '500')}`} />
                    {option}
                  </div>
                  {isSelected && <Check className="h-3.5 w-3.5 text-emerald-600" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// --- Table Component ---
export default function TableLead({ data = [], onEdit, onDeleted }) {
  async function handleDelete(id) {
    if (!confirm("Are you sure you want to delete this lead?")) return;
    await fetch(`/api/leads/${id}`, { method: "DELETE" });
    onDeleted?.();
  }

  return (
    <div className="border border-gray-200 rounded-lg bg-white shadow-sm overflow-x-auto min-h-[400px]">
      <table className="min-w-full text-sm border-separate border-spacing-0">
        <thead className="bg-gray-50 text-gray-600 sticky top-0 z-10">
          <tr>
            <th className="sticky left-0 z-20 border-b border-gray-200 bg-gray-50 px-4 py-3 text-left text-xs font-semibold text-gray-900 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Lead Details</th>
            <th className="border-b border-gray-200 bg-gray-50 px-4 py-3 text-left text-xs font-semibold text-gray-900">Status</th>
            <th className="hidden sm:table-cell border-b border-gray-200 bg-gray-50 px-4 py-3 text-left text-xs font-semibold text-gray-900">Contact</th>
            <th className="hidden md:table-cell border-b border-gray-200 bg-gray-50 px-4 py-3 text-left text-xs font-semibold text-gray-900">Source</th>
            <th className="border-b border-gray-200 bg-gray-50 px-4 py-3 text-right text-xs font-semibold text-gray-900">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.length === 0 && (
            <tr>
              <td colSpan="5" className="text-center p-8 text-gray-500">No leads found</td>
            </tr>
          )}
          
          {data.map((lead) => (
            <tr key={lead._id} className="hover:bg-gray-50 transition-colors group">
              
              {/* Name & Company */}
              <td className="sticky left-0 z-10 border-b border-gray-100 bg-white group-hover:bg-gray-50 px-4 py-3 align-middle shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                <div className="flex flex-col max-w-[160px] sm:max-w-xs">
                  <Link href={`/leads/${lead._id}`} className="text-sm font-medium text-gray-900 hover:text-emerald-600 truncate">
                    {lead.name}
                  </Link>
                  {lead.company ? (
                    <span className="text-xs text-gray-500 truncate mt-0.5">{lead.company}</span>
                  ) : (
                    <span className="text-xs text-gray-300 italic mt-0.5">No Company</span>
                  )}
                  {/* Mobile Badges */}
                  <div className="flex gap-1 mt-1 sm:hidden flex-wrap">
                    {lead.service && <span className="text-[9px] px-1.5 py-0.5 bg-gray-100 rounded text-gray-600 truncate max-w-[80px]">{lead.service}</span>}
                  </div>
                </div>
              </td>

              {/* Status Dropdown */}
              <td className="border-b border-gray-100 px-4 py-3 align-middle overflow-visible">
                <StatusDropdown initialStatus={lead.status} leadId={lead._id} />
              </td>

              {/* Contact */}
              <td className="hidden sm:table-cell border-b border-gray-100 px-4 py-3 align-middle">
                <div className="flex flex-col gap-1 text-xs text-gray-600">
                  {lead.email && <span className="truncate max-w-[150px]">{lead.email}</span>}
                  {lead.phone && <span>{lead.phone}</span>}
                </div>
              </td>

              {/* Source */}
              <td className="hidden md:table-cell border-b border-gray-100 px-4 py-3 align-middle text-xs text-gray-500">
                <div className="flex flex-col gap-1">
                  <span>{lead.source || "—"}</span>
                  {lead.service && <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 rounded-full w-fit">{lead.service}</span>}
                </div>
              </td>

              {/* Actions */}
              <td className="border-b border-gray-100 px-4 py-3 text-right align-middle">
                <div className="flex justify-end gap-1">
                  <button onClick={() => onEdit(lead)} className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                    <Edit size={16} />
                  </button>
                  <button onClick={() => handleDelete(lead._id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}