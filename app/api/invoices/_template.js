// app/api/invoices/_template.js
export function renderInvoiceHTML({
  logoUrl,
  dateISO,
  invoiceId,
  currency = "৳",
  // client (Invoice To)
  invoiceTo = { companyName: "", clientName: "", phone: "", address: "" },

  // classic items table (used for project invoices or fallback)
  items = [],

  // client-level: optional structured project list for summary & detail pages
  clientProjects = [], // [{ projectId, name, total, paid, due, services: [{ description, unit, unitPrice, totalPrice, offerPrice }] }]

  subtotal = 0,
  taxPct = 0,
  tax = 0,
  total = 0,
  notes = "",

  // payments (shown on last page)
  payments = [],
  paidTotal = 0,
  dueTotal = 0,
  status = "Created",

  // assets
  paidStampUrl = "",
}) {
  const isPaid =
    String(status).toLowerCase() === "paid" || Number(dueTotal) === 0;

  // rows for classic invoice items table
  const rowsHTML = (items || [])
    .map(
      (it) => `
      <tr>
        <td><div class="desc">${escapeHTML(it.description || "")}</div></td>
        <td class="tr">${Number(it.qty || 0)}</td>
        <td class="tr">${formatMoney(it.unitPrice, currency)}</td>
        <td class="tr strong">${formatMoney(it.total, currency)}</td>
      </tr>`
    )
    .join("");

  // payments table rows
  const paymentsHTML = (payments || [])
    .map(
      (p) => `
      <tr>
        <td class="pdate">${escapeHTML(p.dateISO || "")}</td>
        <td class="tr">${formatMoney(p.amount, currency)}</td>
      </tr>`
    )
    .join("");

  // page 1 — client-level summary of projects (if provided)
  const projectsSummaryHTML =
    Array.isArray(clientProjects) && clientProjects.length
      ? `
    <h3 class="section-title" style="margin-top:18px">PROJECTS (SUMMARY)</h3>
    <table class="table">
      <thead>
        <tr>
          <th>PROJECT</th>
          <th class="tr">QTY</th>
          <th class="tr">UNIT PRICE</th>
          <th class="tr">TOTAL</th>
        </tr>
      </thead>
      <tbody>
        ${clientProjects
          .map((p, idx) => {
            const qty = Array.isArray(p?.services) ? p.services.length || 1 : 1;
            // put unit price as empty for a clean look; total holds project total
            return `
              <tr>
                <td><div class="desc">${escapeHTML(
                  p?.name || `Project #${idx + 1}`
                )}</div></td>
                <td class="tr">${qty}</td>
                <td class="tr">—</td>
                <td class="tr strong">${formatMoney(
                  p?.total || 0,
                  currency
                )}</td>
              </tr>`;
          })
          .join("")}
      </tbody>
    </table>`
      : "";

  // per-project detail pages (after page 1)
  const projectsDetailHTML =
    Array.isArray(clientProjects) && clientProjects.length
      ? clientProjects
          .map((p, i) => {
            const services = Array.isArray(p?.services) ? p.services : [];
            const serviceRows = services.length
              ? services
                  .map(
                    (s) => `
              <tr>
                <td><div class="desc">${escapeHTML(
                  s.description || "Service"
                )}</div></td>
                <td class="tr">${Number(s.unit || 0)}</td>
                <td class="tr">${formatMoney(
                  s.unitPrice || s.offerPrice || 0,
                  currency
                )}</td>
                <td class="tr strong">${formatMoney(
                  s.totalPrice ??
                    s.offerPrice ??
                    Number(s.unit || 0) * Number(s.unitPrice || 0),
                  currency
                )}</td>
              </tr>`
                  )
                  .join("")
              : `<tr><td colspan="4">No service data.</td></tr>`;

            return `
          <div class="page-break"></div>
          <div class="proj-h">
            <div class="proj-title">${escapeHTML(
              p?.name || `Project #${i + 1}`
            )}</div>
            <div class="proj-meta">
              <span>Total: <b>${formatMoney(p?.total || 0, currency)}</b></span>
              <span>Paid: <b>${formatMoney(p?.paid || 0, currency)}</b></span>
              <span>Due: <b>${formatMoney(
                p?.due ?? Math.max(0, (p?.total || 0) - (p?.paid || 0)),
                currency
              )}</b></span>
            </div>
          </div>
          <table class="table">
            <thead>
              <tr>
                <th>DESCRIPTION</th>
                <th class="tr">QTY</th>
                <th class="tr">UNIT PRICE</th>
                <th class="tr">AMOUNT</th>
              </tr>
            </thead>
            <tbody>${serviceRows}</tbody>
          </table>`;
          })
          .join("")
      : "";

  // page N — all payments
  const paymentsPageHTML = paymentsHTML
    ? `
      <div class="page-break"></div>
      <h3 class="section-title" style="margin-top:0">PAYMENTS</h3>
      <table class="table">
        <thead><tr><th>DATE</th><th class="tr">AMOUNT</th></tr></thead>
        <tbody>${paymentsHTML}</tbody>
      </table>`
    : "";

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Invoice ${escapeHTML(invoiceId)}</title>
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
  /* Base */
  html,body { margin:0; padding:0; }
  body { font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif; font-size:13px; line-height:1.45; color:#111827; background:#fff; }
  .wrap { padding:32px 36px; }

  /* Header */
  .header { position:relative; display:flex; justify-content:space-between; align-items:flex-start; gap:24px; }
  .header-left { flex:1; min-width:240px; }
  .brand { display:flex; align-items:center; gap:12px; }
  .brand img { height:40px; width:auto; } /* a bit bigger */
  .company-meta { margin-top:8px; font-size:11.5px; color:#4B5563; }
  .company-meta .name { font-weight:600; color:#111827; }
  .company-meta .line { margin-top:2px; white-space:pre-wrap; }
  .company-meta a { color:#111827; text-decoration:none; border-bottom:1px solid #D1D5DB; }

  .header-right { flex:1; min-width:260px; text-align:right; }
  .invoice-title { font-size:36px; font-weight:700; color:#374151; margin:0 0 10px 0; letter-spacing:.2px; } /* gray tone */
  .invoice-details { border-collapse:collapse; width:100%; }
  .invoice-details td { padding:4px 0; font-size:12px; }
  .invoice-details .label { color:#6B7280; font-weight:500; }
  .invoice-details .value { font-weight:700; color:#111827; }

  /* Paid stamp image */
  .paid-stamp {
    position:absolute;
    right:8px;
    bottom:-14px;
    width:150px; /* slightly larger */
    opacity:0.9;
    transform: rotate(-11deg);
  }

  /* Sections */
  .section-title { margin-top:22px; font-size:11px; font-weight:700; color:#111827; letter-spacing:.06em; }
  .box { border:1px solid #E5E7EB; border-radius:10px; padding:10px; margin-top:6px; }
  .party { font-size:12.5px; color:#374151; line-height:1.5; }
  .party .name { font-weight:600; color:#111827; }

  /* Tables */
  .table { width:100%; border-collapse:collapse; margin-top:14px; table-layout:fixed; }
  .table th, .table td { border-bottom:1px solid #F3F4F6; padding:8px 10px; text-align:left; vertical-align:top; }
  .table th { background:#F9FAFB; font-weight:700; font-size:11px; text-transform:uppercase; color:#6B7280; }
  .table td { font-size:12px; }
  .tr { text-align:right; }

  /* Description (do not truncate; just smaller + dense line-height) */
  .desc { font-weight:600; font-size:12px; line-height:1.35; }

  /* Compact payment date text */
  .pdate { font-size:11.5px; color:#374151; }

  /* Summary */
  .summary-wrap { display:flex; justify-content:flex-end; margin-top:14px; }
  .summary { width:42%; max-width:360px; border-collapse:collapse; }
  .summary td { padding:6px 0; font-size:12.5px; }
  .summary .label { color:#6B7280; }
  .summary .row-top { border-top:2px solid #E5E7EB; }
  .summary .strong { font-weight:700; color:#111827; }

  /* Project detail header */
  .proj-h { margin:6px 0 4px 0; }
  .proj-title { font-size:16px; font-weight:700; color:#111827; }
  .proj-meta { margin-top:2px; font-size:12px; color:#374151; display:flex; gap:14px; flex-wrap:wrap; }

  /* Page breaks for PDF */
  .page-break { page-break-before: always; }

  /* Avoid splitting elements */
  table, tr, td, th { page-break-inside: avoid; }
  .box, .party, .summary-wrap { page-break-inside: avoid; }
</style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      <div class="header-left">
        <div class="brand">
          <img src="${logoUrl || ""}" alt="Logo"/>
        </div>
        <div class="company-meta">
          <div class="name">Enfinito</div>
          <div class="line">Address: Uttara 11/14, House 76/3, Dhaka, Bangladesh</div>
          <div class="line">Phone: +880 1540-110050</div>
          <div class="line">Email: info@enfinito.com </div>
          <div class="line"><a href="https://www.enfinito.com">www.enfinito.com</a></div>
        </div>
      </div>

      <div class="header-right">
        <div class="invoice-title">INVOICE</div>
        <table class="invoice-details" aria-label="Invoice details">
          <tr>
            <td class="label">Invoice #</td>
            <td class="value tr">${escapeHTML(invoiceId)}</td>
          </tr>
          <tr>
            <td class="label">Invoice Issued</td>
            <td class="value tr">${escapeHTML(dateISO)}</td>
          </tr>
        </table>
        ${
          isPaid && paidStampUrl
            ? `<img src="${paidStampUrl}" alt="PAID" class="paid-stamp" />`
            : ""
        }
      </div>
    </div>

    <!-- INVOICE TO (CLIENT INFO) -->
    <div class="section-title">INVOICE TO</div>
    <div class="box party">
      <div class="name">${escapeHTML(
        invoiceTo.companyName || invoiceTo.clientName || ""
      )}</div>
      ${
        invoiceTo.address
          ? `<div class="line">${escapeHTML(invoiceTo.address)}</div>`
          : ""
      }
      ${
        invoiceTo.phone
          ? `<div class="line">${escapeHTML(invoiceTo.phone)}</div>`
          : ""
      }
    </div>

    <!-- If clientProjects present, show projects summary on page 1; else classic items table -->
    ${
      Array.isArray(clientProjects) && clientProjects.length
        ? projectsSummaryHTML
        : `
        <table class="table" aria-label="Items">
          <thead>
            <tr>
              <th>DESCRIPTION</th>
              <th class="tr">QTY</th>
              <th class="tr">UNIT PRICE</th>
              <th class="tr">AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHTML || '<tr><td colspan="4">No items to display.</td></tr>'}
          </tbody>
        </table>`
    }

    <!-- SUMMARY -->
    <div class="summary-wrap">
      <table class="summary" aria-label="Summary">
        <tr>
          <td class="label">Subtotal</td>
          <td class="tr">${formatMoney(subtotal, currency)}</td>
        </tr>
        ${
          Number(tax > 0)
            ? `<tr><td class="label">Tax (${Number(
                taxPct
              )}%)</td><td class="tr">${formatMoney(tax, currency)}</td></tr>`
            : ""
        }
        <tr class="row-top">
          <td class="strong">Total</td>
          <td class="tr strong">${formatMoney(total, currency)}</td>
        </tr>
        <tr>
          <td class="label">Payments</td>
          <td class="tr">(${formatMoney(paidTotal, currency)})</td>
        </tr>
        <tr class="row-top">
          <td class="strong">Amount Due</td>
          <td class="tr strong">${formatMoney(dueTotal, currency)}</td>
        </tr>
      </table>
    </div>

    <!-- Project detail pages -->
    ${projectsDetailHTML}

    <!-- Payments page -->
    ${paymentsPageHTML}
  </div>
</body>
</html>`;
}

function escapeHTML(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function formatMoney(n, currency = "৳") {
  const amount = Number(n || 0);
  const space = currency === "$" ? "" : " ";
  return `${currency}${space}${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
