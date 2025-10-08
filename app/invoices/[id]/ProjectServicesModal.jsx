"use client";

import { useState } from "react";

export default function ProjectServicesModal({ project, currency }) {
  const [open, setOpen] = useState(false);

  const services = Array.isArray(project?.services) ? project.services : [];

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
      >
        View details
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[70] bg-black/30 backdrop-blur-[1px] flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="w-full max-w-2xl rounded-2xl bg-white border border-gray-200 shadow-xl">
            <div className="px-5 py-4 border-b flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-gray-900">{project?.name || "Project"}</div>
                <div className="text-xs text-gray-500 mt-0.5">
                  Total {fmtMoney(project?.total, currency)} • Paid {fmtMoney(project?.paid, currency)} • Due {fmtMoney(project?.due, currency)}
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-2 rounded-md hover:bg-gray-50 text-gray-500"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="p-5">
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
                    {services.length ? services.map((s, i) => (
                      <tr key={i} className="bg-white">
                        <Td>{s.description || "—"}</Td>
                        <Td className="text-right tabular-nums">{Number(s.unit || 0)}</Td>
                        <Td className="text-right tabular-nums">{fmtMoney(s.unitPrice, currency)}</Td>
                        <Td className="text-right tabular-nums">
                          {fmtMoney(s.totalPrice ?? (Number(s.unit||0) * Number(s.unitPrice||0)) ?? 0, currency)}
                        </Td>
                      </tr>
                    )) : (
                      <tr>
                        <Td colSpan={4} className="text-gray-500 py-6">No services found.</Td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="px-5 pb-5 flex justify-end">
              <button onClick={() => setOpen(false)} className="px-4 py-2 text-sm rounded-lg border hover:bg-gray-50">Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Th({ children, className = "" }) {
  return <th className={`px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider ${className}`}>{children}</th>;
}
function Td({ children, className = "", colSpan }) {
  return <td colSpan={colSpan} className={`px-3 py-2 align-top text-sm text-gray-900 ${className}`}>{children}</td>;
}
function fmtMoney(n, cur) {
  const sym = cur || "৳";
  const v = Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${sym} ${v}`;
}
