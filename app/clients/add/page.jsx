"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { ArrowLeft, Loader2, Plus, Trash2, Link as LinkIcon, Upload, X } from "lucide-react";

// --- Helpers ---
function filePreviewURL(file) {
  if (!file || typeof file === "string") return null;
  try { return URL.createObjectURL(file); } catch { return null; }
}
function isImage(mime = "") { return /^image\//.test(mime); }
function isPDF(mime = "", name = "") { return mime === "application/pdf" || /\.pdf$/i.test(name || ""); }

export default function AddClientPage() {
  const [loading, setLoading] = useState(false);
  
  // Local File State
  const [nidLocal, setNidLocal] = useState(null);
  const [tradeLocal, setTradeLocal] = useState(null);
  const [logoLocal, setLogoLocal] = useState(null); // New Logo Field

  // Dynamic Links State
  const [links, setLinks] = useState([""]);

  const nidPreview = useMemo(() => filePreviewURL(nidLocal), [nidLocal]);
  const tradePreview = useMemo(() => filePreviewURL(tradeLocal), [tradeLocal]);
  const logoPreview = useMemo(() => filePreviewURL(logoLocal), [logoLocal]);

  // Handle Links
  const handleLinkChange = (index, value) => {
    const newLinks = [...links];
    newLinks[index] = value;
    setLinks(newLinks);
  };
  const addLink = () => setLinks([...links, ""]);
  const removeLink = (index) => setLinks(links.filter((_, i) => i !== index));

  async function handleSubmit(e) {
    e.preventDefault();
    const formEl = e.currentTarget;
    const fd = new FormData(formEl);

    // Map Address Fields
    const line1 = fd.get("addressLine1") || "";
    const line2 = fd.get("addressLine2") || "";
    const city = fd.get("city") || "";
    const state = fd.get("state") || "";
    const postalCode = fd.get("postalCode") || "";
    const country = fd.get("country") || "";

    // Remove flat keys
    ["addressLine1", "addressLine2", "city", "state", "postalCode", "country"].forEach(k => fd.delete(k));

    // Set nested address keys for API
    fd.set("address.line1", String(line1));
    if (line2) fd.set("address.line2", String(line2));
    if (city) fd.set("address.city", String(city));
    if (state) fd.set("address.state", String(state));
    if (postalCode) fd.set("address.postalCode", String(postalCode));
    if (country) fd.set("address.country", String(country));

    // Handle File Objects
    if (nidLocal instanceof File) fd.set("nidFile", nidLocal);
    if (tradeLocal instanceof File) fd.set("tradeLicenseFile", tradeLocal);
    if (logoLocal instanceof File) fd.set("logo", logoLocal);

    // Handle Links Array
    const validLinks = links.filter(l => l.trim() !== "");
    fd.set("links", JSON.stringify(validLinks));

    try {
      if (!fd.get("clientName") || !fd.get("email") || !fd.get("phone")) {
        throw new Error("Client Name, Email, and Phone are required.");
      }

      setLoading(true);
      const res = await fetch("/api/clients/add", { method: "POST", body: fd });
      const json = await res.json().catch(() => ({}));
      
      if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`);

      toast.success("Client added successfully!");
      
      // Reset Form
      formEl.reset();
      setLinks([""]);
      setNidLocal(null);
      setTradeLocal(null);
      setLogoLocal(null);
      
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to add client");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-[#f9fafb] min-h-screen font-sans text-slate-900 selection:bg-[#10a37f]/10 selection:text-[#10a37f]">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link href="/clients" className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 uppercase tracking-wide transition-colors mb-2">
              <ArrowLeft className="h-4 w-4" /> Back to Directory
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">New Client Onboarding</h1>
            <p className="mt-1 text-sm text-slate-500">Create a profile for a new business partner.</p>
          </div>
        </div>

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Identity & Contact */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* 1. Identity Card */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                <h3 className="text-sm font-bold text-slate-900">Identity & Branding</h3>
              </div>
              <div className="p-6 space-y-6">
                
                {/* Logo Upload */}
                <div className="flex items-center gap-6">
                  <div className={`h-24 w-24 rounded-xl border-2 border-dashed flex items-center justify-center bg-slate-50 relative overflow-hidden transition-all ${!logoPreview ? 'border-slate-300 hover:border-slate-400' : 'border-[#10a37f] bg-white'}`}>
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo" className="object-contain h-full w-full p-2" />
                    ) : (
                      <div className="text-center p-2">
                        <Upload className="mx-auto h-6 w-6 text-slate-400 mb-1" />
                        <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Logo</span>
                      </div>
                    )}
                    <input type="file" name="logo" onChange={(e) => setLogoLocal(e.target.files?.[0])} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
                    {logoPreview && (
                      <button type="button" onClick={(e) => { e.preventDefault(); setLogoLocal(null); }} className="absolute top-1 right-1 p-1 bg-white rounded-full shadow-sm text-red-500 hover:bg-red-50 z-10">
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Company Name <span className="text-red-500">*</span></label>
                    <input type="text" name="companyName" placeholder="e.g. Acme Corp" required className="block w-full rounded-lg border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-[#10a37f] focus:ring-[#10a37f] transition-all" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Contact Person <span className="text-red-500">*</span></label>
                    <input type="text" name="clientName" placeholder="Full Name" required className="block w-full rounded-lg border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-[#10a37f] focus:ring-[#10a37f]" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Designation</label>
                    <input type="text" name="designation" placeholder="e.g. CEO" className="block w-full rounded-lg border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-[#10a37f] focus:ring-[#10a37f]" />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Contact Details */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                <h3 className="text-sm font-bold text-slate-900">Contact Information</h3>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Email <span className="text-red-500">*</span></label>
                  <input type="email" name="email" placeholder="name@company.com" required className="block w-full rounded-lg border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-[#10a37f] focus:ring-[#10a37f]" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Primary Phone <span className="text-red-500">*</span></label>
                  <input type="tel" name="phone" placeholder="+880 1..." required className="block w-full rounded-lg border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-[#10a37f] focus:ring-[#10a37f]" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Alternative Phone</label>
                  <input type="tel" name="alternativePhone" placeholder="Optional" className="block w-full rounded-lg border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-[#10a37f] focus:ring-[#10a37f]" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Priority</label>
                  <select name="priority" className="block w-full rounded-lg border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-[#10a37f] focus:ring-[#10a37f]">
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 3. Address */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                <h3 className="text-sm font-bold text-slate-900">Location</h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <input type="text" name="addressLine1" placeholder="Address Line 1 *" required className="col-span-2 block w-full rounded-lg border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-[#10a37f] focus:ring-[#10a37f]" />
                   <input type="text" name="addressLine2" placeholder="Address Line 2 (Optional)" className="col-span-2 block w-full rounded-lg border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-[#10a37f] focus:ring-[#10a37f]" />
                   <input type="text" name="city" placeholder="City" className="block w-full rounded-lg border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-[#10a37f] focus:ring-[#10a37f]" />
                   <input type="text" name="state" placeholder="State/Division" className="block w-full rounded-lg border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-[#10a37f] focus:ring-[#10a37f]" />
                   <input type="text" name="postalCode" placeholder="Postal Code" className="block w-full rounded-lg border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-[#10a37f] focus:ring-[#10a37f]" />
                   <input type="text" name="country" placeholder="Country" defaultValue="Bangladesh" className="block w-full rounded-lg border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-[#10a37f] focus:ring-[#10a37f]" />
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Web & Documents */}
          <div className="space-y-8">
            
            {/* 4. Digital Presence */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                <h3 className="text-sm font-bold text-slate-900">Digital Presence</h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Main Website</label>
                  <input type="url" name="website" placeholder="https://..." className="block w-full rounded-lg border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-[#10a37f] focus:ring-[#10a37f]" />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Social Links</label>
                  <div className="space-y-2">
                    {links.map((link, idx) => (
                      <div key={idx} className="flex gap-2">
                        <div className="relative flex-1">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <LinkIcon className="h-3.5 w-3.5 text-slate-400" />
                          </div>
                          <input
                            type="text"
                            value={link}
                            onChange={(e) => handleLinkChange(idx, e.target.value)}
                            placeholder="Social URL"
                            className="block w-full pl-9 rounded-lg border-slate-200 bg-slate-50 py-2 text-sm focus:border-[#10a37f] focus:ring-[#10a37f]"
                          />
                        </div>
                        {idx === links.length - 1 ? (
                          <button type="button" onClick={addLink} className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600"><Plus size={16}/></button>
                        ) : (
                          <button type="button" onClick={() => removeLink(idx)} className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-500"><Trash2 size={16}/></button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 5. Documents */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                <h3 className="text-sm font-bold text-slate-900">Documents (KYC)</h3>
              </div>
              <div className="p-6 space-y-6">
                
                {/* NID */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">National ID</label>
                  <input type="file" name="nidFile" onChange={(e) => setNidLocal(e.target.files?.[0])} className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200" />
                  {nidPreview && (
                    <div className="mt-2 p-2 bg-slate-50 rounded border border-slate-100 text-xs">
                      {isImage(nidLocal?.type) ? <img src={nidPreview} className="h-20 object-contain" /> : <span className="text-slate-600">File Selected: {nidLocal?.name}</span>}
                    </div>
                  )}
                </div>

                {/* Trade License */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Trade License</label>
                  <input type="file" name="tradeLicenseFile" onChange={(e) => setTradeLocal(e.target.files?.[0])} className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200" />
                  {tradePreview && (
                    <div className="mt-2 p-2 bg-slate-50 rounded border border-slate-100 text-xs">
                      {isImage(tradeLocal?.type) ? <img src={tradePreview} className="h-20 object-contain" /> : <span className="text-slate-600">File Selected: {tradeLocal?.name}</span>}
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-3 px-4 bg-[#10a37f] hover:bg-[#0e906f] text-white text-sm font-bold uppercase tracking-wide rounded-lg shadow-md shadow-emerald-500/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin h-4 w-4" /> : "Create Client"}
              </button>
              <Link href="/clients" className="w-full py-3 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-sm font-bold uppercase tracking-wide rounded-lg text-center transition-all">
                Cancel
              </Link>
            </div>

          </div>
        </form>
      </main>
    </div>
  );
}