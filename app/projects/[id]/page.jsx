// app/projects/[id]/page.jsx
import { absoluteUrl } from "@/lib/absoluteUrl";
import ExportPDFButtonClient from "./ExportPDFButtonClient";
import {
  Calendar,
  DollarSign,
  TrendingUp,
  User,
  Building2,
  ArrowLeft,
  BadgeDollarSign,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";
import { revalidatePath } from "next/cache";

/* ---------- Small UI helpers ---------- */
function StatusPill({ status }) {
  const map = {
    "In progress": "bg-amber-100 text-amber-800 ring-amber-200",
    Completed: "bg-emerald-100 text-emerald-800 ring-emerald-200",
    "On hold": "bg-yellow-100 text-yellow-800 ring-yellow-200",
    "In-progress": "bg-blue-100 text-blue-800 ring-blue-200",
    Pending: "bg-gray-100 text-gray-800 ring-gray-200",
  };
  const cls = map[status] ?? "bg-gray-100 text-gray-800 ring-gray-200";
  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ring-1 ${cls}`}>
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, hint }) {
  return (
    <div className="rounded-2xl border border-gray-200/70 bg-white/90 p-5 shadow-[0_6px_18px_-12px_rgba(0,0,0,0.2)] backdrop-blur">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">{label}</div>
        <div className="rounded-xl bg-gray-50 p-2">
          <Icon className="h-5 w-5 text-gray-700" />
        </div>
      </div>
      <div className="mt-3 text-2xl font-semibold tracking-tight text-gray-900">{value}</div>
      {hint && <div className="mt-1 text-xs text-gray-500">{hint}</div>}
    </div>
  );
}

function AvatarBadge({ name }) {
  const initials = (name || "NA")
    .split(" ").map((n) => n[0] || "").join("").slice(0, 2).toUpperCase();
  const palette = ["bg-rose-500","bg-amber-500","bg-emerald-500","bg-cyan-500","bg-indigo-500","bg-purple-500"];
  const idx = name ? name.charCodeAt(0) % palette.length : 0;
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-2 py-1 text-xs shadow-sm">
      <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-white ${palette[idx]}`}>{initials}</span>
      <span className="font-medium text-gray-800">{name}</span>
    </span>
  );
}

/* ---------- Page ---------- */
export default async function ProjectDetailsPage(props) {
  const { id } = await props.params;

  const projectURL = await absoluteUrl(`/api/projects/${encodeURIComponent(id)}`);
  const clientsURL = await absoluteUrl("/api/clients/list");
  const usersURL = await absoluteUrl("/api/users/list");

  const [projRes, clientsRes, usersRes] = await Promise.all([
    fetch(projectURL, { cache: "no-store" }),
    fetch(clientsURL, { cache: "no-store" }),
    fetch(usersURL, { cache: "no-store" }),
  ]);

  if (!projRes.ok) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="rounded-2xl border bg-white p-10 text-center shadow-sm">
            <h1 className="text-2xl font-semibold text-gray-900">Project not found</h1>
            <p className="mt-2 text-gray-600">ID: {id}</p>
            <Link
              href="/projects"
              className="mt-6 inline-flex items-center gap-2 rounded-xl border bg-white px-4 py-2 text-sm font-medium text-gray-900 shadow-sm hover:bg-gray-50"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Projects
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const project = await projRes.json();
  const clients = clientsRes.ok ? await clientsRes.json() : [];
  const users = usersRes.ok ? await usersRes.json() : [];

  const clientName =
    clients.find((c) => String(c._id) === String(project.clientId))?.name ||
    clients.find((c) => String(c.id) === String(project.clientId))?.name ||
    "—";

  const assignedUserNames = Array.isArray(project.assignedUserIds)
    ? project.assignedUserIds
        .map((uid) => users.find(
          (u) => String(u._id) === String(uid) || String(u.id) === String(uid)
        )?.name)
        .filter(Boolean)
    : [];

  const amount = Number(project.totalAmount || 0);
  const cost = Number(project.totalCost || 0);
  const profit = Number(typeof project.profit === "number" ? project.profit : amount - cost);
  const marginPct = amount > 0 ? Math.round((profit / amount) * 100) : null;

  const services = Array.isArray(project.services) ? project.services : [];
  const fmt = (n) => Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  /* -------- Server Action: update status (Pending | In-progress | Completed | On hold | Canceled | Revision) -------- */
  async function updateProjectStatus(formData) {
    "use server";
    const status = String(formData.get("status") || "");
    const allowed = ["Pending","In-progress","Completed","On hold","Canceled","Revision","In progress"]; // allow both spellings
    if (!allowed.includes(status)) return;
    await fetch(projectURL, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
      cache: "no-store",
    }).catch(() => {});
    revalidatePath(`/projects/${encodeURIComponent(id)}`);
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(1000px_600px_at_10%_-10%,rgba(16,185,129,0.08),transparent),radial-gradient(800px_500px_at_90%_-20%,rgba(59,130,246,0.08),transparent)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        {/* Top header (CHANGED: overflow-visible so dropdown can overflow outside) */}
        <div className="mb-8 overflow-visible rounded-3xl border border-gray-200/60 bg-white shadow-[0_12px_32px_-24px_rgba(0,0,0,0.25)]">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between p-6 sm:p-8">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-extrabold tracking-tight text-gray-950">{project.name}</h1>
                <StatusPill status={project.status} />

                {/* Update Status dropdown (button -> menu; auto-submit) */}
                <form action={updateProjectStatus} className="relative">
                  <details className="group relative">
                    <summary
                      className="list-none inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-800 shadow-sm hover:bg-gray-50 cursor-pointer select-none"
                      aria-haspopup="menu"
                    >
                      Update status
                      <ChevronDown className="h-4 w-4 text-gray-500 transition-transform group-open:rotate-180" />
                    </summary>

                    {/* dropdown (will now overflow outside the card just fine) */}
                    <div
                      role="menu"
                      className="absolute z-40 mt-2 w-44 rounded-xl border border-gray-200 bg-white p-1 shadow-lg"
                    >
                      {["Pending","In-progress","Completed","On hold","Canceled","Revision"].map(opt => (
                        <button
                          key={opt}
                          type="submit"
                          name="status"
                          value={opt}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-gray-50 ${
                            project.status === opt ? "text-emerald-700 font-medium" : "text-gray-700"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </details>
                </form>
              </div>

              <p className="mt-2 text-sm text-gray-500">
                Project ID:{" "}
                <span className="rounded-md bg-gray-50 px-2 py-0.5 font-mono text-gray-800 ring-1 ring-gray-200">
                  {project.id}
                </span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/projects"
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-900 shadow-sm hover:bg-gray-50"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Link>
              <ExportPDFButtonClient
                project={project}
                clientName={clientName}
                assignedUserNames={assignedUserNames}
              />
            </div>
          </div>

          {/* Highlight bar */}
          <div className="grid gap-4 border-t border-gray-100 bg-gradient-to-r from-gray-50 to-white p-4 sm:grid-cols-3">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-emerald-50 p-2"><Building2 className="h-4 w-4 text-emerald-600" /></div>
              <div className="text-sm">
                <div className="text-gray-500">Client</div>
                <div className="font-medium text-gray-900">{clientName}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-50 p-2"><Calendar className="h-4 w-4 text-blue-600" /></div>
              <div className="text-sm">
                <div className="text-gray-500">Schedule</div>
                <div className="font-medium text-gray-900">
                  {project.startDate || "—"} <span className="text-gray-400">→</span> {project.dueDate || "—"}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-50 p-2"><BadgeDollarSign className="h-4 w-4 text-amber-600" /></div>
              <div className="text-sm">
                <div className="text-gray-500">Budget</div>
                <div className="font-medium text-gray-900">${amount.toFixed(2)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Content grid */}
        <section id="print-area" className="grid gap-8 md:grid-cols-2">
          {/* Overview */}
          <div className="rounded-3xl border border-gray-200/70 bg-white/90 p-6 shadow-[0_6px_18px_-12px_rgba(0,0,0,0.2)] backdrop-blur">
            <h2 className="text-lg font-semibold tracking-tight text-gray-900">Overview</h2>
            <div className="mt-5 grid grid-cols-1 gap-4 text-sm">
              <div className="flex items-start gap-3">
                <Building2 className="mt-0.5 h-4 w-4 text-gray-500" />
                <div>
                  <div className="text-gray-500">Client</div>
                  <div className="font-medium">{clientName}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="mt-0.5 h-4 w-4 text-gray-500" />
                <div>
                  <div className="text-gray-500">Dates</div>
                  <div className="font-medium">
                    {project.startDate || "—"} <span className="text-gray-400">to</span> {project.dueDate || "—"}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <User className="mt-0.5 h-4 w-4 text-gray-500" />
                <div className="flex-1">
                  <div className="text-gray-500">Assigned Users</div>
                  {assignedUserNames.length ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {assignedUserNames.map((n) => <AvatarBadge key={n} name={n} />)}
                    </div>
                  ) : (
                    <div className="font-medium">—</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Financials */}
          <div className="rounded-3xl border border-gray-200/70 bg-white/90 p-6 shadow-[0_6px_18px_-12px_rgba(0,0,0,0.2)] backdrop-blur">
            <h2 className="text-lg font-semibold tracking-tight text-gray-900">Financials</h2>

            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <StatCard icon={DollarSign} label="Amount" value={`$${amount.toFixed(2)}`} />
              <StatCard icon={DollarSign} label="Cost" value={`$${cost.toFixed(2)}`} />
              <StatCard
                icon={TrendingUp}
                label="Profit"
                value={`$${profit.toFixed(2)}`}
                hint={marginPct !== null ? `${marginPct}% margin` : "No budget"}
              />
            </div>

            <div className="mt-6">
              <div className="mb-1 flex justify-between text-xs text-gray-500">
                <span>Profit ratio</span>
                <span>{marginPct !== null ? `${marginPct}%` : "—"}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-100">
                <div
                  className={`h-2 rounded-full transition-all ${profit >= 0 ? "bg-emerald-500" : "bg-rose-500"}`}
                  style={{ width: marginPct !== null ? `${Math.min(100, Math.max(0, marginPct))}%` : "0%" }}
                />
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="md:col-span-2 rounded-3xl border border-gray-200/70 bg-white/90 p-6 shadow-[0_6px_18px_-12px_rgba(0,0,0,0.2)] backdrop-blur">
            <h2 className="text-lg font-semibold tracking-tight text-gray-900">Summary</h2>

            <div className="mt-4 overflow-x-auto">
              {services.length ? (
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-600">
                      <th className="px-3 py-2 text-left">Description</th>
                      <th className="px-3 py-2 text-right whitespace-nowrap">Unit price</th>
                      <th className="px-3 py-2 text-right">Unit</th>
                      <th className="px-3 py-2 text-right">Total</th>
                      <th className="px-3 py-2 text-right">Offer</th>
                      <th className="px-3 py-2 text-left">Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {services.map((s, i) => {
                      const unit = Number(s.unit) || 0;
                      const unitPrice = Number(s.unitPrice) || 0;
                      const totalAuto = unit * unitPrice;
                      const offer =
                        s.offerPrice !== undefined && s.offerPrice !== null && s.offerPrice !== ""
                          ? Number(s.offerPrice) || 0
                          : null;
                      return (
                        <tr key={i} className="align-top">
                          <td className="px-3 py-2 text-gray-900">{s.description}</td>
                          <td className="px-3 py-2 text-right">${fmt(unitPrice)}</td>
                          <td className="px-3 py-2 text-right">{unit}</td>
                          <td className="px-3 py-2 text-right">${fmt(totalAuto)}</td>
                          <td className="px-3 py-2 text-right">
                            {offer !== null ? `$${fmt(offer)}` : <span className="text-gray-400">—</span>}
                          </td>
                          <td className="px-3 py-2 text-gray-600">{s.note || <span className="text-gray-400">—</span>}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-gray-100">
                      <td className="px-3 py-3 text-right font-medium text-gray-600" colSpan={3}>Subtotal</td>
                      <td className="px-3 py-3 text-right font-semibold text-gray-900">${fmt(amount)}</td>
                      <td className="px-3 py-3 text-right font-medium text-gray-600">Cost</td>
                      <td className="px-3 py-3 text-left font-semibold text-gray-900">${fmt(cost)}</td>
                    </tr>
                  </tfoot>
                </table>
              ) : (
                <p className="text-sm text-gray-600">No services added.</p>
              )}
            </div>

            <p className="mt-6 text-sm leading-relaxed text-gray-600">
              This executive report consolidates project metadata, schedule, and financials in a clean, exportable format.
              Use <strong>Export PDF</strong> to generate a client-ready report.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
