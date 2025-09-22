// app/lib/requests.js

/* ----------------------------- small helpers ----------------------------- */
function qs(obj = {}) {
  const sp = new URLSearchParams();
  Object.entries(obj).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    sp.set(k, String(v));
  });
  const s = sp.toString();
  return s ? `?${s}` : "";
}

async function fetchJSON(url, init) {
  const res = await fetch(url, init);
  let json = null;
  try { json = await res.json(); } catch { /* ignore */ }
  if (!res.ok) {
    throw new Error((json && json.error) || `HTTP ${res.status}`);
  }
  return json;
}

/* ----------------------------- invoices ----------------------------- */

/**
 * List invoices (for /app/invoices/page.jsx)
 * returns: { total, page, perPage, rows: [...] }
 */
export async function listInvoices({ q = "", page = 1, perPage = 20 } = {}) {
  return fetchJSON(`/api/invoices${qs({ q, page, perPage })}`, { cache: "no-store" });
}

/**
 * Create invoice (used by InvoiceCreateModal)
 * body: { source: "project"|"client", sourceId, taxPct?, items? }
 * returns: { _id, invoiceId, clientName, total, status, createdAt, pdfUrl }
 */
export async function createInvoice({ source, sourceId, taxPct = 0, items } = {}) {
  if (!source || !sourceId) {
    throw new Error("source and sourceId are required (client)");
  }
  const json = await fetchJSON(`/api/invoices`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ source, sourceId, taxPct, items }),
  });
  // API responds with { ok, invoice }
  return json.invoice;
}

/**
 * Delete invoice by DB _id (not invoiceId string)
 * returns: { ok: true, deletedCount }
 */
export async function deleteInvoice(id) {
  if (!id) throw new Error("id is required to delete invoice");
  return fetchJSON(`/api/invoices/${encodeURIComponent(id)}`, { method: "DELETE" });
}

/* ----------------------------- modal lists ----------------------------- */

/**
 * Lightweight projects list for the modal.
 * Expects your helper route at /api/projects?light=1
 * returns array of projects: [{ id/_id, name, clientName|client, totalAmount }]
 */
export async function listProjectsLight() {
  // If you’ve implemented /api/projects?light=1 (as in my previous message), this works:
  const json = await fetchJSON(`/api/projects${qs({ light: 1 })}`, { cache: "no-store" });
  // normalize return to array
  if (Array.isArray(json?.rows)) return json.rows;
  if (Array.isArray(json)) return json;
  return [];
}

/**
 * Clients with project counts for the modal.
 * Expects helper route at /api/clients/with-project-counts
 * returns array: [{ _id|id, name, projectCount }]
 */
export async function listClientsWithProjectCounts() {
  const json = await fetchJSON(`/api/clients/with-project-counts`, { cache: "no-store" });
  if (Array.isArray(json?.rows)) return json.rows;
  if (Array.isArray(json)) return json;
  return [];
}
