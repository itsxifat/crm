// app/clients/add/page.jsx
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import toast from "react-hot-toast";

/* --- tiny icons (inline, no deps) --- */
const ArrowLeftIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="20" height="20"
       fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>
  </svg>
);

/* --- helpers --- */
function filePreviewURL(file) {
  if (!file || typeof file === "string") return null;
  try { return URL.createObjectURL(file); } catch { return null; }
}
function isImage(mime = "") { return /^image\//.test(mime); }
function isPDF(mime = "", name = "") {
  return mime === "application/pdf" || /\.pdf$/i.test(name || "");
}

export default function AddClientPage() {
  const [loading, setLoading] = useState(false);
  const [priority, setPriority] = useState("Normal");

  // local state to show previews before submit
  const [nidLocal, setNidLocal] = useState(null);
  const [tradeLocal, setTradeLocal] = useState(null);

  const nidPreview = useMemo(() => filePreviewURL(nidLocal), [nidLocal]);
  const tradePreview = useMemo(() => filePreviewURL(tradeLocal), [tradeLocal]);

  async function handleSubmit(e) {
    e.preventDefault();
    const formEl = e.currentTarget;
    const fd = new FormData(formEl);

    // Map UI field names → API expected dotted keys for address
    // (API expects address.line1, address.line2, etc.)
    const line1 = fd.get("addressLine1") || "";
    const line2 = fd.get("addressLine2") || "";
    const city = fd.get("city") || "";
    const state = fd.get("state") || "";
    const postalCode = fd.get("postalCode") || "";
    const country = fd.get("country") || "";

    // remove flat names so they don't clash
    fd.delete("addressLine1");
    fd.delete("addressLine2");
    fd.delete("city");
    fd.delete("state");
    fd.delete("postalCode");
    fd.delete("country");

    // set dotted names that the API uses
    fd.set("address.line1", String(line1));
    if (line2) fd.set("address.line2", String(line2));
    if (city) fd.set("address.city", String(city));
    if (state) fd.set("address.state", String(state));
    if (postalCode) fd.set("address.postalCode", String(postalCode));
    if (country) fd.set("address.country", String(country));

    // attach local File objects (in case user used the custom buttons)
    if (nidLocal instanceof File) fd.set("nidFile", nidLocal);
    if (tradeLocal instanceof File) fd.set("tradeLicenseFile", tradeLocal);

    try {
      // basic client-side required validation to match server
      if (!fd.get("clientName") || !fd.get("email") || !fd.get("phone") || !fd.get("address.line1")) {
        throw new Error("Client name, email, phone, and address line 1 are required.");
      }

      setLoading(true);
      const res = await fetch("/api/clients/add", { method: "POST", body: fd });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`);

      toast.success("Client added!");
      // Clean up
      formEl.reset();
      setPriority("Normal");
      setNidLocal(null);
      setTradeLocal(null);
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Server error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-gray-50/50 min-h-screen font-sans text-gray-800">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/clients"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to Clients
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Add New Client</h1>
          <p className="mt-1 text-sm text-gray-600">
            Enter the details below to create a new client record.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
          <form onSubmit={handleSubmit}>
            <div className="p-6 sm:p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Company Name */}
                <div className="md:col-span-2">
                  <label htmlFor="companyName" className="block text-sm font-semibold text-gray-700 mb-2">
                    Company Name
                  </label>
                  <input
                    type="text"
                    id="companyName"
                    name="companyName"
                    placeholder="e.g. Azwad Leather Co."
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 shadow-sm"
                  />
                </div>

                {/* Client Name (required) */}
                <div className="md:col-span-2">
                  <label htmlFor="clientName" className="block text-sm font-semibold text-gray-700 mb-2">
                    Client Name<span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="clientName"
                    name="clientName"
                    placeholder="Enter client name"
                    required
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 shadow-sm"
                  />
                </div>

                {/* Email (required) */}
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                    Email<span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="example@email.com"
                    required
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 shadow-sm"
                  />
                </div>

                {/* Phone (required) */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                    Phone<span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="phone"
                    name="phone"
                    placeholder="01xxxxxxxxx"
                    required
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 shadow-sm"
                  />
                </div>

                {/* Website */}
                <div>
                  <label htmlFor="website" className="block text-sm font-semibold text-gray-700 mb-2">
                    Website
                  </label>
                  <input
                    type="url"
                    id="website"
                    name="website"
                    placeholder="https://example.com"
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 shadow-sm"
                  />
                </div>

                {/* Page Link */}
                <div>
                  <label htmlFor="pageLink" className="block text-sm font-semibold text-gray-700 mb-2">
                    Page Link
                  </label>
                  <input
                    type="url"
                    id="pageLink"
                    name="pageLink"
                    placeholder="https://facebook.com/page"
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 shadow-sm"
                  />
                </div>

                {/* Joining Date */}
                <div>
                  <label htmlFor="joiningDate" className="block text-sm font-semibold text-gray-700 mb-2">
                    Joining Date
                  </label>
                  <input
                    type="date"
                    id="joiningDate"
                    name="joiningDate"
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 shadow-sm"
                  />
                </div>

                {/* Priority */}
                <div>
                  <label htmlFor="priority" className="block text-sm font-semibold text-gray-700 mb-2">
                    Priority
                  </label>
                  <select
                    id="priority"
                    name="priority"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 shadow-sm"
                  >
                    <option>High</option>
                    <option>Medium</option>
                    <option>Normal</option>
                  </select>
                </div>

                {/* Address Line 1 */}
                <div className="md:col-span-2">
                  <label htmlFor="addressLine1" className="block text-sm font-semibold text-gray-700 mb-2">
                    Address Line 1
                  </label>
                  <input
                    type="text"
                    id="addressLine1"
                    name="addressLine1"
                    placeholder="Street address, P.O. box, company name, c/o"
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 shadow-sm"
                  />
                </div>

                {/* Address Line 2 */}
                <div className="md:col-span-2">
                  <label htmlFor="addressLine2" className="block text-sm font-semibold text-gray-700 mb-2">
                    Address Line 2
                  </label>
                  <input
                    type="text"
                    id="addressLine2"
                    name="addressLine2"
                    placeholder="Apartment, suite, unit, building, floor, etc."
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 shadow-sm"
                  />
                </div>

                {/* City */}
                <div>
                  <label htmlFor="city" className="block text-sm font-semibold text-gray-700 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 shadow-sm"
                  />
                </div>

                {/* State/Division */}
                <div>
                  <label htmlFor="state" className="block text-sm font-semibold text-gray-700 mb-2">
                    State/Division
                  </label>
                  <input
                    type="text"
                    id="state"
                    name="state"
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 shadow-sm"
                  />
                </div>

                {/* Postal Code */}
                <div>
                  <label htmlFor="postalCode" className="block text-sm font-semibold text-gray-700 mb-2">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    id="postalCode"
                    name="postalCode"
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 shadow-sm"
                  />
                </div>

                {/* Country */}
                <div>
                  <label htmlFor="country" className="block text-sm font-semibold text-gray-700 mb-2">
                    Country
                  </label>
                  <input
                    type="text"
                    id="country"
                    name="country"
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 shadow-sm"
                  />
                </div>

                {/* NID upload */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">NID (any file)</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      name="nidFile"
                      accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                      onChange={(e) => setNidLocal(e.target.files?.[0] || null)}
                      className="block w-full text-sm text-gray-700 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border file:border-gray-300 file:bg-white file:text-gray-700 hover:file:bg-gray-50"
                    />
                  </div>

                  {/* Preview / Download */}
                  {nidLocal ? (
                    <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
                      <div className="text-xs text-gray-600 mb-2">
                        Selected: <strong>{nidLocal.name}</strong> ({nidLocal.type || "application/octet-stream"})
                      </div>
                      {nidPreview && (isImage(nidLocal.type) || isPDF(nidLocal.type, nidLocal.name)) ? (
                        <div className="rounded-md overflow-hidden border border-gray-200 bg-white">
                          {isImage(nidLocal.type) ? (
                            <img src={nidPreview} alt="NID preview" className="max-h-80 w-full object-contain" />
                          ) : (
                            <object data={nidPreview} type="application/pdf" className="w-full h-96">
                              <p className="p-4 text-sm text-gray-600">PDF preview not supported in this browser.</p>
                            </object>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500">Preview not available. You can still upload this file.</p>
                      )}
                      {nidPreview && (
                        <a
                          href={nidPreview}
                          download={nidLocal.name || "nid"}
                          className="mt-2 inline-block text-xs text-indigo-600 hover:underline"
                        >
                          Download selected file
                        </a>
                      )}
                    </div>
                  ) : null}
                </div>

                {/* Trade License upload */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Trade License (any file)</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      name="tradeLicenseFile"
                      accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                      onChange={(e) => setTradeLocal(e.target.files?.[0] || null)}
                      className="block w-full text-sm text-gray-700 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border file:border-gray-300 file:bg-white file:text-gray-700 hover:file:bg-gray-50"
                    />
                  </div>

                  {/* Preview / Download */}
                  {tradeLocal ? (
                    <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
                      <div className="text-xs text-gray-600 mb-2">
                        Selected: <strong>{tradeLocal.name}</strong> ({tradeLocal.type || "application/octet-stream"})
                      </div>
                      {tradePreview && (isImage(tradeLocal.type) || isPDF(tradeLocal.type, tradeLocal.name)) ? (
                        <div className="rounded-md overflow-hidden border border-gray-200 bg-white">
                          {isImage(tradeLocal.type) ? (
                            <img src={tradePreview} alt="Trade License preview" className="max-h-80 w-full object-contain" />
                          ) : (
                            <object data={tradePreview} type="application/pdf" className="w-full h-96">
                              <p className="p-4 text-sm text-gray-600">PDF preview not supported in this browser.</p>
                            </object>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500">Preview not available. You can still upload this file.</p>
                      )}
                      {tradePreview && (
                        <a
                          href={tradePreview}
                          download={tradeLocal.name || "trade-license"}
                          className="mt-2 inline-block text-xs text-indigo-600 hover:underline"
                        >
                          Download selected file
                        </a>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 rounded-b-xl border-t border-gray-200 flex items-center justify-end gap-3">
              <Link
                href="/clients"
                className="bg-white text-gray-700 border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-100 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="bg-indigo-600 text-white rounded-lg px-5 py-2 text-sm font-medium hover:bg-indigo-700 shadow-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Adding..." : "Add Client"}
              </button>
            </div>
          </form>
        </div>

        {/* Small note */}
        <p className="mt-4 text-xs text-gray-500">
          Files are stored securely in the database and streamed for inline preview/download. No files are written to <code className="bg-gray-100 px-1 rounded">/public</code>.
        </p>
      </main>
    </div>
  );
}
