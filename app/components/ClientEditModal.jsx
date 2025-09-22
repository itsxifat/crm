"use client";

import { useEffect, useRef, useState } from "react";
import { X, Upload, Save, Building2, Mail, Phone, Globe, CalendarDays, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ClientEditModal({ open, onClose, client }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const dialogRef = useRef(null);
  useEffect(() => {
    if (open && dialogRef.current) {
      const first = dialogRef.current.querySelector("input,select,button,textarea,a[href]");
      first?.focus();
    }
  }, [open]);

  if (!open) return null;

  async function onSubmit(e) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setSaving(true);
    try {
      const res = await fetch(`/api/clients/${encodeURIComponent(client.id)}`, { method: "PATCH", body: fd });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`);
      router.refresh();
      onClose?.();
    } catch (err) {
      alert(err.message || "Failed to update client");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="absolute inset-x-0 bottom-0 mx-auto w-full md:inset-y-10 md:max-w-3xl">
        <div
          ref={dialogRef}
          className="flex max-h-[92dvh] flex-col rounded-t-2xl border border-gray-200 bg-white shadow-2xl md:rounded-2xl md:max-h-[86vh]"
          role="dialog"
          aria-modal="true"
          aria-label="Update client"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between bg-white px-5 py-4 border-b border-gray-200">
            <h3 className="text-base font-semibold text-gray-900">Update Client</h3>
            <button
              onClick={onClose}
              className="rounded-md p-2 text-gray-500 hover:bg-gray-100"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={onSubmit} className="overflow-y-auto px-5 py-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Company / Client */}
              <Card title="Company & Client" icon={Building2}>
                <Field label="Company name">
                  <input
                    name="companyName"
                    defaultValue={client.companyName || ""}
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </Field>
                <Field label="Client name *">
                  <input
                    name="clientName"
                    required
                    defaultValue={client.clientName || ""}
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </Field>
              </Card>

              {/* Contact */}
              <Card title="Contact" icon={Phone}>
                <Field label="Email *" icon={<Mail className="h-4 w-4 text-gray-400" />}>
                  <input
                    type="email"
                    name="email"
                    required
                    defaultValue={client.email || ""}
                    className="block w-full pl-9 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </Field>
                <Field label="Phone *" icon={<Phone className="h-4 w-4 text-gray-400" />}>
                  <input
                    name="phone"
                    required
                    defaultValue={client.phone || ""}
                    className="block w-full pl-9 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </Field>
              </Card>

              {/* Links & Meta */}
              <Card title="Links & Meta" icon={Globe}>
                <Field label="Website" icon={<Globe className="h-4 w-4 text-gray-400" />}>
                  <input
                    name="website"
                    defaultValue={client.website || ""}
                    className="block w-full pl-9 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </Field>
                <Field label="Page link" icon={<Globe className="h-4 w-4 text-gray-400" />}>
                  <input
                    name="pageLink"
                    defaultValue={client.pageLink || ""}
                    className="block w-full pl-9 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Joining date" icon={<CalendarDays className="h-4 w-4 text-gray-400" />}>
                    <input
                      type="date"
                      name="joiningDate"
                      defaultValue={client.joiningDate ? String(client.joiningDate).slice(0, 10) : ""}
                      className="block w-full pl-9 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                    />
                  </Field>
                  <Field label="Priority">
                    <select
                      name="priority"
                      defaultValue={client.priority || "Normal"}
                      className="block w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                    >
                      <option>High</option>
                      <option>Medium</option>
                      <option>Normal</option>
                    </select>
                  </Field>
                </div>
              </Card>

              {/* Address */}
              <Card title="Address" icon={MapPin} full>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field label="Address line 1 *">
                    <input
                      name="address.line1"
                      required
                      defaultValue={client.address?.line1 || ""}
                      className="block w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                    />
                  </Field>
                  <Field label="Address line 2">
                    <input
                      name="address.line2"
                      defaultValue={client.address?.line2 || ""}
                      className="block w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                    />
                  </Field>
                  <Field label="City">
                    <input
                      name="address.city"
                      defaultValue={client.address?.city || ""}
                      className="block w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                    />
                  </Field>
                  <Field label="State">
                    <input
                      name="address.state"
                      defaultValue={client.address?.state || ""}
                      className="block w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                    />
                  </Field>
                  <Field label="Postal code">
                    <input
                      name="address.postalCode"
                      defaultValue={client.address?.postalCode || ""}
                      className="block w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                    />
                  </Field>
                  <Field label="Country">
                    <input
                      name="address.country"
                      defaultValue={client.address?.country || ""}
                      className="block w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                    />
                  </Field>
                </div>
              </Card>

              {/* Files */}
              <Card title="KYC Files" icon={Upload} full>
                <FileRow label="NID (upload to replace)" name="nidFile" file={client.nidFile} />
                <FileRow label="Trade License (upload to replace)" name="tradeLicenseFile" file={client.tradeLicenseFile} />
              </Card>
            </div>

            <div className="sticky bottom-0 mt-5 -mx-5 border-t border-gray-200 bg-white px-5 py-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                <Save className="h-4 w-4" />
                {saving ? "Saving..." : "Save changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function Card({ title, icon: Icon, full = false, children }) {
  return (
    <div className={`rounded-2xl border border-gray-200 bg-white ${full ? "md:col-span-2" : ""}`}>
      <div className="flex items-center gap-2 border-b border-gray-200 px-4 py-3">
        <div className="rounded-lg bg-gray-50 p-1.5">
          <Icon className="h-4 w-4 text-gray-700" />
        </div>
        <h4 className="text-sm font-semibold text-gray-900">{title}</h4>
      </div>
      <div className="p-4 grid gap-3">{children}</div>
    </div>
  );
}

function Field({ label, icon, children }) {
  return (
    <label className="block">
      <div className="mb-1 text-xs font-semibold text-gray-600">{label}</div>
      <div className="relative">
        {icon ? <span className="absolute inset-y-0 left-0 flex items-center pl-3">{icon}</span> : null}
        {children}
      </div>
    </label>
  );
}

function FileRow({ label, name, file }) {
  const isImage = file?.mimetype?.startsWith("image/");
  const isPdf = (file?.mimetype || "").includes("pdf");
  return (
    <div className="grid gap-2">
      <div className="text-xs font-semibold text-gray-600">{label}</div>
      <div className="flex items-center gap-3">
        <input type="file" name={name} className="block w-full text-sm" />
        {file?.path ? (
          <div className="flex items-center gap-2">
            <a
              href={file.path}
              target="_blank"
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
            >
              Preview
            </a>
            <a
              href={file.path}
              download
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
            >
              Download
            </a>
          </div>
        ) : (
          <span className="text-xs text-gray-500">No file</span>
        )}
      </div>

      {file?.path && (isImage || isPdf) ? (
        <div className="hidden md:block rounded-md border border-gray-100 bg-gray-50 p-2">
          {isImage ? (
            <img src={file.path} alt={label} className="max-h-48 w-auto rounded object-contain" />
          ) : (
            <iframe src={file.path} className="w-full h-48 rounded bg-white" title={label} />
          )}
        </div>
      ) : null}
    </div>
  );
}
