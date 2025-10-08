import { absoluteUrl } from "@/lib/absoluteUrl";
import Link from "next/link";
import { requireAdmin } from "@/lib/requireAdmin";
import InvoiceEditModal from "./InvoiceEditModal";
import ProjectServicesModal from "./ProjectServicesModal";

/* ---------- data ---------- */
async function fetchInvoice(id) {
  const url = await absoluteUrl(`/api/invoices/${id}`);
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

function cn(...a){ return a.filter(Boolean).join(" "); }

/* ---------- page ---------- */
export default async function InvoiceDetailPage(props) {
  await requireAdmin();
  const { id } = await props.params; // Next.js 15: await params
  const inv = await fetchInvoice(id);

  if (!inv) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="border rounded-2xl bg-white p-10 text-center shadow-sm">
            <h1 className="text-xl font-semibold text-gray-900">Invoice not found</h1>
            <p className="text-gray-600 mt-2">ID: {id}</p>
            <Link href="/invoices" className="inline-block mt-6 px-4 py-2 rounded-lg border text-gray-900 hover:bg-gray-50">
              Back to invoices
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const paid = Number(inv.paidAmount || 0);
  const due = Number(inv.balanceDue ?? Math.max(0, Number(inv.total || 0) - paid));
  const payments = Array.isArray(inv.payments) ? inv.payments : [];
  const isClientInvoice = String(inv.source || "").toLowerCase() === "client";
  const projects = Array.isArray(inv.clientProjects) ? inv.clientProjects : [];

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Top bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="min-w-0">
            <nav className="flex items-center gap-2 text-sm text-gray-500">
              <Link href="/invoices" className="hover:text-gray-700">Invoices</Link>
              <span>/</span>
              <span className="truncate">{inv.invoiceId}</span>
            </nav>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h1 className="text-[22px] font-bold tracking-tight text-gray-900">{inv.invoiceId}</h1>
              <StatusBadge status={inv.status} />
            </div>
            <p className="text-sm text-gray-600 mt-1">{inv.clientName || "—"}</p>
          </div>

          <div className="flex items-center gap-2">
            <InvoiceEditModal
              invoiceId={String(inv._id)}
              currentDue={due}
              payments={payments}
              isClientInvoice={isClientInvoice}
              projects={projects}
            />
            <a
              href={inv.pdfUrl}
              target="_blank"
              rel="noreferrer"
              download={`${inv.invoiceId}.pdf`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
            >
              <svg width="16" height="16" viewBox="0 0 20 20" className="opacity-90" fill="currentColor">
                <path d="M9 1a1 1 0 112 0v9.586l2.293-2.293a1 1 0 111.414 1.414l-4.007 4.007a1 1 0 01-1.414 0L5.279 9.707a1 1 0 111.414-1.414L9 10.586V1z" />
                <path d="M3 14a1 1 0 011-1h12a1 1 0 011 1v2a3 3 0 01-3 3H6a3 3 0 01-3-3v-2z" />
              </svg>
              Download PDF
            </a>
            <Link
              href="/invoices"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border bg-white text-gray-900 hover:bg-gray-50"
            >
              Back
            </Link>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid gap-4 sm:grid-cols-3 mb-6">
          <Metric label="Total" value={money(inv.total, inv.currency)} />
          <Metric label="Paid" value={money(paid, inv.currency)} />
          <Metric label="Balance due" value={money(due, inv.currency)} highlight={due > 0} />
        </div>

        {/* Info panels */}
        <div className="grid gap-4 lg:grid-cols-3 mb-6">
          <Panel title="Invoice To">
            <KeyValue label="Client">{inv.clientName || "—"}</KeyValue>
            <KeyValue label="Phone">{inv.clientPhone || "—"}</KeyValue>
            <KeyValue label="Address">{inv.clientAddress || "—"}</KeyValue>
          </Panel>

          <Panel title="Invoice Meta">
            <KeyValue label="Invoice #">{inv.invoiceId}</KeyValue>
            <KeyValue label="Created">{formatDate(inv.createdAt)}</KeyValue>
            <KeyValue label="Last Updated">{formatDate(inv.updatedAt || inv.createdAt)}</KeyValue>
          </Panel>

          <Panel title="Our Company">
            <KeyValue label="Name">Enfinito</KeyValue>
            <KeyValue label="Phone">+880 1540-110050</KeyValue>
            <KeyValue label="Email">enfinito.official@gmail.com</KeyValue>
            <KeyValue label="Address">Sector: 11, Road: 14, House: 76 (3rd Floor), Uttara, Dhaka</KeyValue>
            <KeyValue label="Website">
              <a href="https://www.enfinito.com" target="_blank" rel="noreferrer" className="text-emerald-700 hover:underline">
                www.enfinito.com
              </a>
            </KeyValue>
          </Panel>
        </div>

        {/* Client Projects (only for client-based invoices) */}
        {isClientInvoice && (
          <Section title="Projects under this client">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <Th>Project</Th>
                    <Th className="text-right">Total</Th>
                    <Th className="text-right">Paid</Th>
                    <Th className="text-right">Due</Th>
                    <Th className="text-right">Actions</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(projects || []).map((p) => (
                    <tr key={p.projectId} className="bg-white">
                      <Td className="align-top">
                        <div className="font-medium text-gray-900">{p.name}</div>
                        {Number(p.due) === 0 && (
                          <span className="mt-1 inline-flex rounded-full bg-green-100 text-green-800 px-2 py-0.5 text-[11px] font-medium">
                            Paid
                          </span>
                        )}
                      </Td>
                      <Td className="text-right tabular-nums">{money(p.total, inv.currency)}</Td>
                      <Td className="text-right tabular-nums">{money(p.paid, inv.currency)}</Td>
                      <Td className={cn("text-right tabular-nums", Number(p.due) > 0 ? "text-rose-700 font-medium" : "text-gray-900")}>
                        {money(p.due, inv.currency)}
                      </Td>
                      <Td className="text-right">
                        <ProjectServicesModal project={p} currency={inv.currency} />
                      </Td>
                    </tr>
                  ))}
                  {!projects.length && (
                    <tr>
                      <Td colSpan={5} className="text-gray-500 py-6">No projects detected for this client.</Td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Section>
        )}

        {/* Items */}
        <Section title="Items">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <Th>Description</Th>
                  <Th className="text-right">Qty</Th>
                  <Th className="text-right">Unit Price</Th>
                  <Th className="text-right">Total</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(inv.items || []).map((it, i) => (
                  <tr key={i} className="bg-white">
                    <Td className="align-top">
                      <div className="font-medium text-gray-900">{it.description}</div>
                    </Td>
                    <Td className="text-right tabular-nums">{Number(it.qty || 0)}</Td>
                    <Td className="text-right tabular-nums">{money(it.unitPrice, inv.currency)}</Td>
                    <Td className="text-right tabular-nums">{money(it.total, inv.currency)}</Td>
                  </tr>
                ))}
                {(inv.items || []).length === 0 && (
                  <tr>
                    <Td colSpan={4} className="text-gray-500 py-6">No items.</Td>
                  </tr>
                )}
              </tbody>
              <tfoot className="bg-white">
                <tr>
                  <Td colSpan={3} className="text-right text-gray-600">Subtotal</Td>
                  <Td className="text-right font-medium tabular-nums">{money(inv.subtotal, inv.currency)}</Td>
                </tr>
                {Number(inv.taxPct || 0) > 0 && (
                  <tr>
                    <Td colSpan={3} className="text-right text-gray-600">Tax ({Number(inv.taxPct)}%)</Td>
                    <Td className="text-right font-medium tabular-nums">{money(inv.tax, inv.currency)}</Td>
                  </tr>
                )}
                <tr>
                  <Td colSpan={3} className="text-right text-gray-900">Total</Td>
                  <Td className="text-right font-semibold tabular-nums">{money(inv.total, inv.currency)}</Td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Section>

        {/* Payments */}
        <Section title="Payments">
          {payments.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <Th>Date</Th>
                    {isClientInvoice && <Th>Project</Th>}
                    <Th className="text-right">Amount</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {payments.map((p, i) => {
                    const projectName =
                      p.projectName ||
                      (p.projectId && (projects.find(x => String(x.projectId) === String(p.projectId))?.name)) ||
                      (p.splitEvenly ? "Split across projects" : "—");
                    return (
                      <tr key={i} className="bg-white">
                        <Td>{p.dateISO}</Td>
                        {isClientInvoice && <Td>{projectName}</Td>}
                        <Td className="text-right tabular-nums">{money(p.amount, inv.currency)}</Td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-4 py-8 text-sm text-gray-600">No payments recorded yet.</div>
          )}
        </Section>

        {/* PDF Preview */}
        <Section title="Invoice PDF">
          <div className="p-4">
            <object
              data={inv.pdfUrl}
              type="application/pdf"
              className="w-full rounded-lg"
              style={{ height: "78vh" }}
            >
              <p className="text-sm text-gray-600">
                PDF preview not supported in this browser.
                <a href={inv.pdfUrl} target="_blank" className="text-emerald-700 underline ml-1">Open in new tab</a>.
              </p>
            </object>
          </div>
        </Section>
      </div>
    </main>
  );
}

/* ---------- small UI helpers ---------- */
function money(n, cur) {
  const sym = cur || "৳";
  const v = Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${sym} ${v}`;
}
function formatDate(d) {
  try {
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return "—";
    return dt.toISOString().slice(0, 10);
  } catch {
    return "—";
  }
}
function StatusBadge({ status }) {
  const s = String(status || "").toLowerCase();
  const cls =
    s === "paid"
      ? "bg-green-100 text-green-800"
      : s === "overdue"
      ? "bg-rose-100 text-rose-800"
      : "bg-amber-100 text-amber-800";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {status || "Created"}
    </span>
  );
}
function Metric({ label, value, highlight = false }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="text-xs text-gray-500">{label}</div>
      <div className={`mt-1 text-xl ${highlight ? "font-semibold text-rose-700" : "font-semibold text-gray-900"}`}>
        {value}
      </div>
    </div>
  );
}
function Panel({ title, children }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="px-4 py-3 border-b text-sm font-semibold text-gray-700 bg-gray-50 rounded-t-xl">{title}</div>
      <div className="p-4">{children}</div>
    </div>
  );
}
function KeyValue({ label, children }) {
  return (
    <div className="py-2">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="mt-0.5 text-sm text-gray-900">{children || "—"}</div>
    </div>
  );
}
function Section({ title, children }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden mb-6 shadow-sm">
      <div className="px-4 py-3 border-b text-sm font-semibold text-gray-700 bg-gray-50">{title}</div>
      {children}
    </div>
  );
}
function Th({ children, className = "" }) {
  return (
    <th className={`px-4 py-2 text-left text-xs font-semibold text-gray-600 ${className}`}>
      {children}
    </th>
  );
}
function Td({ children, className = "", colSpan }) {
  return (
    <td colSpan={colSpan} className={`px-4 py-2 align-top text-sm text-gray-900 ${className}`}>
      {children}
    </td>
  );
}
