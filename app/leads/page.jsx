"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import LeadModal from "@/components/LeadModal";
import BulkUploadModal from "@/components/BulkUploadModal";
import TableLead from "@/components/TableLead"; // Import the new table
import { Plus, Upload, Search, Filter, Loader2 } from "lucide-react";

export default function LeadsPage() {
  const [data, setData] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [editing, setEditing] = useState(null);

  // --- Filter State ---
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  
  // --- Metadata for Filters ---
  const [allCategories, setAllCategories] = useState([]);
  const [allServices, setAllServices] = useState([]);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/leads`, { cache: "no-store" }); 
      const json = await res.json();
      const rows = Array.isArray(json) ? json : json?.rows ?? [];
      setData(rows);

      const cats = [...new Set(rows.map(r => r.category).filter(Boolean))].sort();
      const servs = [...new Set(rows.map(r => r.service).filter(Boolean))].sort();
      setAllCategories(cats);
      setAllServices(servs);

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // --- Robust Filtering Logic ---
  const filtered = useMemo(() => {
    return data.filter(lead => {
      // 1. Search Query
      const searchStr = q.toLowerCase();
      const matchesSearch = !q || [
        lead.name, lead.email, lead.phone, lead.company, 
        lead.category, lead.service, lead.source
      ].some(val => val?.toLowerCase().includes(searchStr));

      // 2. Category Filter
      const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(lead.category);

      // 3. Service Filter
      const matchesService = selectedServices.length === 0 || selectedServices.includes(lead.service);

      return matchesSearch && matchesCategory && matchesService;
    });
  }, [data, q, selectedCategories, selectedServices]);

  const toggleFilter = (list, setList, item) => {
    setList(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
  };

  return (
    <div className="flex flex-col h-full w-full max-w-full overflow-hidden bg-white">
      
      {/* --- Header Area --- */}
      <div className="flex-none px-4 py-4 border-b border-gray-200 bg-white shadow-sm z-30 relative">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Leads</h1>
              <p className="text-xs text-gray-500">Manage your prospects.</p>
            </div>
            
            <div className="flex items-center gap-2">
              <button onClick={() => setShowBulkModal(true)} className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 sm:px-3 sm:py-2 sm:flex sm:items-center sm:gap-2">
                <Upload className="h-4 w-4" />
                <span className="hidden sm:inline text-xs font-medium">Import</span>
              </button>
              <button onClick={() => { setEditing(null); setShowModal(true); }} className="p-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 sm:px-3 sm:py-2 sm:flex sm:items-center sm:gap-2 shadow-sm">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline text-xs font-medium">Add Lead</span>
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search name, email, company, service..."
                className="block w-full rounded-lg border-0 py-2 pl-9 pr-3 text-gray-900 ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm sm:leading-6 bg-gray-50/50"
              />
            </div>
            
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`relative px-3 py-2 rounded-lg border text-xs font-medium transition-colors flex items-center gap-2
                ${showFilters || selectedCategories.length > 0 || selectedServices.length > 0 
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700" 
                  : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"}`}
            >
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">Filters</span>
              {(selectedCategories.length > 0 || selectedServices.length > 0) && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[10px] text-white">
                  {selectedCategories.length + selectedServices.length}
                </span>
              )}
            </button>
          </div>

          {showFilters && (
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 animate-in slide-in-from-top-2 duration-200">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-sm font-bold text-gray-900">Filter Leads</h3>
                <button onClick={() => { setSelectedCategories([]); setSelectedServices([]); }} className="text-xs text-emerald-600 hover:underline font-medium">
                  Clear All
                </button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">By Sister Concern</h4>
                  <div className="flex flex-wrap gap-2">
                    {allServices.map(s => (
                      <button
                        key={s}
                        onClick={() => toggleFilter(selectedServices, setSelectedServices, s)}
                        className={`px-2.5 py-1 rounded-full text-xs border transition-all ${
                          selectedServices.includes(s) 
                            ? "bg-emerald-600 text-white border-emerald-600 shadow-sm" 
                            : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">By Category</h4>
                  <div className="flex flex-wrap gap-2">
                    {allCategories.map(c => (
                      <button
                        key={c}
                        onClick={() => toggleFilter(selectedCategories, setSelectedCategories, c)}
                        className={`px-2.5 py-1 rounded-full text-xs border transition-all ${
                          selectedCategories.includes(c) 
                            ? "bg-blue-600 text-white border-blue-600 shadow-sm" 
                            : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* --- Table Area --- */}
      <div className="flex-1 overflow-auto relative w-full">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-30 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-emerald-600 font-medium text-sm animate-pulse">
              <Loader2 className="h-5 w-5 animate-spin" /> Loading...
            </div>
          </div>
        )}

        <TableLead 
          data={filtered}
          onEdit={(lead) => { setEditing(lead); setShowModal(true); }}
          onDeleted={load}
        />
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