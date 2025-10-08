// components/BulkUploadModal.jsx
"use client";

import { useState } from "react";

export default function BulkUploadModal({ onClose, onUploaded }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/leads/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      onUploaded();
    } catch (e) {
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl border border-gray-200 w-full max-w-md p-6 shadow-xl">
        <h2 className="text-xl font-semibold mb-4">Bulk Upload Leads (CSV)</h2>
        <input
          type="file"
          accept=".csv"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="block w-full text-sm text-gray-700"
        />
        <div className="mt-4 text-xs text-gray-500">
          Columns: <code>name,email,phone,company,status,priority</code>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border text-gray-700 hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
          >
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </div>
      </div>
    </div>
  );
}
