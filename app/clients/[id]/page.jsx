import { absoluteUrl } from "@/lib/absoluteUrl";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Building2, Phone, Mail, Globe, MapPin } from "lucide-react";
import EditClientButton from "./update.client";
import KycSection from "./kyc.client";

/** Always render the row and show "—" when empty. */
function Labeled({ icon: Icon, label, value }) {
  const isString = typeof value === "string";
  const display = isString ? (value.trim().length ? value : "—") : value ?? "—";

  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 text-gray-500" />
      <div>
        <div className="text-gray-500 text-sm">{label}</div>
        <div className="font-medium text-gray-900 break-words">{display}</div>
      </div>
    </div>
  );
}

function SectionCard({ title, children, right }) {
  return (
    <div className="rounded-3xl border border-gray-200/70 bg-white/90 p-6 shadow-[0_6px_18px_-12px_rgba(0,0,0,0.2)] backdrop-blur">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight text-gray-900">{title}</h2>
        {right}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

export default async function ClientDetailsPage({ params }) {
  const { id } = await params; // Next 15

  // Server fetch core client info
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
        <div className="mb-8 flex items-center justify-between">
          <Link href="/clients" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-4 w-4" />
            Back to Clients
          </Link>
          <EditClientButton id={id} />
        </div>

        <section className="grid gap-8 lg:grid-cols-2">
          <SectionCard title="Contact & Company">
            <div className="grid gap-4 text-sm">
              <Labeled icon={Building2} label="Company" value={client.companyName} />
              <Labeled icon={Building2} label="Client Name" value={client.clientName} />

              <Labeled
                icon={Mail}
                label="Email"
                value={
                  client.email ? (
                    <a className="text-emerald-700 hover:underline" href={`mailto:${client.email}`}>
                      {client.email}
                    </a>
                  ) : ""
                }
              />

              <Labeled icon={Phone} label="Phone" value={client.phone} />

              <Labeled
                icon={Globe}
                label="Website"
                value={
                  client.website ? (
                    <a className="text-emerald-700 hover:underline break-all" target="_blank" href={client.website}>
                      {client.website}
                    </a>
                  ) : ""
                }
              />

              <Labeled
                icon={Globe}
                label="Page Link"
                value={
                  client.pageLink ? (
                    <a className="text-emerald-700 hover:underline break-all" target="_blank" href={client.pageLink}>
                      {client.pageLink}
                    </a>
                  ) : ""
                }
              />

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

          <SectionCard title="KYC Files" right={<span className="text-xs text-gray-500">Loads after page render</span>}>
            <KycSection clientId={id} />
          </SectionCard>
        </section>
      </div>
    </main>
  );
}
