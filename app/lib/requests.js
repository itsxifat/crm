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
  try { json = await res.json(); } catch { }
  if (!res.ok) {
    throw new Error((json && json.error) || `HTTP ${res.status}`);
  }
  return json;
}

export async function listInvoices({ q = "", page = 1, perPage = 20 } = {}) {
  return fetchJSON(`/api/invoices${qs({ q, page, perPage })}`, { cache: "no-store" });
}

export async function createInvoice({ source, sourceId, taxPct = 0, items } = {}) {
  if (!source || !sourceId) {
    throw new Error("source and sourceId are required (client)");
  }
  const json = await fetchJSON(`/api/invoices`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ source, sourceId, taxPct, items }),
  });
  return json.invoice;
}

export async function deleteInvoice(id) {
  if (!id) throw new Error("id is required to delete invoice");
  return fetchJSON(`/api/invoices/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export async function getInvoice(id) {
  if (!id) throw new Error("id is required");
  return fetchJSON(`/api/invoices/${encodeURIComponent(id)}`, { cache: "no-store" });
}

export async function updateInvoice(id, payload) {
  if (!id) throw new Error("id is required");
  return fetchJSON(`/api/invoices/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload || {}),
  });
}

export async function listProjectsLight() {
  const json = await fetchJSON(`/api/projects${qs({ light: 1 })}`, { cache: "no-store" });
  if (Array.isArray(json?.rows)) return json.rows;
  if (Array.isArray(json)) return json;
  return [];
}

export async function listClientsWithProjectCounts() {
  const json = await fetchJSON(`/api/clients/with-project-counts`, { cache: "no-store" });
  if (Array.isArray(json?.rows)) return json.rows;
  if (Array.isArray(json)) return json;
  return [];
}