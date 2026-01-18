"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { 
  Edit, Trash2, ChevronDown, Check, Loader2, 
  Phone, Mail, Building, Globe, Layers, User 
} from "lucide-react";

// --- Status Styles (OpenAI Clean Palette) ---
const STATUS_CONFIG = {
  "New Lead":      { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-600" },
  "Contacted":     { bg: "bg-indigo-50", text: "text-indigo-700", dot: "bg-indigo-600" },
  "Qualified":     { bg: "bg-purple-50", text: "text-purple-700", dot: "bg-purple-600" },
  "Proposal Sent": { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-600" },
  "Negotiation":   { bg: "bg-orange-50", text: "text-orange-700", dot: "bg-orange-600" },
  "Closed - Won":  { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-600" },
  "Closed - Lost": { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-600" },
  "Follow-Up":     { bg: "bg-cyan-50", text: "text-cyan-700", dot: "bg-cyan-600" },
};

const STATUS_OPTIONS = Object.keys(STATUS_CONFIG);

// --- Status Dropdown with Fixed Portal ---
function StatusDropdown({ initialStatus, leadId }) {
  const [status, setStatus] = useState(initialStatus);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const buttonRef = useRef(null);

  // Update local state if prop changes
  useEffect(() => { setStatus(initialStatus); }, [initialStatus]);

  // Calculate Fixed Position to avoid clipping
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const heightNeeded = 280; // approximate dropdown height
      const showAbove = spaceBelow < heightNeeded;

      setCoords({
        left: rect.left,
        top: showAbove ? rect.top - 4 : rect.bottom + 4,
        width: 170, // Fixed width for dropdown
        placement: showAbove ? "bottom" : "top"
      });
    }
  }, [isOpen]);

  // Close on outside click or scroll
  useEffect(() => {
    if (!isOpen) return;
    const handleGlobalClick = (e) => {
      // Ignore clicks inside the button or the portal menu
      if (buttonRef.current?.contains(e.target)) return;
      if (e.target.closest('.status-portal-menu')) return;
      setIsOpen(false);
    };
    // Close on scroll to prevent detached UI
    window.addEventListener("scroll", () => setIsOpen(false), true);
    window.addEventListener("mousedown", handleGlobalClick);
    return () => {
      window.removeEventListener("scroll", () => setIsOpen(false), true);
      window.removeEventListener("mousedown", handleGlobalClick);
    };
  }, [isOpen]);

  const handleSelect = async (newStatus) => {
    if (newStatus === status) { setIsOpen(false); return; }
    setIsOpen(false);
    setIsLoading(true);
    
    try {
      setStatus(newStatus); // Optimistic UI
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed");
    } catch (error) {
      setStatus(initialStatus); // Revert on error
    } finally {
      setIsLoading(false);
    }
  };

  const style = STATUS_CONFIG[status] || STATUS_CONFIG["New Lead"];

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => !isLoading && setIsOpen(!isOpen)}
        disabled={isLoading}
        className={`group relative inline-flex items-center gap-2 pl-2.5 pr-2 py-1.5 text-[11px] font-bold uppercase tracking-wide rounded-md border transition-all duration-200
          ${style.bg} ${style.text} border-transparent hover:border-current hover:brightness-95
          ${isLoading ? "opacity-70 cursor-wait" : ""}
        `}
      >
        {isLoading ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
        )}
        <span className="truncate max-w-[90px] text-left">{status}</span>
        <ChevronDown className={`h-3 w-3 opacity-50 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && createPortal(
        <div 
          className="status-portal-menu fixed z-[9999] bg-white rounded-lg shadow-xl border border-slate-100 ring-1 ring-black/5 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top-left"
          style={{
            top: coords.placement === "bottom" ? 'auto' : coords.top,
            bottom: coords.placement === "bottom" ? (window.innerHeight - coords.top) : 'auto',
            left: coords.left,
            width: coords.width
          }}
        >
          <div className="py-1 max-h-[260px] overflow-y-auto custom-scrollbar">
            {STATUS_OPTIONS.map((option) => {
              const optStyle = STATUS_CONFIG[option];
              const isSelected = status === option;
              return (
                <button
                  key={option}
                  onClick={() => handleSelect(option)}
                  className={`w-full text-left px-3 py-2 text-xs font-medium flex items-center justify-between transition-colors
                    ${isSelected ? "bg-slate-50 text-slate-900" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}
                  `}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${optStyle.dot}`} />
                    {option}
                  </div>
                  {isSelected && <Check className="h-3 w-3 text-[#10a37f]" />}
                </button>
              );
            })}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

// --- Main Table ---
export default function TableLead({ data = [], onEdit, onDeleted }) {
  async function handleDelete(id) {
    if (!confirm("Are you sure you want to delete this lead?")) return;
    await fetch(`/api/leads/${id}`, { method: "DELETE" });
    onDeleted?.();
  }

  return (
    <div className="border border-slate-200 rounded-lg bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden font-sans">
      <div className="overflow-x-auto min-h-[300px]">
        <table className="min-w-full text-sm border-separate border-spacing-0">
          
          {/* Header */}
          <thead className="bg-slate-50/80 backdrop-blur-sm text-slate-500">
            <tr>
              <th className="sticky left-0 z-20 border-b border-slate-200 bg-slate-50/95 px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)] w-[220px] sm:w-auto">Identity</th>
              <th className="border-b border-slate-200 px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest w-[140px]">Status</th>
              <th className="hidden sm:table-cell border-b border-slate-200 px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest">Contact</th>
              <th className="hidden md:table-cell border-b border-slate-200 px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest">Context</th>
              <th className="border-b border-slate-200 px-4 py-3 text-right text-[10px] font-bold uppercase tracking-widest w-[80px]">Actions</th>
            </tr>
          </thead>

          {/* Body */}
          <tbody className="divide-y divide-slate-100 bg-white">
            {data.length === 0 && (
              <tr>
                <td colSpan="5" className="p-12 text-center text-slate-400 text-sm">
                  No leads found. Try adjusting your filters.
                </td>
              </tr>
            )}
            
            {data.map((lead) => (
              <tr key={lead._id} className="hover:bg-slate-50/60 transition-colors group">
                
                {/* 1. Identity (Name, Designation, Company) */}
                <td className="sticky left-0 z-10 border-b border-slate-100 bg-white group-hover:bg-slate-50/60 px-4 py-3 align-top shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)]">
                  <div className="flex flex-col gap-1 max-w-[200px]">
                    <div className="flex items-center gap-2">
                      <Link href={`/leads/${lead._id}`} className="text-sm font-bold text-slate-900 hover:text-[#10a37f] transition-colors truncate">
                        {lead.name}
                      </Link>
                    </div>
                    {/* Name & Designation Line */}
                    {lead.designation && (
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                        <User className="h-3 w-3 text-slate-300" />
                        <span className="truncate">{lead.designation}</span>
                      </div>
                    )}
                    {/* Company Line */}
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                       <Building className="h-3 w-3 text-slate-300" />
                       <span className="truncate font-medium">{lead.company || "No Company"}</span>
                    </div>
                  </div>
                </td>

                {/* 2. Status */}
                <td className="border-b border-slate-100 px-4 py-3 align-top">
                  <StatusDropdown initialStatus={lead.status} leadId={lead._id} />
                </td>

                {/* 3. Contact (Hidden Mobile) */}
                <td className="hidden sm:table-cell border-b border-slate-100 px-4 py-3 align-top">
                  <div className="flex flex-col gap-1.5">
                    {lead.email && (
                      <div className="flex items-center gap-2 text-xs text-slate-600 group/item hover:text-slate-900 transition-colors">
                        <Mail className="h-3.5 w-3.5 text-slate-400" />
                        <span className="truncate max-w-[180px] font-medium">{lead.email}</span>
                      </div>
                    )}
                    {lead.phone && (
                      <div className="flex items-center gap-2 text-xs text-slate-500 group/item">
                        <Phone className="h-3.5 w-3.5 text-slate-400" />
                        <span className="font-mono">{lead.phone}</span>
                      </div>
                    )}
                    {!lead.email && !lead.phone && <span className="text-xs text-slate-300 italic">—</span>}
                  </div>
                </td>

                {/* 4. Context (Source, Platform, Service) - Hidden Tablet */}
                <td className="hidden md:table-cell border-b border-slate-100 px-4 py-3 align-top">
                  <div className="flex flex-col gap-2 items-start">
                    
                    {/* Source & Platform Tags */}
                    <div className="flex flex-wrap gap-1.5">
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-slate-100 rounded border border-slate-200 text-[10px] font-semibold text-slate-600 uppercase tracking-wide">
                        <Globe className="h-3 w-3 text-slate-400" />
                        {lead.source || "N/A"}
                      </span>
                      {lead.platform && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-slate-100 rounded border border-slate-200 text-[10px] font-semibold text-slate-600 uppercase tracking-wide">
                          <Layers className="h-3 w-3 text-slate-400" />
                          {lead.platform}
                        </span>
                      )}
                    </div>

                    {/* Service Badge */}
                    {lead.service && (
                      <span className="text-[10px] font-bold text-[#10a37f] px-2 py-0.5 bg-[#10a37f]/5 rounded border border-[#10a37f]/20 truncate max-w-[140px]">
                        {lead.service}
                      </span>
                    )}
                  </div>
                </td>

                {/* 5. Actions */}
                <td className="border-b border-slate-100 px-4 py-3 text-right align-top">
                  <div className="flex justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => onEdit(lead)} 
                      className="p-1.5 text-slate-400 hover:text-[#10a37f] hover:bg-[#10a37f]/5 rounded-md transition-colors"
                      title="Edit details"
                    >
                      <Edit size={15} />
                    </button>
                    <button 
                      onClick={() => handleDelete(lead._id)} 
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      title="Delete permanently"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}