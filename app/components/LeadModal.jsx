"use client";

import { useState, useEffect, useRef } from "react";
import { 
  X, User, Mail, Phone, Building2, AlertCircle, Loader2, 
  Calendar as CalendarIcon, MapPin, Link as LinkIcon, Tag, 
  Briefcase, Layers, Plus, Trash2, ChevronLeft, ChevronRight 
} from "lucide-react";
import SearchableSelect from "./SearchableSelect";
import { motion, AnimatePresence } from "framer-motion";

// --- Custom Date Picker Component ---
const CustomDatePicker = ({ label, value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(value ? new Date(value) : new Date());
  const pickerRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const handleDateClick = (day) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    // Adjust for timezone offset to keep date string correct
    const offsetDate = new Date(newDate.getTime() - (newDate.getTimezoneOffset() * 60000));
    onChange(offsetDate.toISOString().split('T')[0]);
    setIsOpen(false);
  };

  const changeMonth = (offset) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const displayValue = value ? new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : "Select Date";

  return (
    <div className="relative w-full" ref={pickerRef}>
      {label && <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-0.5">{label}</label>}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center bg-white border rounded-lg py-2.5 pl-3 pr-4 text-left transition-all duration-200 ${isOpen ? 'border-emerald-500 ring-2 ring-emerald-500/10' : 'border-slate-200 hover:border-slate-300'}`}
      >
        <CalendarIcon className={`h-4 w-4 mr-2 ${isOpen ? 'text-emerald-500' : 'text-slate-400'}`} />
        <span className={`text-sm ${!value ? 'text-slate-400' : 'text-slate-700 font-medium'}`}>{displayValue}</span>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 p-4 bg-white rounded-xl shadow-xl border border-slate-100 w-[280px] animate-in fade-in zoom-in-95 duration-100">
          <div className="flex justify-between items-center mb-4">
            <button type="button" onClick={() => changeMonth(-1)} className="p-1 hover:bg-slate-100 rounded-full"><ChevronLeft className="h-4 w-4 text-slate-500" /></button>
            <span className="text-sm font-bold text-slate-700">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
            <button type="button" onClick={() => changeMonth(1)} className="p-1 hover:bg-slate-100 rounded-full"><ChevronRight className="h-4 w-4 text-slate-500" /></button>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {days.map(d => <div key={d} className="text-center text-[10px] font-bold text-slate-400 uppercase">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array(firstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth())).fill(null).map((_, i) => <div key={`empty-${i}`} />)}
            {Array(daysInMonth(currentDate.getFullYear(), currentDate.getMonth())).fill(null).map((_, i) => {
              const day = i + 1;
              const isSelected = value && new Date(value).getDate() === day && new Date(value).getMonth() === currentDate.getMonth() && new Date(value).getFullYear() === currentDate.getFullYear();
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleDateClick(day)}
                  className={`h-8 w-8 rounded-full text-xs font-medium transition-colors flex items-center justify-center
                    ${isSelected ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-700 hover:bg-slate-100'}
                  `}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// --- Standard Input Field ---
const InputField = ({ icon: Icon, label, error, ...props }) => (
  <div className="w-full">
    {label && <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-0.5">{label}</label>}
    <div className="relative group">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Icon className={`h-4 w-4 transition-colors ${error ? "text-red-400" : "text-gray-400 group-focus-within:text-emerald-500"}`} />
      </div>
      <input
        {...props}
        className={`block w-full pl-9 pr-3 py-2.5 bg-white border rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 transition-all duration-200
          ${error 
            ? "border-red-300 focus:ring-red-200 focus:border-red-500" 
            : "border-slate-200 focus:ring-emerald-500/10 focus:border-emerald-500 hover:border-slate-300"
          }
        `}
      />
    </div>
    {error && <p className="mt-1.5 ml-1 text-xs text-red-500 font-medium">{error}</p>}
  </div>
);

export default function LeadModal({ lead, onClose, onSaved }) {
  // Default to today if no date provided
  const todayStr = new Date().toISOString().split('T')[0];
  const dateVal = (d) => d ? new Date(d).toISOString().split('T')[0] : "";

  const [form, setForm] = useState({
    name: lead?.name || "",
    designation: lead?.designation || "",
    phone: lead?.phone || "",
    alternativePhone: lead?.alternativePhone || "",
    email: lead?.email || "",
    company: lead?.company || "",
    location: lead?.location || "",
    
    // Dropdowns
    status: lead?.status || "New Lead",
    source: lead?.source || "",
    platform: lead?.platform || "",
    reference: lead?.reference || "",
    category: lead?.category || "",
    service: lead?.service || "", 
    
    // Dates
    date: dateVal(lead?.date) || todayStr,
    sendingDate: dateVal(lead?.sendingDate),
    followupDate: dateVal(lead?.followupDate),
    
    note: lead?.note || "",
    links: lead?.links?.length ? lead.links : [""], // Ensure at least one empty input
    priority: lead?.priority || "Normal",
  });

  const [saving, setSaving] = useState(false);
  const [generalError, setGeneralError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  
  // Attribute Options
  const [attributes, setAttributes] = useState({
    services: [],
    categories: [],
    sources: [],
    platforms: [],
    references: []
  });

  useEffect(() => {
    fetch("/api/leads/attributes")
      .then(res => res.json())
      .then(data => {
        setAttributes({
          services: data.services || [],
          categories: data.categories || [],
          sources: data.sources || [],
          platforms: data.platforms || [],
          references: data.references || []
        });
      })
      .catch(err => console.error("Failed to load attributes", err));
  }, []);

  const handleAttribute = async (action, type, name) => {
    try {
      const url = `/api/leads/attributes${action === 'DELETE' ? `?type=${type}&name=${encodeURIComponent(name)}` : ''}`;
      const opts = { method: action === 'ADD' ? 'POST' : 'DELETE', headers: { "Content-Type": "application/json" } };
      if (action === 'ADD') opts.body = JSON.stringify({ type, name });
      
      await fetch(url, opts);
      
      // Update local state
      const keyMap = { service: 'services', category: 'categories', source: 'sources', platform: 'platforms', reference: 'references' };
      const key = keyMap[type];
      
      if (action === 'ADD') {
        setAttributes(prev => ({ ...prev, [key]: [...prev[key], name].sort() }));
        setForm(prev => ({ ...prev, [type]: name }));
      } else {
        setAttributes(prev => ({ ...prev, [key]: prev[key].filter(i => i !== name) }));
        if (form[type] === name) setForm(prev => ({ ...prev, [type]: "" }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLinkChange = (index, value) => {
    const newLinks = [...form.links];
    newLinks[index] = value;
    setForm({ ...form, links: newLinks });
  };

  const addLink = () => setForm({ ...form, links: [...form.links, ""] });
  
  const removeLink = (index) => {
    const newLinks = form.links.filter((_, i) => i !== index);
    setForm({ ...form, links: newLinks.length ? newLinks : [""] });
  };

  const validateForm = () => {
    const errors = {};
    let isValid = true;
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = "Invalid format";
      isValid = false;
    }
    if (form.phone && form.phone.length < 6) {
      errors.phone = "Too short";
      isValid = false;
    }
    setFieldErrors(errors);
    return isValid;
  };

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validateForm()) {
      setGeneralError("Please check the fields marked in red.");
      return;
    }
    setSaving(true);
    setGeneralError("");
    
    // Filter empty links
    const cleanForm = {
      ...form,
      links: form.links.filter(l => l.trim() !== "")
    };

    try {
      const method = lead ? "PATCH" : "POST";
      const url = lead ? `/api/leads/${lead._id}` : `/api/leads`;
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleanForm),
      });
      if (!res.ok) throw new Error("Failed to save lead");
      onSaved();
    } catch (e) {
      setGeneralError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] sm:p-4 flex items-center justify-center font-sans">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
      />

      <motion.div 
        initial={{ y: "100%", opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: "100%", opacity: 0, scale: 0.95 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative w-full h-full sm:h-auto sm:max-h-[95vh] sm:max-w-5xl bg-white sm:rounded-xl shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-white z-10">
          <div>
            <h3 className="text-lg font-bold text-slate-900">{lead ? "Edit Lead" : "New Lead"}</h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Manage prospect details</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto bg-[#F8F9FC] custom-scrollbar">
          <form id="leadForm" onSubmit={handleSubmit} className="p-6 space-y-8">
            
            <AnimatePresence>
              {generalError && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-3 border border-red-100 mb-4">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  {generalError}
                </motion.div>
              )}
            </AnimatePresence>

            {/* 1. Identity & Contact */}
            <section className="bg-white p-6 rounded-xl border border-slate-200/60 shadow-sm">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <User className="h-4 w-4" /> Identity & Contact
              </h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <InputField icon={User} label="Full Name *" placeholder="e.g. John Doe" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                <InputField icon={Briefcase} label="Designation" placeholder="e.g. CEO" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} />
                <InputField icon={Building2} label="Company" placeholder="Company Name" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
                <InputField icon={MapPin} label="Location" placeholder="City, Country" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
                
                <InputField icon={Phone} label="Primary Phone" placeholder="+880 1..." value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} error={fieldErrors.phone} type="tel" />
                <InputField icon={Phone} label="Alt Phone" placeholder="Optional" value={form.alternativePhone} onChange={(e) => setForm({ ...form, alternativePhone: e.target.value })} type="tel" />
                <InputField icon={Mail} label="Email Address" placeholder="name@email.com" value={form.email} onChange={(e) => { setForm({ ...form, email: e.target.value }); setFieldErrors({...fieldErrors, email: null}); }} error={fieldErrors.email} type="email" />
              </div>

              {/* Multiple Links */}
              <div className="mt-6">
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 ml-0.5">Social & Web Links</label>
                <div className="space-y-2">
                  {form.links.map((link, idx) => (
                    <div key={idx} className="flex gap-2">
                      <div className="relative flex-1 group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <LinkIcon className="h-4 w-4 text-slate-400" />
                        </div>
                        <input
                          type="text"
                          value={link}
                          onChange={(e) => handleLinkChange(idx, e.target.value)}
                          placeholder="https://..."
                          className="block w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                        />
                      </div>
                      {idx === form.links.length - 1 ? (
                        <button type="button" onClick={addLink} className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors">
                          <Plus className="h-4 w-4" />
                        </button>
                      ) : (
                        <button type="button" onClick={() => removeLink(idx)} className="p-2.5 rounded-lg bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* 2. Deal Intelligence (Dynamic Dropdowns) */}
            <section className="bg-white p-6 rounded-xl border border-slate-200/60 shadow-sm">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <Briefcase className="h-4 w-4" /> Deal Context
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <SearchableSelect 
                  label="Sister Concern (Service)" icon={Briefcase} value={form.service}
                  onChange={(val) => setForm({ ...form, service: val })}
                  options={attributes.services}
                  onAddNew={(name) => handleAttribute('ADD', 'service', name)}
                  onDelete={(name) => handleAttribute('DELETE', 'service', name)}
                  placeholder="Select Service..."
                />
                <SearchableSelect 
                  label="Category" icon={Layers} value={form.category}
                  onChange={(val) => setForm({ ...form, category: val })}
                  options={attributes.categories}
                  onAddNew={(name) => handleAttribute('ADD', 'category', name)}
                  onDelete={(name) => handleAttribute('DELETE', 'category', name)} 
                  placeholder="Select Category..."
                />
                <SearchableSelect 
                  label="Source" icon={Tag} value={form.source}
                  onChange={(val) => setForm({ ...form, source: val })}
                  options={attributes.sources}
                  onAddNew={(name) => handleAttribute('ADD', 'source', name)}
                  onDelete={(name) => handleAttribute('DELETE', 'source', name)} 
                  placeholder="Select Source..."
                />
                <SearchableSelect 
                  label="Platform" icon={Tag} value={form.platform}
                  onChange={(val) => setForm({ ...form, platform: val })}
                  options={attributes.platforms}
                  onAddNew={(name) => handleAttribute('ADD', 'platform', name)}
                  onDelete={(name) => handleAttribute('DELETE', 'platform', name)} 
                  placeholder="Select Platform..."
                />
                <SearchableSelect 
                  label="Reference" icon={Tag} value={form.reference}
                  onChange={(val) => setForm({ ...form, reference: val })}
                  options={attributes.references}
                  onAddNew={(name) => handleAttribute('ADD', 'reference', name)}
                  onDelete={(name) => handleAttribute('DELETE', 'reference', name)} 
                  placeholder="Select Reference..."
                />
              </div>
            </section>

            {/* 3. Timeline & Status */}
            <section className="bg-white p-6 rounded-xl border border-slate-200/60 shadow-sm">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" /> Timeline & Status
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <CustomDatePicker label="Lead Date" value={form.date} onChange={(val) => setForm({ ...form, date: val })} />
                <CustomDatePicker label="Sending Date" value={form.sendingDate} onChange={(val) => setForm({ ...form, sendingDate: val })} />
                <CustomDatePicker label="Follow Up" value={form.followupDate} onChange={(val) => setForm({ ...form, followupDate: val })} />
                
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-0.5">Status</label>
                  <div className="relative">
                    <select
                      className="block w-full py-2.5 px-3 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all cursor-pointer appearance-none font-medium text-slate-700"
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                    >
                      {["New Lead", "Contacted", "Qualified", "Proposal Sent", "Negotiation", "Closed - Won", "Closed - Lost", "Follow-Up"].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    {/* Custom Arrow */}
                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 4. Notes */}
            <section className="bg-white p-6 rounded-xl border border-slate-200/60 shadow-sm">
               <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 ml-0.5">General Notes</label>
               <textarea
                 rows={3}
                 className="block w-full p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none resize-y min-h-[100px] transition-all"
                 placeholder="Write any additional details about this lead here..."
                 value={form.note}
                 onChange={(e) => setForm({ ...form, note: e.target.value })}
               />
            </section>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-white border-t border-slate-100 flex justify-end gap-3 z-10">
          <button 
            onClick={onClose} 
            disabled={saving} 
            className="px-5 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-all"
          >
            Cancel
          </button>
          <button 
            form="leadForm" 
            type="submit" 
            disabled={saving} 
            className="inline-flex items-center px-6 py-2 rounded-lg bg-[#10a37f] hover:bg-[#0d8a6a] text-sm font-medium text-white shadow-sm shadow-emerald-500/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {saving ? <><Loader2 className="animate-spin mr-2 h-4 w-4" />Saving...</> : "Save Lead"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}