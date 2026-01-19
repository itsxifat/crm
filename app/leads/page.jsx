"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation"; // Needed for redirection
import LeadModal from "@/components/LeadModal";
import BulkUploadModal from "@/components/BulkUploadModal";
import TableLead from "@/components/TableLead"; 
import ConvertToClientModal from "@/components/ConvertToClientModal"; // <-- IMPORT ADDED
import { Plus, Upload, Search, Filter, Loader2, X, Briefcase, Layers, Globe, Tag } from "lucide-react";

export default function LeadsPage() {
  const router = useRouter();
  const [data, setData] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [editing, setEditing] = useState(null);

  // --- Conversion Modal State ---
  const [convertingLead, setConvertingLead] = useState(null);

  // --- Filter State ---
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedSources, setSelectedSources] = useState([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);
  
  const [meta, setMeta] = useState({
    categories: [], services: [], sources: [], platforms: []
  });

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/leads`, { cache: "no-store" }); 
      const json = await res.json();
      const rows = Array.isArray(json) ? json : json?.rows ?? [];
      setData(rows);

      const unique = (key) => [...new Set(rows.map(r => r[key]).filter(Boolean))].sort();
      setMeta({
        categories: unique('category'),
        services: unique('service'),
        sources: unique('source'),
        platforms: unique('platform')
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  // --- Filtering Logic ---
  const filtered = useMemo(() => {
    return data.filter(lead => {
      const searchStr = q.toLowerCase().trim();
      const matchesSearch = !searchStr || [
        lead.name, lead.email, lead.phone, lead.alternativePhone,
        lead.company, lead.designation, lead.category, lead.service, 
        lead.source, lead.platform, lead.status, lead.reference
      ].some(val => val?.toString().toLowerCase().includes(searchStr));

      const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(lead.category);
      const matchesService = selectedServices.length === 0 || selectedServices.includes(lead.service);
      const matchesSource = selectedSources.length === 0 || selectedSources.includes(lead.source);
      const matchesPlatform = selectedPlatforms.length === 0 || selectedPlatforms.includes(lead.platform);

      return matchesSearch && matchesCategory && matchesService && matchesSource && matchesPlatform;
    });
  }, [data, q, selectedCategories, selectedServices, selectedSources, selectedPlatforms]);

  const toggleFilter = (list, setList, item) => {
    setList(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
  };

  const clearAllFilters = () => {
    setQ("");
    setSelectedCategories([]);
    setSelectedServices([]);
    setSelectedSources([]);
    setSelectedPlatforms([]);
  };

  const activeFilterCount = selectedCategories.length + selectedServices.length + selectedSources.length + selectedPlatforms.length;

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] w-full bg-white font-sans text-slate-900">
      
      {/* Header */}
      <div className="flex-none px-6 py-5 border-b border-slate-100 bg-white/80 backdrop-blur-md z-20 sticky top-0">
        <div className="flex flex-col gap-5 max-w-[1600px] mx-auto w-full">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Leads</h1>
              <p className="text-xs font-medium text-slate-500 mt-1 uppercase tracking-wide">Manage & track prospects</p>
            </div>
            
            <div className="flex items-center gap-3 self-start sm:self-auto">
              <button onClick={() => setShowBulkModal(true)} className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-slate-200 bg-white text-xs font-bold text-slate-600 uppercase tracking-wide hover:bg-slate-50 hover:text-slate-900 transition-colors">
                <Upload className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Import</span>
              </button>
              <button onClick={() => { setEditing(null); setShowModal(true); }} className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#10a37f] text-xs font-bold text-white uppercase tracking-wide hover:bg-[#0d8a6a] transition-all shadow-sm shadow-emerald-500/20">
                <Plus className="h-3.5 w-3.5" />
                Add Lead
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 group">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-4 w-4 text-slate-400 group-focus-within:text-[#10a37f] transition-colors" />
              </div>
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search leads..."
                className="block w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#10a37f] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#10a37f] transition-all shadow-sm"
              />
            </div>
            
            <button onClick={() => setShowFilters(!showFilters)} className={`relative inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all ${showFilters || activeFilterCount > 0 ? "bg-[#10a37f]/5 border-[#10a37f]/20 text-[#10a37f]" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"}`}>
              <Filter className="h-4 w-4" />
              <span>Filter</span>
              {activeFilterCount > 0 && <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#10a37f] text-[10px] font-bold text-white shadow-sm">{activeFilterCount}</span>}
            </button>
          </div>

          {showFilters && (
            <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-lg animate-in slide-in-from-top-2 duration-200">
              <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Filter By</h3>
                <button onClick={clearAllFilters} className="text-xs text-red-500 hover:text-red-700 font-bold uppercase tracking-wide hover:underline flex items-center gap-1"><X className="h-3 w-3" /> Reset</button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div>
                  <div className="flex items-center gap-2 mb-3 text-slate-500"><Briefcase className="h-3.5 w-3.5" /><span className="text-[10px] font-bold uppercase tracking-widest">Service</span></div>
                  <div className="flex flex-wrap gap-2">{meta.services.map(s => <button key={s} onClick={() => toggleFilter(selectedServices, setSelectedServices, s)} className={`px-2.5 py-1 rounded text-[11px] font-semibold border transition-all ${selectedServices.includes(s) ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"}`}>{s}</button>)}</div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-3 text-slate-500"><Layers className="h-3.5 w-3.5" /><span className="text-[10px] font-bold uppercase tracking-widest">Category</span></div>
                  <div className="flex flex-wrap gap-2">{meta.categories.map(c => <button key={c} onClick={() => toggleFilter(selectedCategories, setSelectedCategories, c)} className={`px-2.5 py-1 rounded text-[11px] font-semibold border transition-all ${selectedCategories.includes(c) ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"}`}>{c}</button>)}</div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-3 text-slate-500"><Globe className="h-3.5 w-3.5" /><span className="text-[10px] font-bold uppercase tracking-widest">Source</span></div>
                  <div className="flex flex-wrap gap-2">{meta.sources.map(s => <button key={s} onClick={() => toggleFilter(selectedSources, setSelectedSources, s)} className={`px-2.5 py-1 rounded text-[11px] font-semibold border transition-all ${selectedSources.includes(s) ? "bg-purple-50 border-purple-200 text-purple-700" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"}`}>{s}</button>)}</div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-3 text-slate-500"><Tag className="h-3.5 w-3.5" /><span className="text-[10px] font-bold uppercase tracking-widest">Platform</span></div>
                  <div className="flex flex-wrap gap-2">{meta.platforms.map(p => <button key={p} onClick={() => toggleFilter(selectedPlatforms, setSelectedPlatforms, p)} className={`px-2.5 py-1 rounded text-[11px] font-semibold border transition-all ${selectedPlatforms.includes(p) ? "bg-orange-50 border-orange-200 text-orange-700" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"}`}>{p}</button>)}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Table Area */}
      <div className="flex-1 overflow-hidden relative w-full bg-slate-50/50">
        
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-30 backdrop-blur-[1px]">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 text-[#10a37f] animate-spin" />
              <span className="text-xs font-bold text-slate-400 tracking-widest uppercase">Loading Data...</span>
            </div>
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 z-10">
            <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mb-4"><Search className="h-8 w-8 text-slate-400" /></div>
            <h3 className="text-lg font-bold text-slate-900">No leads found</h3>
            <p className="text-slate-500 max-w-xs mx-auto mt-2 text-sm">We couldn't find any matches for "{q}" {activeFilterCount > 0 && " with the selected filters"}.</p>
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button onClick={clearAllFilters} className="px-4 py-2 bg-white border border-slate-200 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm transition-colors">Clear Filters</button>
              <button onClick={() => { setEditing(null); setShowModal(true); }} className="px-4 py-2 bg-[#10a37f] rounded-md text-sm font-medium text-white hover:bg-[#0d8a6a] shadow-sm transition-colors">Create Lead</button>
            </div>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="h-full w-full overflow-auto px-6 py-6 custom-scrollbar">
             <TableLead 
                data={filtered}
                onEdit={(lead) => { setEditing(lead); setShowModal(true); }}
                onDeleted={load}
                // --- CONNECTED THE CONVERSION HANDLER ---
                onConvert={(lead) => setConvertingLead(lead)} 
             />
          </div>
        )}
      </div>

      {/* Modals */}
      {showModal && <LeadModal lead={editing} onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); load(); }} />}
      {showBulkModal && <BulkUploadModal onClose={() => setShowBulkModal(false)} onUploaded={() => { setShowBulkModal(false); load(); }} />}
      
      {/* --- CONVERSION MODAL --- */}
      {convertingLead && (
        <ConvertToClientModal 
          lead={convertingLead}
          onClose={() => setConvertingLead(null)}
          onSuccess={(clientId) => {
             setConvertingLead(null);
             router.push(`/clients/${clientId}`);
          }}
        />
      )}
    </div>
  );
}