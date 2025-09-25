"use client";

import { useEffect, useState, useCallback } from "react";
import { FileText, FileDown, ImageIcon, RefreshCw } from "lucide-react";

/* UI bits */
function Spinner({ className = "" }) {
  return (
    <div className={`inline-block h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600 ${className}`} />
  );
}
function LoadingOverlay() {
  return (
    <div className="relative">
      <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 backdrop-blur-sm">
        <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-2 shadow-sm">
          <Spinner />
          <span className="text-sm text-gray-700">Loading KYC…</span>
        </div>
      </div>
    </div>
  );
}
function SkeletonFile() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm animate-pulse">
      <div className="mb-3 h-4 w-48 rounded bg-gray-200" />
      <div className="h-[240px] w-full rounded-lg bg-gray-100" />
      <div className="mt-3 h-9 w-28 rounded bg-gray-200" />
    </div>
  );
}
function FileBlock({ file, label }) {
  if (!file?.path) return null;
  const isImage = (file.mimetype || "").startsWith("image/");
  const isPdf = (file.mimetype || "").toLowerCase().includes("pdf");
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2 text-sm text-gray-700">
        <FileText className="h-4 w-4" />
        <span className="font-medium">{label}</span>
        <span className="text-gray-400">•</span>
        <span className="text-gray-500">{file.filename}</span>
      </div>
      <div className="rounded-lg border border-gray-100 bg-gray-50 p-2">
        {isImage ? (
          <img src={file.path} alt={label} loading="lazy" className="max-h-[380px] w-auto rounded-md object-contain mx-auto" />
        ) : isPdf ? (
          <iframe src={file.path} className="w-full h-[420px] rounded-md bg-white" title={label} loading="lazy" />
        ) : (
          <div className="flex items-center justify-between p-3">
            <div className="flex items-center gap-2 text-gray-600">
              <ImageIcon className="h-4 w-4" />
              <span>No inline preview for this file type.</span>
            </div>
            <a href={file.path} download className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100">
              <FileDown className="h-4 w-4" />
              Download
            </a>
          </div>
        )}
      </div>
      <div className="mt-3">
        <a href={file.path} download className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100">
          <FileDown className="h-4 w-4" />
          Download
        </a>
      </div>
    </div>
  );
}

/* fetch helpers */
async function fetchWithTimeout(url, { timeout = 15000, ...options } = {}) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort("timeout"), timeout);
  try {
    const res = await fetch(url, { ...options, signal: ctrl.signal, cache: "no-store" });
    return res;
  } finally {
    clearTimeout(id);
  }
}
async function fetchKyc(clientId, { attempts = 3, timeout = 15000, delayBase = 600 } = {}) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetchWithTimeout(`/api/clients/${encodeURIComponent(clientId)}/kyc`, { timeout });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      const nid = json?.nidFile ?? json?.kyc?.nidFile ?? null;
      const tl  = json?.tradeLicenseFile ?? json?.kyc?.tradeLicenseFile ?? null;

      const withPath = (obj, field) =>
        obj
          ? {
              filename: obj.filename || "",
              mimetype: obj.mimetype || "",
              size: obj.size || 0,
              path: obj.path || `/api/clients/${encodeURIComponent(clientId)}/files/${field}`,
            }
          : null;

      return { nidFile: withPath(nid, "nidFile"), tradeLicenseFile: withPath(tl, "tradeLicenseFile") };
    } catch (e) {
      lastErr = e;
      await new Promise((r) => setTimeout(r, delayBase * Math.pow(2, i)));
    }
  }
  throw lastErr || new Error("Failed to load KYC");
}

/* main */
export default function KycSection({ clientId }) {
  const [kyc, setKyc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setErr("");
    try {
      const data = await fetchKyc(clientId);
      setKyc(data);
    } catch (e) {
      console.error("KYC load error:", e);
      setErr(e?.message || "Failed to load KYC");
      setKyc(null);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    load(); // start immediately
  }, [load]);

  if (loading) {
    return (
      <div className="relative">
        <LoadingOverlay />
        <div className="grid gap-6 opacity-60">
          <SkeletonFile />
          <SkeletonFile />
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
        <div className="flex items-center justify-between">
          <span>{err}</span>
          <button
            onClick={load}
            className="inline-flex items-center gap-2 rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-sm font-medium text-rose-700 hover:bg-rose-50"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  const hasAny = kyc?.nidFile || kyc?.tradeLicenseFile;
  if (!hasAny) {
    return <div className="rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-600">No KYC files uploaded.</div>;
  }

  return (
    <div className="grid gap-6">
      <FileBlock file={kyc.nidFile} label="NID" />
      <FileBlock file={kyc.tradeLicenseFile} label="Trade License" />
    </div>
  );
}
