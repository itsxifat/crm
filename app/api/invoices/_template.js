export function renderInvoiceHTML({
  logoUrl,
  dateISO,
  invoiceId,
  currency = "৳",
  invoiceTo = { companyName: "", clientName: "" },
  billTo = { companyName: "", clientName: "", phone: "", address: "" },
  items = [],
  subtotal = 0,
  taxPct = 0,
  tax = 0,
  total = 0,
  notes = "",
}) {
  const rowsHTML = (items || []).map(
    (it) => `
      <tr>
        <td>${it.orderId || ""}</td>
        <td>${escapeHTML(it.description || "")}</td>
        <td class="tr">${Number(it.qty || 0)}</td>
        <td class="tr">${formatMoney(it.unitPrice, currency)}</td>
        <td class="tr">${formatMoney(it.total, currency)}</td>
      </tr>`
  ).join("");

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${invoiceId}</title>
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
  :root { --text:#111827; --muted:#6B7280; --line:#E5E7EB; --bg:#ffffff; --chip:#F3F4F6; }
  *{ box-sizing:border-box; }
  body{ margin:0; font:14px/1.45 Inter,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif; color:var(--text); background:#fff; }
  .wrap{ padding:24px; }
  .header{ display:flex; justify-content:space-between; gap:24px; }
  .brand{ display:flex; align-items:center; gap:12px; }
  .brand img{ height:42px; width:auto; }
  .h1{ font-weight:800; font-size:28px; letter-spacing:.2px; }
  .grid2{ display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-top:12px; }
  .card{ background:#fff; border:1px solid var(--line); border-radius:12px; padding:12px 14px; }
  .muted{ color:var(--muted); font-size:12px; }
  .strong{ font-weight:600; }
  .table{ width:100%; border-collapse:collapse; margin-top:16px; border:1px solid var(--line); table-layout:fixed; }
  .table thead th{ background:#F9FAFB; color:#374151; font-size:12px; text-align:left; padding:10px; border-bottom:1px solid var(--line); }
  .table tbody td{ padding:10px; border-bottom:1px solid var(--line); vertical-align:top; }
  .table tfoot td{ padding:10px; }
  .table colgroup col:nth-child(1){ width:16%; }
  .table colgroup col:nth-child(3){ width:10%; }
  .table colgroup col:nth-child(4){ width:15%; }
  .table colgroup col:nth-child(5){ width:16%; }
  .tr{ text-align:right; white-space:nowrap; }
  .summary{ width:100%; margin-top:12px; }
  .summary td{ padding:6px 0; }
  .note{ background:#F9FAFB; border:1px dashed var(--line); padding:12px; border-radius:8px; margin-top:16px; color:#374151; }
  .sig{ margin-top:32px; display:flex; justify-content:flex-end; }
  .sig .line{ width:200px; border-top:1px solid #111; text-align:center; padding-top:6px; font-size:12px; }
  .k{ color:#374151; font-size:12px; }
  .chip{ background:var(--chip); border:1px solid var(--line); padding:4px 8px; border-radius:999px; display:inline-block; font-size:12px; }
  .two-col { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
  @media (max-width: 720px){
    .grid2, .two-col { grid-template-columns:1fr; }
  }
  .addr { white-space:pre-wrap; }
  .nameBig { font-weight:700; }
</style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      <div class="brand">
        <img src="${logoUrl}" alt="Logo"/>
        <div class="h1">INVOICE</div>
      </div>
      <div class="card" style="min-width:220px">
        <div><span class="muted">DATE</span><div class="strong">${dateISO}</div></div>
        <div style="margin-top:8px"><span class="muted">INVOICE ID</span><div class="strong">${invoiceId}</div></div>
      </div>
    </div>

    <div class="two-col" style="margin-top:16px">
      <div class="card">
        <div class="muted">INVOICE TO</div>
        ${lineForParty(invoiceTo)}
      </div>
      <div class="card">
        <div class="muted">BILL TO</div>
        ${lineForParty(billTo)}
        ${billTo.phone ? `<div class="k" style="margin-top:6px">Phone: ${escapeHTML(billTo.phone)}</div>` : ""}
        ${billTo.address ? `<div class="k addr" style="margin-top:4px">${escapeHTML(billTo.address)}</div>` : ""}
      </div>
    </div>

    <table class="table">
      <colgroup><col/><col/><col/><col/><col/></colgroup>
      <thead>
        <tr>
          <th>ORDER ID</th>
          <th>DESCRIPTION</th>
          <th class="tr">QTY</th>
          <th class="tr">UNIT PRICE</th>
          <th class="tr">TOTAL</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHTML || `<tr><td></td><td>No items</td><td class="tr">0</td><td class="tr">${formatMoney(0,currency)}</td><td class="tr">${formatMoney(0,currency)}</td></tr>`}
      </tbody>
    </table>

    <div class="grid2" style="margin-top:10px">
      <div>
        <div class="note">
          <div class="strong" style="margin-bottom:6px">Note</div>
          <div class="k">${escapeHTML(notes || "")}</div>
        </div>
      </div>
      <div>
        <table class="summary">
          <tr>
            <td class="k">SUBTOTAL</td>
            <td class="tr strong">${formatMoney(subtotal, currency)}</td>
          </tr>
          ${Number(taxPct) ? `
          <tr>
            <td class="k">TAX (${Number(taxPct)}%)</td>
            <td class="tr strong">${formatMoney(tax, currency)}</td>
          </tr>` : ""}
          <tr>
            <td class="k">PAYABLE AMOUNT</td>
            <td class="tr strong">${formatMoney(total, currency)}</td>
          </tr>
        </table>
      </div>
    </div>

    <div class="sig">
      <div class="line">AUTHORIZED SIGN</div>
    </div>

    <div class="k" style="margin-top:16px">Thank you for your business.</div>
  </div>
</body>
</html>`;
}

function lineForParty(p = {}) {
  const company = escapeHTML(p.companyName || "");
  const client = escapeHTML(p.clientName || "");
  if (company && client) {
    return `<div class="nameBig" style="margin-top:6px">${company}</div>
            <div class="k" style="margin-top:2px">${client}</div>`;
  }
  return `<div class="nameBig" style="margin-top:6px">${company || client || ""}</div>`;
}

function escapeHTML(str) {
  return String(str || "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function formatMoney(n, currency = "৳") {
  const amount = Number(n || 0);
  return `${currency} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
