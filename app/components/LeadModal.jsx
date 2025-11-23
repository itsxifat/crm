"use client";

import { useState, useEffect } from "react";
import { X, User, Mail, Phone, Building2, AlertCircle, Loader2, Calendar, MapPin, Link as LinkIcon, Tag, Briefcase, Layers } from "lucide-react";
import SearchableSelect from "./SearchableSelect";

// --- Helper Component (Defined OUTSIDE to prevent focus loss) ---
const InputField = ({ icon: Icon, label, error, ...props }) => (
  <div className="w-full">
    {label && <label className="block text-xs font-medium text-gray-700 mb-1 ml-1">{label}</label>}
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Icon className={`h-4 w-4 ${error ? "text-red-400" : "text-gray-400"}`} />
      </div>
      <input
        {...props}
        className={`block w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 transition-all
          ${error 
            ? "border-red-300 focus:ring-red-200 focus:border-red-500" 
            : "border-gray-300 focus:ring-emerald-500 focus:border-emerald-500"
          }
        `}
      />
    </div>
    {error && <p className="mt-1 ml-1 text-xs text-red-500">{error}</p>}
  </div>
);

export default function LeadModal({ lead, onClose, onSaved }) {
  const dateVal = (d) => d ? new Date(d).toISOString().split('T')[0] : "";

  const [form, setForm] = useState({
    name: lead?.name || "",
    phone: lead?.phone || "",
    email: lead?.email || "",
    company: lead?.company || "",
    status: lead?.status || "New Lead",
    
    // Details
    source: lead?.source || "",
    date: dateVal(lead?.date),
    sendingDate: dateVal(lead?.sendingDate),
    note: lead?.note || "",
    reference: lead?.reference || "",
    category: lead?.category || "",
    service: lead?.service || "", 
    fbPageLink: lead?.fbPageLink || "",
    platform: lead?.platform || "",
    followupDate: dateVal(lead?.followupDate),
    location: lead?.location || "",
    priority: lead?.priority || "Normal",
  });

  const [saving, setSaving] = useState(false);
  const [generalError, setGeneralError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({}); // Track errors for specific fields
  
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetch("/api/leads/attributes")
      .then(res => res.json())
      .then(data => {
        if (data.services) setServices(data.services);
        if (data.categories) setCategories(data.categories);
      })
      .catch(err => console.error("Failed to load attributes", err));
  }, []);

  const handleAddNewAttribute = async (type, name) => {
    try {
      await fetch("/api/leads/attributes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, name }),
      });
      
      if (type === 'service') {
        setServices(prev => [...prev, name].sort());
        setForm(prev => ({ ...prev, service: name }));
      }
      if (type === 'category') {
        setCategories(prev => [...prev, name].sort());
        setForm(prev => ({ ...prev, category: name }));
      }
    } catch (e) {
      console.error("Failed to add attribute", e);
    }
  };

  const handleDeleteAttribute = async (type, name) => {
    try {
      const res = await fetch(`/api/leads/attributes?type=${encodeURIComponent(type)}&name=${encodeURIComponent(name)}`, {
        method: "DELETE",
      });
      
      if (!res.ok) throw new Error("Failed to delete");

      if (type === 'service') {
        setServices(prev => prev.filter(i => i !== name));
        if (form.service === name) setForm(prev => ({ ...prev, service: "" }));
      }
      if (type === 'category') {
        setCategories(prev => prev.filter(i => i !== name));
        if (form.category === name) setForm(prev => ({ ...prev, category: "" }));
      }
    } catch (e) {
      console.error("Failed to delete attribute", e);
      alert("Could not delete item. Please try again.");
    }
  };

  // --- VALIDATION LOGIC ---
  const handlePhoneChange = (e) => {
    const value = e.target.value;
    // Only allow numbers, +, -, (, ), and spaces
    if (/^[0-9+\-()\s]*$/.test(value)) {
      setForm({ ...form, phone: value });
      if (fieldErrors.phone) setFieldErrors({ ...fieldErrors, phone: null });
    }
  };

  const validateForm = () => {
    const errors = {};
    let isValid = true;

    // Email Validation
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = "Invalid email format";
      isValid = false;
    }

    // Basic Phone Check (optional length check)
    if (form.phone && form.phone.length < 6) {
      errors.phone = "Phone number too short";
      isValid = false;
    }

    setFieldErrors(errors);
    return isValid;
  };

  async function handleSubmit(e) {
    e.preventDefault();
    
    if (!validateForm()) {
      setGeneralError("Please fix the errors below.");
      return;
    }

    setSaving(true);
    setGeneralError("");
    
    try {
      const method = lead ? "PATCH" : "POST";
      const url = lead ? `/api/leads/${lead._id}` : `/api/leads`;
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
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
    // Responsive Overlay: Uses 'items-end sm:items-center' to slide up on mobile or center on desktop
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4">
      
      {/* Modal Container: Full width on mobile, max-w-4xl on desktop */}
      <div className="relative w-full sm:max-w-4xl bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[95vh] sm:max-h-[90vh]">
        
        {/* Header (Sticky) */}
        <div className="flex justify-between items-center px-4 sm:px-6 py-4 border-b border-gray-100 flex-shrink-0 bg-white rounded-t-2xl">
          <h3 className="text-lg font-semibold text-gray-900">
            {lead ? "Edit Lead Details" : "Add New Lead"}
          </h3>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <form id="leadForm" onSubmit={handleSubmit} className="space-y-6">
            {generalError && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2 animate-pulse">
                <AlertCircle className="h-4 w-4" />
                {generalError}
              </div>
            )}

            {/* 1. Contact Info */}
            <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Contact Information</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <InputField 
                  icon={User} 
                  label="Full Name *" 
                  placeholder="e.g. Jane Doe" 
                  value={form.name} 
                  onChange={(e) => setForm({ ...form, name: e.target.value })} 
                  required 
                />
                <InputField 
                  icon={Phone} 
                  label="Phone" 
                  placeholder="+880 1700..." 
                  value={form.phone} 
                  onChange={handlePhoneChange} // Uses custom handler
                  error={fieldErrors.phone}
                  type="tel"
                />
                <InputField 
                  icon={Mail} 
                  label="Email" 
                  placeholder="jane@company.com" 
                  value={form.email} 
                  onChange={(e) => {
                    setForm({ ...form, email: e.target.value });
                    if(fieldErrors.email) setFieldErrors({...fieldErrors, email: null});
                  }} 
                  error={fieldErrors.email}
                  type="email"
                />
                <InputField icon={Building2} label="Company" placeholder="Company Name" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
                <InputField icon={MapPin} label="Location" placeholder="e.g. Dhaka, BD" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
                <InputField icon={LinkIcon} label="FB Page Link" placeholder="https://facebook.com/..." value={form.fbPageLink} onChange={(e) => setForm({ ...form, fbPageLink: e.target.value })} />
              </div>
            </div>

            {/* 2. Lead Details */}
            <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Lead Details</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <InputField 
                  icon={Tag} 
                  label="Source" 
                  placeholder="e.g. Paid Ad, Personal Network" 
                  value={form.source} 
                  onChange={(e) => setForm({ ...form, source: e.target.value })} 
                />
                <InputField 
                  icon={Tag} 
                  label="Platform" 
                  placeholder="e.g. Facebook, LinkedIn" 
                  value={form.platform} 
                  onChange={(e) => setForm({ ...form, platform: e.target.value })} 
                />
                <InputField icon={Tag} label="Reference" placeholder="Reference ID/Name" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} />
                
                <SearchableSelect 
                  label="Category"
                  icon={Layers}
                  value={form.category}
                  onChange={(val) => setForm({ ...form, category: val })}
                  options={categories}
                  onAddNew={(name) => handleAddNewAttribute('category', name)}
                  onDelete={(name) => handleDeleteAttribute('category', name)} 
                  placeholder="Select Category..."
                />
                
                <SearchableSelect 
                  label="Sister Concern (Service)"
                  icon={Briefcase}
                  value={form.service}
                  onChange={(val) => setForm({ ...form, service: val })}
                  options={services}
                  onAddNew={(name) => handleAddNewAttribute('service', name)}
                  onDelete={(name) => handleDeleteAttribute('service', name)}
                  placeholder="Select Service..."
                />
              </div>
            </div>

            {/* 3. Schedule & Status */}
            <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Schedule & Status</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <InputField icon={Calendar} type="date" label="Lead Date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                <InputField icon={Calendar} type="date" label="Sending Date" value={form.sendingDate} onChange={(e) => setForm({ ...form, sendingDate: e.target.value })} />
                <InputField icon={Calendar} type="date" label="Follow Up Date" value={form.followupDate} onChange={(e) => setForm({ ...form, followupDate: e.target.value })} />
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1 ml-1">Status</label>
                  <select
                    className="block w-full py-2.5 px-3 border border-gray-300 bg-white rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                  >
                    <option>New Lead</option>
                    <option>Not Converted</option>
                    <option>Converted</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 4. Notes */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1 ml-1">General Note</label>
              <textarea
                rows={3}
                className="block w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-y min-h-[80px]"
                placeholder="Add any general notes here..."
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
              />
            </div>

          </form>
        </div>

        {/* Footer (Sticky) */}
        <div className="px-4 sm:px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-none sm:rounded-b-2xl flex justify-end gap-3 flex-shrink-0">
          <button 
            onClick={onClose} 
            disabled={saving} 
            className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button 
            form="leadForm" 
            type="submit" 
            disabled={saving} 
            className="inline-flex items-center px-6 py-2 rounded-lg bg-emerald-600 text-sm font-medium text-white hover:bg-emerald-700 transition-all disabled:opacity-70 shadow-sm"
          >
            {saving ? <><Loader2 className="animate-spin mr-2 h-4 w-4" />Saving...</> : "Save Lead"}
          </button>
        </div>
      </div>
    </div>
  );
}