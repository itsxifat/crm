"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { 
  X, Save, Building2, Mail, Phone, Globe, Calendar, 
  MapPin, User, Trash2, Plus, Link as LinkIcon, 
  Briefcase, ImagePlus, Loader2
} from "lucide-react";
import { useRouter } from "next/navigation";

/* --- UI: Modern Input Component --- */
function Input({ label, icon: Icon, className = "", ...props }) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">{label}</label>}
      <div className="relative group transition-all duration-200 focus-within:-translate-y-0.5">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-600 transition-colors">
            <Icon className="h-4 w-4" />
          </div>
        )}
        <input
          className={`
            block w-full rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-sm 
            placeholder:text-slate-400 
            focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 
            hover:border-slate-300 hover:bg-white
            transition-all duration-200 ease-out shadow-sm
            ${Icon ? "pl-10" : "pl-4"} py-2.5
          `}
          {...props}
        />
      </div>
    </div>
  );
}

/* --- UI: Modern Select Component --- */
function Select({ label, children, ...props }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">{label}</label>
      <div className="relative group transition-all duration-200 focus-within:-translate-y-0.5">
        <select
          className="appearance-none block w-full rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-sm focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 hover:border-slate-300 hover:bg-white transition-all duration-200 ease-out shadow-sm pl-4 pr-10 py-2.5 cursor-pointer"
          {...props}
        >
          {children}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-400 group-hover:text-slate-600 transition-colors">
          <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
        </div>
      </div>
    </div>
  );
}

/* --- UI: Section Header --- */
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

export default function ClientEditModal({ open, onClose, client }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // State
  const [links, setLinks] = useState(client.links?.length > 0 ? client.links : [""]);
  const [logoPreview, setLogoPreview] = useState(client.logo || null);

  // Fix: Use Portal to attach to body
  useEffect(() => setMounted(true), []);

  // Reset state when modal opens
  useEffect(() => {
    if (open && client) {
      setLinks(client.links?.length > 0 ? client.links : [""]);
      setLogoPreview(client.logo || null);
    }
  }, [open, client]);

  // Handlers
  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) setLogoPreview(URL.createObjectURL(file));
  };

  const handleLinkChange = (index, value) => {
    const newLinks = [...links];
    newLinks[index] = value;
    setLinks(newLinks);
  };
  const addLink = () => setLinks([...links, ""]);
  const removeLink = (index) => setLinks(links.filter((_, i) => i !== index));

  async function onSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData(e.currentTarget);
      const validLinks = links.filter(l => l.trim() !== "");
      fd.set("links", JSON.stringify(validLinks));

      const res = await fetch(`/api/clients/${encodeURIComponent(client._id)}`, { method: "PATCH", body: fd });
      const json = await res.json().catch(() => ({}));
      
      if (!res.ok) throw new Error(json?.error || "Update failed");
      
      router.refresh();
      onClose?.();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  // Prevent hydration mismatch and ensure portal target exists
  if (!mounted || !open) return null;

  // --- PORTAL RENDERING FIX ---
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 font-sans">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in" 
        onClick={onClose} 
      />

      {/* Modal Card */}
      <div 
        className="relative flex flex-col w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-[0_20px_60px_-10px_rgba(0,0,0,0.3)] overflow-hidden animate-in zoom-in-95 fade-in duration-200 border border-slate-100"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex-none flex items-center justify-between px-8 py-5 border-b border-slate-100 bg-white/80 backdrop-blur-md z-20">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3">
              Edit Client Profile
              <span className="px-2.5 py-1 rounded-full bg-slate-100 text-[10px] text-slate-500 font-mono tracking-wide border border-slate-200">
                #{client._id.slice(-6).toUpperCase()}
              </span>
            </h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 -mr-2 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={onSubmit} className="flex-1 overflow-y-auto custom-scrollbar bg-[#fafbfc]">
          <div className="p-8 space-y-12">

            {/* SECTION 1: Identity */}
            <section className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
              <SectionHeader title="Identity & Branding" icon={Building2} description="Core company details and branding assets." />
              <div className="flex flex-col md:flex-row gap-8">
                
                {/* Logo Uploader */}
                <div className="flex-none flex flex-col items-center gap-3 w-full md:w-auto">
                  <div className="relative group h-36 w-36 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center transition-all hover:border-emerald-400 hover:bg-emerald-50/10 cursor-pointer shadow-sm hover:shadow-md">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-3 transition-transform group-hover:scale-105" />
                    ) : (
                      <div className="text-center p-4">
                        <div className="bg-white p-3 rounded-full shadow-sm mb-2 inline-flex items-center justify-center group-hover:scale-110 transition-transform">
                           <ImagePlus className="h-6 w-6 text-slate-400 group-hover:text-emerald-500" />
                        </div>
                        <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wide group-hover:text-emerald-600">Upload Logo</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/5 transition-colors flex items-center justify-center">
                       {logoPreview && <div className="opacity-0 group-hover:opacity-100 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-bold text-slate-600 shadow-sm transform translate-y-2 group-hover:translate-y-0 transition-all">Change</div>}
                    </div>
                    <input type="file" name="logo" accept="image/*" onChange={handleLogoChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium text-center">SVG, PNG, JPG (Max 2MB)</p>
                </div>

                {/* Fields */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                  <Input label="Company Name" name="companyName" defaultValue={client.companyName} icon={Building2} placeholder="e.g. Acme Corp" />
                  <Input label="Client Name" name="clientName" required defaultValue={client.clientName} icon={User} placeholder="Primary Contact" />
                  <Input label="Designation" name="designation" defaultValue={client.designation} icon={Briefcase} placeholder="e.g. CEO" />
                  <Select label="Priority" name="priority" defaultValue={client.priority || "Normal"}>
                    <option value="High">High Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="Normal">Normal Priority</option>
                  </Select>
                </div>
              </div>
            </section>

            {/* SECTION 2: Contact Info */}
            <section className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
              <SectionHeader title="Contact Information" icon={Phone} description="Primary communication channels." />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                <Input label="Email Address" type="email" name="email" required defaultValue={client.email} icon={Mail} placeholder="name@company.com" />
                <Input label="Primary Phone" name="phone" required defaultValue={client.phone} icon={Phone} placeholder="+1 (555)..." />
                <Input label="Alternative Phone" name="alternativePhone" defaultValue={client.alternativePhone} icon={Phone} placeholder="Optional" />
                <Input label="Joining Date" type="date" name="joiningDate" defaultValue={client.joiningDate ? String(client.joiningDate).slice(0, 10) : ""} icon={Calendar} />
              </div>
            </section>

            {/* SECTION 3: Digital Presence */}
            <section className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
              <SectionHeader title="Digital Presence" icon={Globe} description="Websites and social media links." />
              <div className="space-y-6">
                <Input label="Main Website" name="website" defaultValue={client.website} icon={Globe} placeholder="https://www.example.com" />
                
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1 mb-2.5 block">Social Links</label>
                  <div className="space-y-3">
                    {links.map((link, idx) => (
                      <div key={idx} className="flex gap-3 items-center group">
                        <div className="relative flex-1 transition-all duration-200 focus-within:-translate-y-0.5">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-600 transition-colors">
                            <LinkIcon className="h-4 w-4" />
                          </div>
                          <input
                            type="text"
                            value={link}
                            onChange={(e) => handleLinkChange(idx, e.target.value)}
                            className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 hover:border-slate-300 hover:bg-white transition-all shadow-sm"
                            placeholder="https://linkedin.com/..."
                          />
                        </div>
                        <button
                          type="button"
                          onClick={idx === links.length - 1 ? addLink : () => removeLink(idx)}
                          className={`
                            p-2.5 rounded-xl border transition-all duration-200 shadow-sm active:scale-95
                            ${idx === links.length - 1 
                              ? "bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200 hover:border-slate-300" 
                              : "bg-white border-slate-200 text-rose-500 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600"
                            }
                          `}
                        >
                          {idx === links.length - 1 ? <Plus className="h-5 w-5" /> : <Trash2 className="h-5 w-5" />}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 4: Location */}
            <section className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
              <SectionHeader title="Location" icon={MapPin} description="Physical address details." />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                <Input label="Address Line 1" name="address.line1" defaultValue={client.address?.line1} className="md:col-span-2" placeholder="Street Address" />
                <Input label="Address Line 2" name="address.line2" defaultValue={client.address?.line2} className="md:col-span-2" placeholder="Apt, Suite, Floor (Optional)" />
                <Input label="City" name="address.city" defaultValue={client.address?.city} placeholder="City" />
                <Input label="State/Province" name="address.state" defaultValue={client.address?.state} placeholder="State" />
                <Input label="Postal Code" name="address.postalCode" defaultValue={client.address?.postalCode} placeholder="ZIP Code" />
                <Input label="Country" name="address.country" defaultValue={client.address?.country} placeholder="Country" />
              </div>
            </section>

          </div>

          {/* Footer Actions */}
          <div className="sticky bottom-0 bg-white/90 backdrop-blur-xl px-8 py-5 border-t border-slate-200 flex items-center justify-end gap-3 z-30">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-xl transition-all shadow-sm active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-8 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-[0_4px_14px_0_rgba(16,185,129,0.39)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.23)] hover:-translate-y-0.5 transition-all transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              <span>{saving ? "Saving Changes..." : "Save Changes"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body // Portal Target
  );
}