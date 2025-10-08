// components/InvoiceCreateModal.jsx
"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { X, Search, FilePlus2, Users2, Loader2 } from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { createInvoice, listProjectsLight, listClientsWithProjectCounts } from "@/lib/requests";

/* ---------------- helpers ---------------- */
const displayClientName = (c) =>
  (c?.companyName || c?.clientName || c?.name || c?.email || "Client").trim();

const useFilter = (list, q, keyPicker) => {
  const query = q.toLowerCase();
  return useMemo(() => {
    if (!query) return list;
    return list.filter((x) => (keyPicker(x) || "").toLowerCase().includes(query));
  }, [list, query, keyPicker]);
};

const projectClientDisplay = (p) =>
  p?.clientName ||
  p?.client ||
  p?.clientDoc?.companyName ||
  p?.clientDoc?.clientName ||
  p?.clientCompany ||
  "—";

const hasClientLabel = (p) => Boolean(projectClientDisplay(p) && projectClientDisplay(p) !== "—");

/* ---------------- UI Components ---------------- */
const TabButton = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 text-sm font-medium rounded-2xl transition-all duration-200 ${
      active
        ? "bg-emerald-600 text-white shadow-md"
        : "text-gray-700 hover:bg-gray-100 active:bg-gray-200"
    }`}
  >
    {children}
  </button>
);

const SearchBox = ({ value, onChange, placeholder, inputRef }) => (
  <div className="relative w-full">
    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
    <input
      ref={inputRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-2xl border border-gray-300 pl-9 pr-3 py-2 text-sm bg-white/90 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
    />
  </div>
);

/* ---------------- Virtualized List ---------------- */
const VirtualList = ({ rows, loading, estimate = 52, columns, renderRow }) => {
  const parentRef = useRef(null);
  const estimateSize = useCallback(() => estimate, [estimate]);
  const v = useVirtualizer({
    count: loading ? 12 : rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize,
    overscan: 12,
  });

  return (
    <div
      ref={parentRef}
      className="flex-1 overflow-y-auto overflow-x-hidden rounded-2xl border bg-white shadow-sm ring-1 ring-gray-100 min-h-0 isolate"
    >
      <div className="sticky top-0 bg-gray-50 border-b text-[11px] font-semibold text-gray-600 uppercase tracking-wider grid grid-cols-12 px-4 py-2 rounded-t-2xl">
        {columns.map((c, i) => (
          <div key={i} className={c.class}>{c.label}</div>
        ))}
      </div>

      <div style={{ height: v.getTotalSize(), position: "relative" }}>
        {v.getVirtualItems().map((item) => (
          <div
            key={item.key}
            ref={v.measureElement}
            className="absolute left-0 right-0 px-4 transition-all"
            style={{ transform: `translateY(${item.start}px)` }}
          >
            {loading ? (
              <div className="grid grid-cols-12 gap-2 py-3 animate-pulse">
                <div className="col-span-6 h-4 bg-gray-100 rounded" />
                <div className="col-span-3 h-4 bg-gray-100 rounded" />
                <div className="col-span-3 h-4 bg-gray-100 rounded ml-auto" />
              </div>
            ) : (
              renderRow(rows[item.index])
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

/* ---------------- Main Component ---------------- */
export default function InvoiceCreateModal({ onClose, onCreated }) {
  const [tab, setTab] = useState("project");
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [qProject, setQProject] = useState("");
  const [qClient, setQClient] = useState("");
  const [loading, setLoading] = useState(true);
  const [creatingProjectId, setCreatingProjectId] = useState(null);
  const [creatingClientId, setCreatingClientId] = useState(null);
  const projectRef = useRef(null);
  const clientRef = useRef(null);

  const filteredProjects = useFilter(projects, qProject, (p) => `${p.name} ${p.id} ${projectClientDisplay(p)}`);
  const filteredClients = useFilter(clients, qClient, (c) => displayClientName(c));

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [p, c] = await Promise.all([listProjectsLight(), listClientsWithProjectCounts()]);
        let proj = Array.isArray(p) ? p : [];
        const cli = Array.isArray(c) ? c : [];
        if (proj.every((r) => !hasClientLabel(r))) {
          const res = await fetch(`/api/projects/list?perPage=500`, { cache: "no-store" });
          if (res.ok) {
            const js = await res.json();
            proj = js.rows ?? proj;
          }
        }
        setProjects(proj);
        setClients(cli);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function createFromProject(p) {
    const id = p?.id ?? p?._id;
    if (!id) return alert("Missing project ID");
    setCreatingProjectId(id);
    try {
      const inv = await createInvoice({ source: "project", sourceId: id });
      onCreated?.(inv);
    } finally {
      setCreatingProjectId(null);
    }
  }

  async function createFromClient(c) {
    const id = c?._id ?? c?.id;
    if (!id) return alert("Missing client ID");
    setCreatingClientId(id);
    try {
      const inv = await createInvoice({ source: "client", sourceId: id });
      onCreated?.(inv);
    } finally {
      setCreatingClientId(null);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-3 sm:p-6"
      onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div className="w-full sm:max-w-6xl sm:max-h-[88vh] bg-white rounded-3xl shadow-[0_4px_16px_rgba(0,0,0,0.08)] border border-gray-100 flex flex-col overflow-hidden">
        {/* header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-emerald-50 to-white border-b">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 flex items-center justify-center bg-emerald-100 text-emerald-700 rounded-2xl">
              <FilePlus2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Create Invoice</h3>
              <p className="text-xs text-gray-500">Select a project or client to generate an invoice</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* tabs */}
        <div className="flex justify-center py-3 border-b bg-white sticky top-0 z-10">
          <div className="flex gap-2 rounded-2xl border border-gray-200 bg-white p-1">
            <TabButton active={tab === "project"} onClick={() => setTab("project")}>From Project</TabButton>
            <TabButton active={tab === "client"} onClick={() => setTab("client")}>From Client</TabButton>
          </div>
        </div>

        {/* body */}
        <div className="p-6 flex-1 min-h-0 grid md:grid-cols-2 gap-6 overflow-hidden">
          {/* Project side */}
          {(tab === "project" || typeof window !== "undefined" && window.innerWidth >= 768) && (
            <div className="flex flex-col min-h-0">
              <SearchBox value={qProject} onChange={setQProject} placeholder="Search projects…" inputRef={projectRef} />
              <div className="h-4" />
              <VirtualList
                rows={filteredProjects}
                loading={loading}
                columns={[
                  { label: "Name", class: "col-span-6" },
                  { label: "Client", class: "col-span-3" },
                  { label: "Action", class: "col-span-3 text-right" },
                ]}
                renderRow={(p) => {
                  const pid = p?.id ?? p?._id;
                  return (
                    <div className="grid grid-cols-12 gap-2 py-3 border-b last:border-none hover:bg-gray-50/80 transition rounded-lg">
                      <div className="col-span-6">
                        <p className="font-medium text-gray-900 truncate">{p?.name || "Untitled"}</p>
                        <p className="text-xs text-gray-500">#{p?.id}</p>
                      </div>
                      <div className="col-span-3 text-gray-700 truncate">{projectClientDisplay(p)}</div>
                      <div className="col-span-3 text-right">
                        <button
                          onClick={() => createFromProject(p)}
                          disabled={creatingProjectId === pid}
                          className="px-3 py-1.5 text-xs rounded-xl border border-gray-300 bg-white hover:bg-gray-100 transition disabled:opacity-60"
                        >
                          {creatingProjectId === pid ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin mx-auto" />
                          ) : (
                            "Create"
                          )}
                        </button>
                      </div>
                    </div>
                  );
                }}
              />
            </div>
          )}

          {/* Client side */}
          {(tab === "client" || typeof window !== "undefined" && window.innerWidth >= 768) && (
            <div className="flex flex-col min-h-0">
              <SearchBox value={qClient} onChange={setQClient} placeholder="Search clients…" inputRef={clientRef} />
              <div className="h-4" />
              <VirtualList
                rows={filteredClients}
                loading={loading}
                columns={[
                  { label: "Client", class: "col-span-6" },
                  { label: "# Projects", class: "col-span-3" },
                  { label: "Action", class: "col-span-3 text-right" },
                ]}
                renderRow={(c) => {
                  const cid = c?._id ?? c?.id;
                  return (
                    <div className="grid grid-cols-12 gap-2 py-3 border-b last:border-none hover:bg-gray-50/80 transition rounded-lg">
                      <div className="col-span-6">
                        <p className="font-medium text-gray-900 truncate">{displayClientName(c)}</p>
                        <p className="text-xs text-gray-500 truncate">{c?.email}</p>
                      </div>
                      <div className="col-span-3 text-gray-700">{c?.projectCount ?? "—"}</div>
                      <div className="col-span-3 text-right">
                        <button
                          onClick={() => createFromClient(c)}
                          disabled={creatingClientId === cid}
                          className="px-3 py-1.5 text-xs rounded-xl border border-gray-300 bg-white hover:bg-gray-100 transition disabled:opacity-60"
                        >
                          {creatingClientId === cid ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin mx-auto" />
                          ) : (
                            "Create"
                          )}
                        </button>
                      </div>
                    </div>
                  );
                }}
              />
            </div>
          )}
        </div>

        {/* footer */}
        <div className="border-t bg-white py-3 px-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm rounded-xl border hover:bg-gray-50 focus:ring-2 focus:ring-emerald-500 transition"
          >
            Close
          </button>
        </div>
      </div>

      <style jsx global>{`
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.25); }
      `}</style>
    </div>
  );
}
