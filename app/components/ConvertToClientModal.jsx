"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { 
  X, Check, Loader2, Building2, User, Phone, 
  Globe, MapPin, Upload, FileText, ShieldCheck, 
  Briefcase, Plus, Trash2, Link as LinkIcon, ImagePlus
} from "lucide-react";

/* --- UI Helpers (Reused for consistency) --- */
function SectionHeader({ title, icon: Icon, description }) {
  return (
    <div className="flex items-start gap-4 pb-5 border-b border-slate-100 mb-6">
      <div className="p-2.5 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl text-emerald-600 border border-emerald-100/50 shadow-sm">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">{title}</h3>
        <p className="text-xs text-slate-500 mt-0.5 font-medium">{description}</p>
      </div>
    </div>
  );
}

function Input({ label, className = "", ...props }) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">{label}</label>}
      <input
        className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-sm focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 hover:border-slate-300 hover:bg-white transition-all shadow-sm px-4 py-2.5"
        {...props}
      />
    </div>
  );
}

function FileUploadBox({ label, icon: Icon, file, onChange, accept }) {
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (file && file.type.startsWith("image/")) {
      setPreview(URL.createObjectURL(file));
    } else {
      setPreview(null);
    }
  }, [file]);

  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">{label}</label>
      <div className={`relative group h-32 w-full rounded-xl border-2 border-dashed ${file ? 'border-emerald-500/50 bg-emerald-50/30' : 'border-slate-200 bg-slate-50/50'} flex flex-col items-center justify-center text-center transition-all hover:border-emerald-400 hover:bg-emerald-50/10 cursor-pointer overflow-hidden`}>
        <input type="file" onChange={onChange} accept={accept} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
        
        {preview ? (
          <img src={preview} className="h-full w-full object-contain p-2" alt="Preview" />
        ) : file ? (
          <div className="flex flex-col items-center gap-2 p-4">
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-full"><Check className="h-5 w-5" /></div>
            <span className="text-xs font-medium text-emerald-700 truncate max-w-[150px]">{file.name}</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 p-4 text-slate-400 group-hover:text-emerald-600 transition-colors">
            <Icon className="h-6 w-6" />
            <span className="text-[10px] font-bold uppercase">Click to Upload</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ConvertToClientModal({ lead, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Form State
  const [logo, setLogo] = useState(null);
  const [nidFile, setNidFile] = useState(null);
  const [tradeFile, setTradeFile] = useState(null);
  const [links, setLinks] = useState(lead.links?.length ? lead.links : [""]);
  
  // Basic Fields
  const [formData, setFormData] = useState({
    clientName: lead.name || "",
    companyName: lead.company || "",
    designation: lead.designation || "",
    email: lead.email || "",
    phone: lead.phone || "",
    alternativePhone: "",
    website: "",
    priority: "Normal",
    address: { 
      line1: "", line2: "", 
      city: lead.location || "", 
      state: "", postalCode: "", country: "" 
    }
  });

  useEffect(() => setMounted(true), []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData(prev => ({ ...prev, [parent]: { ...prev[parent], [child]: value } }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleLinkChange = (idx, val) => {
    const newLinks = [...links];
    newLinks[idx] = val;
    setLinks(newLinks);
  };

  const addLink = () => setLinks([...links, ""]);
  const removeLink = (idx) => setLinks(links.filter((_, i) => i !== idx));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const fd = new FormData();
      // Lead ID Reference
      fd.append("leadId", lead._id);
      
      // Text Fields
      Object.keys(formData).forEach(key => {
        if (typeof formData[key] === 'object') {
          // Flatten address
          Object.keys(formData[key]).forEach(subKey => {
            fd.append(`${key}.${subKey}`, formData[key][subKey]);
          });
        } else {
          fd.append(key, formData[key]);
        }
      });

      // Files
      if (logo) fd.append("logo", logo);
      if (nidFile) fd.append("nidFile", nidFile);
      if (tradeFile) fd.append("tradeLicenseFile", tradeFile);

      // Links
      const validLinks = links.filter(l => l.trim() !== "");
      fd.append("links", JSON.stringify(validLinks));

      const res = await fetch("/api/clients/convert", { method: "POST", body: fd });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Conversion failed");
      }

      const data = await res.json();
      onSuccess(data.clientId);

    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <div className="relative flex flex-col w-full max-w-5xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-100">
        
        {/* Header */}
        <div className="flex-none px-8 py-5 border-b border-slate-100 bg-emerald-50/50 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <span className="bg-emerald-100 text-emerald-700 p-1.5 rounded-lg"><Check className="h-5 w-5" /></span>
              Convert Lead to Client
            </h2>
            <p className="text-xs text-emerald-600/80 font-medium mt-1 ml-10">
              Transferring data from <span className="font-bold">{lead.name}</span>
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full text-slate-400 hover:bg-white hover:text-slate-700 hover:shadow-sm transition-all">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Scrollable Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar bg-[#fafbfc]">
          <div className="p-8 space-y-10">

            {/* SECTION 1: Essential Info */}
            <section className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
              <SectionHeader title="Identity & Contact" icon={User} description="Primary business details." />
              <div className="flex flex-col md:flex-row gap-8">
                
                {/* Logo Upload (Left Side) */}
                <div className="flex-none w-full md:w-48 space-y-3">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Company Logo</label>
                  <div className="relative group h-48 w-full rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 overflow-hidden flex flex-col items-center justify-center transition-all hover:border-emerald-400 cursor-pointer">
                    {logo ? (
                      <img src={URL.createObjectURL(logo)} className="w-full h-full object-contain p-4" />
                    ) : (
                      <div className="text-center p-4">
                        <ImagePlus className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Upload</span>
                      </div>
                    )}
                    <input type="file" accept="image/*" onChange={(e) => setLogo(e.target.files[0])} className="absolute inset-0 opacity-0 cursor-pointer" />
                  </div>
                </div>

                {/* Form Fields (Right Side) */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Input label="Company Name *" name="companyName" value={formData.companyName} onChange={handleChange} required placeholder="Registered Name" />
                  <Input label="Client Name *" name="clientName" value={formData.clientName} onChange={handleChange} required placeholder="Contact Person" />
                  <Input label="Email Address *" type="email" name="email" value={formData.email} onChange={handleChange} required />
                  <Input label="Phone Number *" name="phone" value={formData.phone} onChange={handleChange} required />
                  <Input label="Designation" name="designation" value={formData.designation} onChange={handleChange} placeholder="e.g. CEO" />
                  
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Priority</label>
                    <select 
                      name="priority" 
                      value={formData.priority} 
                      onChange={handleChange}
                      className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-sm focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 px-4 py-2.5"
                    >
                      <option>Normal</option>
                      <option>High</option>
                      <option>Medium</option>
                    </select>
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 2: KYC & Compliance */}
            <section className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
              <SectionHeader title="KYC Documents" icon={ShieldCheck} description="Upload verifying documents now." />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FileUploadBox 
                  label="National ID (NID)" 
                  icon={FileText} 
                  file={nidFile} 
                  onChange={(e) => setNidFile(e.target.files[0])} 
                />
                <FileUploadBox 
                  label="Trade License" 
                  icon={Briefcase} 
                  file={tradeFile} 
                  onChange={(e) => setTradeFile(e.target.files[0])} 
                />
              </div>
            </section>

            {/* SECTION 3: Extended Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Location */}
              <section className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
                <SectionHeader title="Location" icon={MapPin} description="Billing address." />
                <div className="space-y-4">
                  <Input label="Address Line 1" name="address.line1" value={formData.address.line1} onChange={handleChange} placeholder="Street Address" />
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="City" name="address.city" value={formData.address.city} onChange={handleChange} />
                    <Input label="Country" name="address.country" value={formData.address.country} onChange={handleChange} />
                  </div>
                </div>
              </section>

              {/* Digital Presence */}
              <section className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
                <SectionHeader title="Digital" icon={Globe} description="Web & Social." />
                <div className="space-y-4">
                  <Input label="Website" name="website" value={formData.website} onChange={handleChange} placeholder="https://..." />
                  
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Social Links</label>
                    <div className="space-y-2">
                      {links.map((link, idx) => (
                        <div key={idx} className="flex gap-2">
                          <div className="relative flex-1">
                            <LinkIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                            <input 
                              value={link} 
                              onChange={(e) => handleLinkChange(idx, e.target.value)}
                              className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3 py-2 text-sm focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10"
                              placeholder="URL..." 
                            />
                          </div>
                          <button 
                            type="button" 
                            onClick={idx === links.length - 1 ? addLink : () => removeLink(idx)}
                            className={`p-2 rounded-lg border transition-all ${idx === links.length - 1 ? 'bg-slate-100 text-slate-600' : 'bg-white text-rose-500 border-rose-100 hover:bg-rose-50'}`}
                          >
                            {idx === links.length - 1 ? <Plus className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            </div>

          </div>

          {/* Footer Actions */}
          <div className="sticky bottom-0 bg-white/90 backdrop-blur-xl px-8 py-5 border-t border-slate-200 flex items-center justify-end gap-3 z-30">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-8 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              <span>Confirm Conversion</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}