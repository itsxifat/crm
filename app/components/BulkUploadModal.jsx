"use client";

import { useState, useRef } from "react";
import { Upload, X, FileSpreadsheet, CheckCircle, AlertCircle, Loader2, Download } from "lucide-react";

export default function BulkUploadModal({ onClose, onUploaded }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);

  const handleFile = (selectedFile) => {
    if (selectedFile && selectedFile.type === "text/csv") {
      setFile(selectedFile);
      setError("");
    } else {
      setError("Please upload a valid CSV file.");
      setFile(null);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  // --- NEW: Generate Sample CSV ---
  const downloadSample = () => {
    const headers = [
      "Name", "Designation", "Phone", "Alt Phone", "Email", "Company", 
      "Location", "Service", "Category", "Source", "Platform", "Reference", 
      "Status", "Links", "Date", "Sending Date", "Follow Up", "Note"
    ];
    const row1 = [
      "John Doe", "CEO", "01700000000", "01800000000", "john@example.com", "Acme Corp", 
      "Dhaka", "Web Dev", "Hot Lead", "Facebook", "Mobile", "Ref-123", 
      "New Lead", "https://fb.com/john;https://linkedin.com/in/john", "2023-10-25", "", "2023-11-01", "Interested in redesign"
    ];
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + row1.join(",");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "leads_sample_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    setError("");
    
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const res = await fetch("/api/leads/upload", { 
        method: "POST", 
        body: formData 
      });
      
      if (!res.ok) throw new Error("Upload failed. Please check your file format.");
      
      const data = await res.json();
      if (data.inserted === 0) {
        setError("No valid leads found. Check required columns.");
      } else {
        onUploaded();
      }
    } catch (e) {
      setError("Upload failed. Ensure your CSV is formatted correctly.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
      <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl flex flex-col transform transition-all overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-start p-6 pb-0">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Import Leads</h2>
            <p className="text-xs text-slate-500 mt-1 font-medium">Upload a CSV to bulk add prospects.</p>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          
          {/* Download Sample Button */}
          <button 
            onClick={downloadSample}
            className="w-full mb-6 flex items-center justify-center gap-2 py-2.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold uppercase tracking-wide hover:bg-indigo-100 transition-colors border border-indigo-100 dashed"
          >
            <Download className="h-4 w-4" />
            Download CSV Template
          </button>

          {/* Drop Zone */}
          <div
            className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ease-in-out cursor-pointer group
              ${dragActive 
                ? "border-[#10a37f] bg-[#10a37f]/5" 
                : file 
                  ? "border-emerald-200 bg-emerald-50/30"
                  : "border-slate-200 hover:border-[#10a37f]/50 hover:bg-slate-50"
              }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".csv"
              onChange={handleChange}
              className="hidden"
            />
            
            <div className="flex flex-col items-center justify-center space-y-3 pointer-events-none">
              {file ? (
                <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
              ) : (
                <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:text-[#10a37f] group-hover:bg-[#10a37f]/10 transition-colors">
                  <Upload className="h-5 w-5" />
                </div>
              )}
              
              <div className="text-sm">
                {file ? (
                  <div className="font-semibold text-emerald-700">
                    {file.name}
                    <span className="block text-[10px] text-emerald-600/70 font-medium mt-0.5 uppercase tracking-wide">
                      {(file.size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                ) : (
                  <>
                    <span className="font-bold text-slate-700">Click to upload</span>
                    <span className="text-slate-400"> or drag file</span>
                    <span className="block text-[10px] text-slate-400 mt-1 uppercase tracking-wide font-medium">CSV files only</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 rounded-lg bg-red-50 text-red-600 text-xs font-medium flex items-start gap-2 border border-red-100">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Helper Text */}
          {!file && !error && (
            <div className="mt-6">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <CheckCircle className="h-3 w-3" /> Required Fields
              </h4>
              <div className="flex flex-wrap gap-2">
                 <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase rounded border border-slate-200">Name</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide text-slate-500 hover:bg-white hover:text-slate-700 hover:shadow-sm border border-transparent hover:border-slate-200 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-[#10a37f] text-white text-xs font-bold uppercase tracking-wide hover:bg-[#0d8a6a] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            {uploading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Upload className="h-3.5 w-3.5" />
                Start Import
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}