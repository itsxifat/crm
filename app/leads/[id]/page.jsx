"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, User, Building2, Phone, Mail } from "lucide-react";

function Card({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5 text-gray-500" />
        <div>
          <div className="text-sm text-gray-500">{label}</div>
          <div className="text-lg font-semibold text-gray-900 break-all">{value || "—"}</div>
        </div>
      </div>
    </div>
  );
}

export default function LeadDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await fetch(`/api/leads/${id}`, { cache: "no-store" });
        if (!res.ok) throw new Error("Not found");
        const json = await res.json();
        if (active) setLead(json);
      } catch (e) {
        if (active) setLead(null);
      } finally {
        if (active) setLoading(false);
      }
    }
    if (id) load();
    return () => { active = false; };
  }, [id]);

  if (loading) return <div className="p-10 text-center text-gray-500">Loading…</div>;
  if (!lead) return <div className="p-10 text-center text-gray-500">Lead not found</div>;

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8 flex justify-between items-center">
        <h1 className="text-3xl font-extrabold text-gray-900">{lead.name}</h1>
        <div className="flex gap-2">
          <Link
            href="/leads"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <button
            onClick={() => router.push(`/leads`)}
            className="hidden sm:inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Go to list
          </button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card icon={User} label="Name" value={lead.name} />
        <Card icon={Mail} label="Email" value={lead.email} />
        <Card icon={Phone} label="Phone" value={lead.phone} />
        <Card icon={Building2} label="Company" value={lead.company} />
      </div>

      <div className="mt-8">
        <p className="text-sm text-gray-600">
          Status:{" "}
          <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-800 text-xs font-medium">
            {lead.status}
          </span>
        </p>
      </div>
    </main>
  );
}