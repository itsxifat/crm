"use client";

import { useState } from "react";
import { X, Upload, Check, Loader2, Building, User, Phone, Globe, MapPin } from "lucide-react";
import { motion } from "framer-motion";

export default function ConvertToClientModal({ lead, onClose, onSuccess }) {
  const [logo, setLogo] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  // Pre-fill with Lead Data
  const [form, setForm] = useState({
    clientName: lead.name,
    companyName: lead.company,
    designation: lead.designation,
    email: lead.email,
    phone: lead.phone,
    alternativePhone: lead.alternativePhone,
    website: lead.links?.[0] || "", // Use first link as website default
    links: lead.links || [],
    address: { line1: "", city: lead.location || "", country: "" }
  });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogo(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("leadId", lead._id);
      formData.append("clientName", form.clientName);
      formData.append("companyName", form.companyName);
      formData.append("designation", form.designation);
      formData.append("email", form.email);
      formData.append("phone", form.phone);
      formData.append("alternativePhone", form.alternativePhone);
      formData.append("website", form.website);
      formData.append("links", JSON.stringify(form.links));
      formData.append("address", JSON.stringify(form.address));
      
      if (logo) formData.append("logo", logo);

      const res = await fetch("/api/clients/convert", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Conversion failed");
      
      const data = await res.json();
      onSuccess(data.clientId); // Pass ID to redirect
    } catch (error) {
      alert("Error converting lead");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm font-sans">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-[#10a37f] text-white">
          <div>
            <h2 className="text-lg font-bold">Congratulations! 🎉</h2>
            <p className="text-xs text-emerald-100 opacity-90">Convert <span className="font-semibold">{lead.name}</span> into a Client.</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors"><X size={20}/></button>
        </div>

        <div className="overflow-y-auto p-6 space-y-6">
          <form id="convertForm" onSubmit={handleSubmit} className="space-y-6">
            
            {/* Logo Upload */}
            <div className="flex items-center gap-6">
              <div className={`h-20 w-20 rounded-xl border-2 border-dashed flex items-center justify-center bg-slate-50 relative overflow-hidden ${!preview ? 'border-slate-300' : 'border-[#10a37f]'}`}>
                {preview ? (
                  <img src={preview} alt="Logo" className="object-cover h-full w-full" />
                ) : (
                  <Upload className="text-slate-300 h-8 w-8" />
                )}
                <input type="file" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Client Logo</h3>
                <p className="text-xs text-slate-500 mt-1">Upload company logo (PNG, JPG).</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Identity */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Identity</h4>
                <input className="w-full text-sm border p-2 rounded" placeholder="Client Name" value={form.clientName} onChange={e => setForm({...form, clientName: e.target.value})} required />
                <input className="w-full text-sm border p-2 rounded" placeholder="Designation" value={form.designation} onChange={e => setForm({...form, designation: e.target.value})} />
                <input className="w-full text-sm border p-2 rounded" placeholder="Company Name" value={form.companyName} onChange={e => setForm({...form, companyName: e.target.value})} required />
              </div>

              {/* Contact */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Contact</h4>
                <input className="w-full text-sm border p-2 rounded" placeholder="Email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                <input className="w-full text-sm border p-2 rounded" placeholder="Phone" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                <input className="w-full text-sm border p-2 rounded" placeholder="Alt Phone" value={form.alternativePhone} onChange={e => setForm({...form, alternativePhone: e.target.value})} />
              </div>
            </div>

            {/* Address & Web */}
            <div className="space-y-3">
               <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Details</h4>
               <input className="w-full text-sm border p-2 rounded" placeholder="Website URL" value={form.website} onChange={e => setForm({...form, website: e.target.value})} />
               <div className="grid grid-cols-2 gap-4">
                 <input className="w-full text-sm border p-2 rounded" placeholder="City" value={form.address.city} onChange={e => setForm({...form, address: {...form.address, city: e.target.value}})} />
                 <input className="w-full text-sm border p-2 rounded" placeholder="Full Address / Line 1" value={form.address.line1} onChange={e => setForm({...form, address: {...form.address, line1: e.target.value}})} />
               </div>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button onClick={onClose} type="button" className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-white rounded-lg transition">Cancel</button>
          <button 
            form="convertForm" 
            disabled={loading}
            className="px-6 py-2 bg-[#10a37f] hover:bg-[#0e906f] text-white text-sm font-bold rounded-lg shadow-sm flex items-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin h-4 w-4" /> : <Check className="h-4 w-4" />}
            Confirm & Convert
          </button>
        </div>
      </motion.div>
    </div>
  );
}