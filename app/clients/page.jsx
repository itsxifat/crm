"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const SearchIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8"/>
    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

function StatusBadge({ status }) {
  const map = {
    High: "bg-rose-100 text-rose-800",
    Medium: "bg-amber-100 text-amber-800",
    Normal: "bg-emerald-100 text-emerald-800",
  };
  return <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${map[status] || map.Normal}`}>{status}</span>;
}

export default function ClientsPage() {
  const [data, setData] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/clients/list?q=${encodeURIComponent(q)}`, { cache: "no-store" });
      const json = await res.json();
      setData(json?.rows || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);
  const filtered = useMemo(() => data, [data]); // API already filters

  return (
    <div className="bg-gray-50 min-h-screen font-sans text-gray-800">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Clients</h1>
            <p className="mt-1 text-sm text-gray-600">Manage your client directory.</p>
          </div>
          <div className="flex items-center gap-2">
            <a href="/clients/add" className="flex items-center justify-center gap-2 bg-green-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-green-700">
              Add Client
            </a>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                <SearchIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") load(); }}
                placeholder="Search by company, client name, email, phone..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 sm:text-sm"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-12 text-center text-gray-500">Loading...</div>
            ) : filtered.length === 0 ? (
              <div className="py-12 text-center text-gray-500">No clients found.</div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <Th>Company</Th>
                    <Th>Client</Th>
                    <Th className="hidden sm:table-cell">Email</Th>
                    <Th className="hidden md:table-cell">Phone</Th>
                    <Th className="hidden lg:table-cell">Priority</Th>
                    <Th className="text-right">Details</Th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filtered.map((c) => (
                    <tr key={c._id} className="hover:bg-gray-50">
                      <Td>{c.companyName || "—"}</Td>
                      <Td>{c.clientName || "—"}</Td>
                      <Td className="hidden sm:table-cell">{c.email}</Td>
                      <Td className="hidden md:table-cell">{c.phone}</Td>
                      <Td className="hidden lg:table-cell"><StatusBadge status={c.priority} /></Td>
                      <Td className="text-right">
                        <Link href={`/clients/${encodeURIComponent(c._id)}`} className="text-green-700 hover:underline">Open</Link>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function Th({ children, className = "" }) {
  return <th className={`px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider ${className}`}>{children}</th>;
}
function Td({ children, className = "" }) {
  return <td className={`px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${className}`}>{children}</td>;
}
