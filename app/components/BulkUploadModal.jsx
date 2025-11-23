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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl flex flex-col transform transition-all">
        
        {/* Header */}
        <div className="flex justify-between items-start p-6 pb-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Import Leads</h2>
            <p className="text-sm text-gray-500 mt-1">Upload a CSV file to bulk import.</p>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Drop Zone */}
          <div
            className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ease-in-out cursor-pointer
              ${dragActive 
                ? "border-emerald-500 bg-emerald-50" 
                : file 
                  ? "border-emerald-200 bg-emerald-50/30"
                  : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
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
                <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm">
                  <FileSpreadsheet className="h-6 w-6" />
                </div>
              ) : (
                <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 shadow-sm">
                  <Upload className="h-6 w-6" />
                </div>
              )}
              
              <div className="text-sm">
                {file ? (
                  <div className="font-medium text-emerald-700">
                    {file.name}
                    <span className="block text-xs text-emerald-600 font-normal mt-1">
                      {(file.size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                ) : (
                  <>
                    <span className="font-semibold text-emerald-600">Click to upload</span>
                    <span className="text-gray-500"> or drag and drop</span>
                    <span className="block text-xs text-gray-400 mt-1">CSV files only</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm flex items-start gap-2 border border-red-100">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Helper Text / Expected Format */}
          {!file && !error && (
            <div className="mt-6 bg-gray-50 rounded-lg p-4 border border-gray-100">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" /> Supported Columns
              </h4>
              <div className="text-xs text-gray-600 leading-relaxed space-y-1">
                <p><span className="font-medium text-gray-900">Required:</span> Name</p>
                <p><span className="font-medium text-gray-900">Optional:</span> Phone, Email, Company, Status, Source, Date, Sending Date, Note, Reference, Category, Interested Service, FB Page Link, Platform, Followup, Location</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 rounded-b-2xl flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="inline-flex items-center gap-2 px-6 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Start Import
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}