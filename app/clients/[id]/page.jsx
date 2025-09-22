import { absoluteUrl } from "@/lib/absoluteUrl";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft, Building2, Phone, Mail, Globe, CalendarDays, MapPin,
  FileText, FileDown, ImageIcon,
} from "lucide-react";
import EditClientButton from "./update.client";

function Labeled({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 text-gray-500" />
      <div>
        <div className="text-gray-500 text-sm">{label}</div>
        <div className="font-medium text-gray-900 break-words">{value}</div>
      </div>
    </div>
  );
}

function SectionCard({ title, children }) {
  return (
    <div className="rounded-3xl border border-gray-200/70 bg-white/90 p-6 shadow-[0_6px_18px_-12px_rgba(0,0,0,0.2)] backdrop-blur">
      <h2 className="text-lg font-semibold tracking-tight text-gray-900">{title}</h2>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function FileBlock({ file, label }) {
  if (!file?.path) return null;
  const isImage = (file.mimetype || "").startsWith("image/");
  const isPdf = (file.mimetype || "").includes("pdf");
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
          <img src={file.path} alt={label} className="max-h-[380px] w-auto rounded-md object-contain mx-auto" />
        ) : isPdf ? (
          <iframe src={file.path} className="w-full h-[420px] rounded-md bg-white" title={label} />
        ) : (
          <div className="flex items-center justify-between p-3">
            <div className="flex items-center gap-2 text-gray-600">
              <ImageIcon className="h-4 w-4" />
              <span>No inline preview for this file type.</span>
            </div>
            <a
              href={file.path}
              download
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              <FileDown className="h-4 w-4" />
              Download
            </a>
          </div>
        )}
      </div>

      <div className="mt-3">
        <a
          href={file.path}
          download
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
        >
          <FileDown className="h-4 w-4" />
          Download
        </a>
      </div>
    </div>
  );
}

export default async function ClientDetailsPage({ params }) {
  const { id } = await params; // ✅ Next.js 15 requires await
  const apiURL = await absoluteUrl(`/api/clients/${encodeURIComponent(id)}`);
  const res = await fetch(apiURL, { cache: "no-store" });
  if (!res.ok) {
    if (res.status === 404) return notFound();
    throw new Error("Failed to load client");
  }
  const client = await res.json();

  const fullAddress = [
    client.address?.line1,
    client.address?.line2,
    [client.address?.city, client.address?.state].filter(Boolean).join(", "),
    client.address?.postalCode,
    client.address?.country,
  ].filter(Boolean).join("\n");

  return (
    <main className="min-h-screen bg-[radial-gradient(1000px_600px_at_10%_-10%,rgba(16,185,129,0.08),transparent),radial-gradient(800px_500px_at_90%_-20%,rgba(59,130,246,0.08),transparent)]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
        {/* header & sections unchanged */}
        <section className="grid gap-8 lg:grid-cols-2">
          <SectionCard title="Contact & Company">
            <div className="grid gap-4 text-sm">
              <Labeled icon={Building2} label="Company" value={client.companyName} />
              <Labeled icon={Building2} label="Client Name" value={client.clientName} />
              <Labeled icon={Mail} label="Email" value={client.email ? <a className="text-emerald-700 hover:underline" href={`mailto:${client.email}`}>{client.email}</a> : null} />
              <Labeled icon={Phone} label="Phone" value={client.phone} />
              <Labeled icon={Globe} label="Website" value={client.website ? <a className="text-emerald-700 hover:underline break-all" target="_blank" href={client.website}>{client.website}</a> : null} />
              <Labeled icon={Globe} label="Page Link" value={client.pageLink ? <a className="text-emerald-700 hover:underline break-all" target="_blank" href={client.pageLink}>{client.pageLink}</a> : null} />
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 text-gray-500" />
                <div>
                  <div className="text-gray-500 text-sm">Address</div>
                  <pre className="font-sans whitespace-pre-wrap break-words text-gray-900">
                    {fullAddress || "—"}
                  </pre>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="KYC Files">
            <div className="grid gap-6">
              <FileBlock file={client.nidFile} label="NID" />
              <FileBlock file={client.tradeLicenseFile} label="Trade License" />
            </div>
          </SectionCard>
        </section>
      </div>
    </main>
  );
}
