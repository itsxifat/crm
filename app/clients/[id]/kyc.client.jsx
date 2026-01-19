"use client";

import { useEffect, useState, useCallback } from "react";
import { FileText, FileDown, ImageIcon, Upload, Loader2, X, Trash2, ShieldCheck, Briefcase } from "lucide-react";
import { useRouter } from "next/navigation";

/* --- 1. UI: File Card (Premium Look) --- */
function FileCard({ doc, onDelete, typeLabel, icon: Icon }) {
  if (!doc?.url) return null;

  const ext = doc.url.split('.').pop().toLowerCase();
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
  const isPdf = ext === 'pdf';

  return (
    <div className="group relative flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden h-full">
      {/* Header Label */}
      {typeLabel && (
        <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
          {Icon && <Icon className="h-3 w-3" />}
          {typeLabel}
        </div>
      )}

      {/* Preview Body */}
      <div className="relative flex-1 bg-slate-50/30 p-4 flex items-center justify-center min-h-[140px]">
        {isImage ? (
          <img src={doc.url} alt={doc.name} className="max-h-[120px] w-auto object-contain rounded-md shadow-sm" />
        ) : isPdf ? (
          <div className="flex flex-col items-center text-slate-400 gap-1">
             <FileText className="h-10 w-10" />
             <span className="text-[10px] font-medium">PDF Document</span>
          </div>
        ) : (
          <div className="flex flex-col items-center text-slate-400 gap-1">
             <ImageIcon className="h-10 w-10" />
             <span className="text-[10px] font-medium">{ext.toUpperCase()} File</span>
          </div>
        )}

        {/* Hover Actions */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-slate-900/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 backdrop-blur-[1px]">
           <a href={doc.url} download target="_blank" rel="noreferrer" className="p-2 bg-white rounded-full text-slate-700 hover:text-[#10a37f] shadow-lg transition-transform hover:scale-110" title="Download">
             <FileDown className="h-4 w-4" />
           </a>
           <button onClick={() => onDelete(doc._id)} className="p-2 bg-white rounded-full text-slate-700 hover:text-red-500 shadow-lg transition-transform hover:scale-110" title="Delete">
             <Trash2 className="h-4 w-4" />
           </button>
        </div>
      </div>

      {/* Footer Details */}
      <div className="px-4 py-3 bg-white border-t border-slate-100">
        <div className="flex items-center justify-between">
          <div className="truncate text-sm font-semibold text-slate-700 max-w-[70%]">{doc.name}</div>
          <span className="text-[10px] font-mono text-slate-400">{ext.toUpperCase()}</span>
        </div>
        <div className="text-[10px] text-slate-400 mt-0.5">
          Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}

/* --- 2. UI: Upload Placeholder (Empty Slot) --- */
function UploadSlot({ label, icon: Icon, onUpload, loading }) {
  const [dragActive, setDragActive] = useState(false);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
  };

  return (
    <div className={`relative h-full min-h-[200px] rounded-xl border-2 border-dashed flex flex-col items-center justify-center text-center p-6 transition-all ${dragActive ? 'border-[#10a37f] bg-[#10a37f]/5' : 'border-slate-200 bg-slate-50 hover:bg-slate-100'}`}>
      <input 
        type="file" 
        onChange={handleFile} 
        disabled={loading}
        className="absolute inset-0 opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
        onDragEnter={() => setDragActive(true)}
        onDragLeave={() => setDragActive(false)}
        onDrop={() => setDragActive(false)}
      />
      
      {loading ? (
        <Loader2 className="h-8 w-8 text-[#10a37f] animate-spin mb-3" />
      ) : (
        <div className="bg-white p-3 rounded-full shadow-sm mb-3 border border-slate-100">
          <Upload className="h-6 w-6 text-slate-400" />
        </div>
      )}
      
      <h4 className="text-sm font-bold text-slate-700 mb-1">{loading ? "Uploading..." : `Upload ${label}`}</h4>
      <p className="text-xs text-slate-400 px-4">Drag & drop or click to browse</p>
    </div>
  );
}

/* --- 3. Main Logic --- */
export default function KycSection({ clientId }) {
  const router = useRouter();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadingType, setUploadingType] = useState(null); // 'NID', 'Trade License', or 'General'

  // --- 3a. Fetch Data ---
  const load = useCallback(async () => {
    if (!clientId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/clients/${clientId}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.kycDocuments || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => { load(); }, [load]);

  // --- 3b. Computed State (Slots) ---
  const nidDoc = documents.find(d => d.name === "National ID");
  const tradeDoc = documents.find(d => d.name === "Trade License");
  const otherDocs = documents.filter(d => d.name !== "National ID" && d.name !== "Trade License");

  // --- 3c. Actions ---
  const handleUpload = async (file, type) => {
    if (!file) return;
    setUploadingType(type);

    try {
      const formData = new FormData();
      formData.append("file", file);
      // Auto-name specific slots, or use filename for general
      const name = type === "General" ? file.name : type; 
      formData.append("name", name);

      const res = await fetch(`/api/clients/${clientId}`, {
        method: "PATCH",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");
      const updated = await res.json();
      setDocuments(updated.kycDocuments || []);
      router.refresh();
    } catch (e) {
      alert(e.message);
    } finally {
      setUploadingType(null);
    }
  };

  const handleDelete = async (docId) => {
    if (!confirm("Permanently delete this document?")) return;
    
    // Optimistic Update
    const prevDocs = documents;
    setDocuments(prev => prev.filter(d => d._id !== docId));

    try {
      const res = await fetch(`/api/clients/${clientId}?docId=${docId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      router.refresh();
    } catch (e) {
      setDocuments(prevDocs); // Revert
      alert("Failed to delete document");
    }
  };

  if (!clientId) return null;

  return (
    <div className="space-y-8">
      
      {/* Primary KYC Slots */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* NID Slot */}
        <div className="space-y-3">
          {nidDoc ? (
            <FileCard 
              doc={nidDoc} 
              onDelete={handleDelete} 
              typeLabel="National ID" 
              icon={ShieldCheck} 
            />
          ) : (
            <UploadSlot 
              label="National ID" 
              icon={ShieldCheck} 
              loading={uploadingType === "National ID"} 
              onUpload={(f) => handleUpload(f, "National ID")} 
            />
          )}
        </div>

        {/* Trade License Slot */}
        <div className="space-y-3">
          {tradeDoc ? (
            <FileCard 
              doc={tradeDoc} 
              onDelete={handleDelete} 
              typeLabel="Trade License" 
              icon={Briefcase} 
            />
          ) : (
            <UploadSlot 
              label="Trade License" 
              icon={Briefcase} 
              loading={uploadingType === "Trade License"} 
              onUpload={(f) => handleUpload(f, "Trade License")} 
            />
          )}
        </div>
      </div>

      {/* Additional Documents Section */}
      <div className="pt-6 border-t border-slate-100">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Additional Files</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* General Upload Button */}
          <div className="md:col-span-1">
             <div className="relative h-full min-h-[120px] rounded-xl border border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 flex flex-col items-center justify-center transition-colors cursor-pointer group">
                <input 
                  type="file" 
                  onChange={(e) => handleUpload(e.target.files?.[0], "General")}
                  disabled={!!uploadingType}
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                />
                {uploadingType === "General" ? (
                   <Loader2 className="h-6 w-6 text-[#10a37f] animate-spin" />
                ) : (
                   <>
                     <div className="p-2 bg-white rounded-full shadow-sm mb-2 group-hover:scale-110 transition-transform">
                        <Upload className="h-4 w-4 text-slate-500" />
                     </div>
                     <span className="text-xs font-bold text-slate-600">Upload Other</span>
                   </>
                )}
             </div>
          </div>

          {/* Render Other Docs */}
          {otherDocs.map((doc) => (
            <div key={doc._id} className="md:col-span-1">
               <FileCard doc={doc} onDelete={handleDelete} />
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}