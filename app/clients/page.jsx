"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Search, Plus, Loader2, Building, Mail, Phone, 
  ArrowRight, ChevronRight, MapPin, Trash2, User 
} from "lucide-react";
import { useRouter } from "next/navigation";

// --- Components ---

function PriorityBadge({ priority }) {
  const getStyle = (p) => {
    switch (p) {
      case "High": return "bg-rose-50 text-rose-700 border-rose-200";
      case "Medium": return "bg-amber-50 text-amber-700 border-amber-200";
      case "Normal": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      default: return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide border ${getStyle(priority)}`}>
      {priority || "Normal"}
    </span>
  );
}

function ClientAvatar({ name, logo }) {
  if (logo) {
    return (
      <div className="h-10 w-10 rounded-lg border border-slate-200 bg-white p-0.5 shrink-0 overflow-hidden">
        <img src={logo} alt={name} className="h-full w-full object-contain rounded-md" />
      </div>
    );
  }
  const initials = name ? name.substring(0, 2).toUpperCase() : "--";
  return (
    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-200 text-slate-500 flex items-center justify-center text-xs font-bold shadow-sm shrink-0 select-none">
      {initials}
    </div>
  );
}

export default function ClientsPage() {
  const router = useRouter();
  const [data, setData] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

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

  // Delete Handler
  async function handleDelete(e, id) {
    e.preventDefault(); // Prevent row click navigation
    if (!confirm("Are you sure you want to delete this client? This action cannot be undone.")) return;

    setDeleting(id);
    try {
      const res = await fetch(`/api/clients/${id}`, { method: "DELETE" });
      if (res.ok) {
        // Optimistic update
        setData((prev) => prev.filter((c) => c._id !== id));
      } else {
        alert("Failed to delete client.");
      }
    } catch (error) {
      console.error(error);
      alert("Error deleting client.");
    } finally {
      setDeleting(null);
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
    <div className="min-h-screen bg-[#f9fafb] text-slate-900 font-sans selection:bg-[#10a37f]/10 selection:text-[#10a37f]">
      
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200 px-6 py-4">
        <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
              <span>Directory</span>
              <ChevronRight className="h-3 w-3" />
              <span>Clients</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Client Management</h1>
          </div>
          
          <div className="flex items-center gap-3 self-end sm:self-auto">
             <Link 
               href="/clients/add" 
               className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#10a37f] text-white text-xs font-bold uppercase tracking-wide hover:bg-[#0e906f] shadow-md shadow-emerald-500/20 transition-all transform active:scale-95"
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
              placeholder="Search clients by name, company, or email..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#10a37f]/20 focus:border-[#10a37f] transition-all shadow-sm"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto min-h-[400px]">
            <table className="min-w-full text-sm text-left border-collapse">
              <thead className="bg-slate-50/80 backdrop-blur border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest w-[350px]">Identity</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest hidden sm:table-cell">Contact</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest hidden md:table-cell">Context</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-right w-[120px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan="4" className="p-12 text-center">
                      <div className="flex flex-col items-center gap-3 text-slate-400">
                        <Loader2 className="h-8 w-8 animate-spin text-[#10a37f]" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Loading Directory...</span>
                      </div>
                    </td>
                  </tr>
                ) : data.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="p-12 text-center text-slate-400">
                      <div className="flex flex-col items-center gap-2">
                        <Search className="h-8 w-8 text-slate-200" />
                        <p className="text-sm font-medium">No clients found matching "{q}"</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  data.map((c) => (
                    <tr key={c._id} className="group hover:bg-slate-50/50 transition-colors">
                      
                      {/* Identity Column */}
                      <td className="px-6 py-4 align-top">
                        <div className="flex items-start gap-4">
                          <ClientAvatar name={c.companyName || c.clientName} logo={c.logo} />
                          <div className="flex flex-col gap-0.5">
                            <Link href={`/clients/${c._id}`} className="text-sm font-bold text-slate-900 group-hover:text-[#10a37f] transition-colors line-clamp-1">
                              {c.companyName || "No Company"}
                            </Link>
                            <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                              <User className="h-3 w-3 text-slate-400" />
                              {c.clientName}
                            </div>
                            {c.designation && (
                              <span className="text-[10px] text-slate-400 uppercase tracking-wide font-medium mt-0.5">
                                {c.designation}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Contact Column */}
                      <td className="px-6 py-4 align-top hidden sm:table-cell">
                        <div className="flex flex-col gap-1.5">
                          {c.email ? (
                            <a href={`mailto:${c.email}`} className="flex items-center gap-2 text-xs text-slate-600 hover:text-[#10a37f] transition-colors w-fit">
                              <Mail className="h-3.5 w-3.5 text-slate-400" />
                              <span className="truncate max-w-[200px] font-medium">{c.email}</span>
                            </a>
                          ) : <span className="text-xs text-slate-300 italic">No email</span>}
                          
                          {c.phone ? (
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <Phone className="h-3.5 w-3.5 text-slate-400" />
                              <span className="font-mono">{c.phone}</span>
                            </div>
                          ) : null}
                        </div>
                      </td>

                      {/* Context Column (Priority/Loc) */}
                      <td className="px-6 py-4 align-top hidden md:table-cell">
                          <div className="flex flex-col items-start gap-2">
                            <PriorityBadge priority={c.priority} />
                            {(c.address?.city || c.address?.country) && (
                              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium mt-1">
                                <MapPin className="h-3 w-3 text-slate-400" />
                                <span>{[c.address?.city, c.address?.country].filter(Boolean).join(", ")}</span>
                              </div>
                            )}
                          </div>
                      </td>

                      {/* Actions Column */}
                      <td className="px-6 py-4 text-right align-middle">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                          <Link 
                            href={`/clients/${c._id}`} 
                            className="p-2 rounded-lg text-slate-400 hover:text-[#10a37f] hover:bg-[#10a37f]/10 transition-colors"
                            title="View Profile"
                          >
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                          
                          <button 
                            onClick={(e) => handleDelete(e, c._id)}
                            disabled={deleting === c._id}
                            className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                            title="Delete Client"
                          >
                            {deleting === c._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                          </button>
                        </div>
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