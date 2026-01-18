"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Search, Plus, Loader2, Building, Mail, Phone, 
  ArrowRight, ChevronRight, MapPin 
} from "lucide-react";

// --- Components ---

function PriorityBadge({ priority }) {
  const getStyle = (p) => {
    switch (p) {
      case "High": return "bg-rose-50 text-rose-700 border-rose-200";
      case "Medium": return "bg-amber-50 text-amber-700 border-amber-200";
      case "Normal": return "bg-slate-50 text-slate-700 border-slate-200";
      default: return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide border ${getStyle(priority)}`}>
      {priority || "Normal"}
    </span>
  );
}

function ClientAvatar({ name }) {
  const initials = name ? name.substring(0, 2).toUpperCase() : "--";
  return (
    <div className="h-9 w-9 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold shadow-sm shrink-0 select-none">
      {initials}
    </div>
  );
}

export default function ClientsPage() {
  const [data, setData] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/clients/list?q=${encodeURIComponent(q)}`, { cache: "no-store" });
      const json = await res.json();
      setData(json?.rows || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  // Debounced Search
  useEffect(() => {
    const timer = setTimeout(() => {
      load();
    }, 300);
    return () => clearTimeout(timer);
  }, [q]);

  return (
    <div className="min-h-screen bg-[#f9fafb] text-gray-900 font-sans selection:bg-[#10a37f]/10 selection:text-[#10a37f]">
      
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200 px-6 py-4">
        <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">
              <span>Directory</span>
              <ChevronRight className="h-3 w-3" />
              <span>Clients</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Client Management</h1>
          </div>
          
          <div className="flex items-center gap-3 self-end sm:self-auto">
             <Link 
               href="/clients/add" 
               className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#10a37f] text-white text-xs font-bold uppercase tracking-wide hover:bg-[#0e906f] shadow-sm transition-all shadow-emerald-500/20"
             >
               <Plus className="h-3.5 w-3.5" />
               New Client
             </Link>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-4 sm:p-8">
        
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1 max-w-md group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-[#10a37f] transition-colors" />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search clients..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#10a37f] focus:border-[#10a37f] transition-all shadow-sm"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto min-h-[400px]">
            <table className="min-w-full text-sm text-left border-collapse">
              <thead className="bg-slate-50/80 backdrop-blur border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest w-[300px]">Company / Client</th>
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest hidden sm:table-cell">Contact Info</th>
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest hidden md:table-cell">Details</th>
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan="4" className="p-12 text-center">
                      <div className="flex flex-col items-center gap-2 text-slate-400">
                        <Loader2 className="h-6 w-6 animate-spin text-[#10a37f]" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Loading...</span>
                      </div>
                    </td>
                  </tr>
                ) : data.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="p-12 text-center text-slate-400">
                      <p className="text-sm">No clients found matching "{q}"</p>
                    </td>
                  </tr>
                ) : (
                  data.map((c) => (
                    <tr key={c._id} className="group hover:bg-slate-50/80 transition-colors">
                      {/* Identity */}
                      <td className="px-6 py-4 align-top">
                        <div className="flex items-start gap-3">
                          <ClientAvatar name={c.companyName || c.clientName} />
                          <div>
                            <div className="font-bold text-slate-900 group-hover:text-[#10a37f] transition-colors">
                              <Link href={`/clients/${c._id}`}>{c.companyName || "No Company"}</Link>
                            </div>
                            <div className="text-xs text-slate-500 font-medium mt-0.5">
                              {c.clientName}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="px-6 py-4 align-top hidden sm:table-cell">
                        <div className="flex flex-col gap-1.5">
                          {c.email && (
                            <div className="flex items-center gap-2 text-xs text-slate-600">
                              <Mail className="h-3.5 w-3.5 text-slate-400" />
                              <span className="truncate max-w-[200px] font-medium">{c.email}</span>
                            </div>
                          )}
                          {c.phone && (
                            <div className="flex items-center gap-2 text-xs text-slate-600">
                              <Phone className="h-3.5 w-3.5 text-slate-400" />
                              <span className="font-mono">{c.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Priority / Details */}
                      <td className="px-6 py-4 align-top hidden md:table-cell">
                         <div className="flex flex-col items-start gap-2">
                            <PriorityBadge priority={c.priority} />
                            {c.address?.city && (
                              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
                                <MapPin className="h-3 w-3" />
                                <span>{c.address.city}, {c.address.country}</span>
                              </div>
                            )}
                         </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right align-middle">
                        <Link 
                          href={`/clients/${c._id}`} 
                          className="inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-[#10a37f] hover:bg-[#10a37f]/5 transition-all opacity-0 group-hover:opacity-100"
                        >
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}