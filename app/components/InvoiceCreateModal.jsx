// components/InvoiceCreateModal.jsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { createInvoice, listProjectsLight, listClientsWithProjectCounts } from "@/lib/requests";

function useFilter(list, q, keyPicker) {
  const query = (q || "").toLowerCase();
  return useMemo(() => {
    if (!query) return list;
    return list.filter((x) => (keyPicker(x) || "").toLowerCase().includes(query));
  }, [list, query, keyPicker]);
}

const displayClientName = (c) =>
  (c?.companyName || c?.clientName || c?.name || c?.email || "Client").trim();

export default function InvoiceCreateModal({ onClose, onCreated }) {
  const [tab, setTab] = useState("project"); // "project" | "client"

  // projects
  const [projects, setProjects] = useState([]);
  const [qProject, setQProject] = useState("");
  const filteredProjects = useFilter(projects, qProject, (p) => p.name || p.id || "");

  // clients
  const [clients, setClients] = useState([]);
  const [qClient, setQClient] = useState("");
  const filteredClients = useFilter(clients, qClient, (c) => displayClientName(c));

  // per-row spinners
  const [creatingProjectId, setCreatingProjectId] = useState(null);
  const [creatingClientId, setCreatingClientId] = useState(null);

  useEffect(() => {
    Promise.all([listProjectsLight(), listClientsWithProjectCounts()])
      .then(([p, c]) => {
        setProjects(Array.isArray(p) ? p : []);
        setClients(Array.isArray(c) ? c : []);
      })
      .catch((e) => console.error("Modal preload error:", e));
  }, []);

  async function createFromProject(p) {
    try {
      const id = String(p?.id ?? p?._id ?? "");
      if (!id) throw new Error("No project id");
      setCreatingProjectId(id);
      const inv = await createInvoice({ source: "project", sourceId: id });
      onCreated?.(inv);
    } catch (e) {
      alert(e.message || "Failed to create invoice.");
    } finally {
      setCreatingProjectId(null);
    }
  }

  async function createFromClient(c) {
    try {
      // Prefer _id if present (ObjectId stored by your Mongoose model)
      const id = String(c?._id ?? c?.id ?? "");
      if (!id) throw new Error("No client id");
      setCreatingClientId(id);
      const inv = await createInvoice({ source: "client", sourceId: id });
      onCreated?.(inv);
    } catch (e) {
      alert(e.message || "Failed to create invoice.");
    } finally {
      setCreatingClientId(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-5xl rounded-2xl bg-white shadow-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Create Invoice</h3>
          <button onClick={onClose} className="p-2 rounded-md hover:bg-gray-50 text-gray-500">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-5 pt-4">
          <div className="inline-flex rounded-lg border bg-white overflow-hidden">
            <button
              className={`px-3 py-2 text-sm font-medium ${tab === "project" ? "bg-green-600 text-white" : "text-gray-700 hover:bg-gray-50"}`}
              onClick={() => setTab("project")}
            >
              From Project
            </button>
            <button
              className={`px-3 py-2 text-sm font-medium ${tab === "client" ? "bg-green-600 text-white" : "text-gray-700 hover:bg-gray-50"}`}
              onClick={() => setTab("client")}
            >
              From Client
            </button>
          </div>
        </div>

        <div className="p-5">
          <div className="grid gap-4 md:grid-cols-2">
            {/* LEFT: Projects */}
            <div className="rounded-xl border border-gray-200 flex flex-col">
              <div className="p-3 border-b flex items-center gap-2">
                <input
                  value={qProject}
                  onChange={(e) => setQProject(e.target.value)}
                  placeholder="Search projects…"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              </div>
              {/* scroll container */}
              <div className="max-h-[360px] overflow-auto">
                <table className="min-w-full table-fixed text-sm">
                  <colgroup>
                    <col className="w-[48%]" />
                    <col className="w-[26%]" />
                    <col className="w-[26%]" />
                  </colgroup>
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <Th>Name</Th>
                      <Th>Client</Th>
                      <Th>Action</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredProjects.length === 0 ? (
                      <tr><td colSpan={3} className="px-4 py-6 text-center text-gray-500">No projects</td></tr>
                    ) : filteredProjects.map((p) => {
                      const pid = String(p?.id ?? p?._id ?? "");
                      return (
                        <tr key={pid} className="hover:bg-gray-50">
                          <Td className="whitespace-normal break-words hyphens-auto">{p.name || "Untitled"}</Td>
                          <Td className="whitespace-normal break-words hyphens-auto">
                            {p.clientName || p.client || "—"}
                          </Td>
                          <Td className="text-right">
                            <button
                              onClick={() => createFromProject(p)}
                              disabled={!pid || creatingProjectId === pid}
                              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              {creatingProjectId === pid ? "Creating…" : "Create"}
                            </button>
                          </Td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* RIGHT: Clients */}
            <div className="rounded-xl border border-gray-200 flex flex-col">
              <div className="p-3 border-b flex items-center gap-2">
                <input
                  value={qClient}
                  onChange={(e) => setQClient(e.target.value)}
                  placeholder="Search clients…"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              </div>
              {/* scroll container */}
              <div className="max-h-[360px] overflow-auto">
                <table className="min-w-full table-fixed text-sm">
                  <colgroup>
                    <col className="w-[58%]" />
                    <col className="w-[18%]" />
                    <col className="w-[24%]" />
                  </colgroup>
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <Th>Client</Th>
                      <Th># Projects</Th>
                      <Th className="text-right">Action</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredClients.length === 0 ? (
                      <tr><td colSpan={3} className="px-4 py-6 text-center text-gray-500">No clients</td></tr>
                    ) : filteredClients.map((c) => {
                      const cid = String(c?._id ?? c?.id ?? "");
                      return (
                        <tr key={cid} className="hover:bg-gray-50">
                          <Td className="whitespace-normal break-words hyphens-auto">
                            {displayClientName(c)}
                          </Td>
                          <Td>{c.projectCount ?? "—"}</Td>
                          <Td className="text-right">
                            <button
                              onClick={() => createFromClient(c)}
                              disabled={!cid || creatingClientId === cid}
                              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              {creatingClientId === cid ? "Creating…" : "Create"}
                            </button>
                          </Td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>

        <div className="px-5 pb-5">
          <div className="flex justify-end">
            <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border hover:bg-gray-50">Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* local table helpers */
function Th({ children, className = "" }) {
  return (
    <th className={`px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider ${className}`}>
      <span className="block truncate">{children}</span>
    </th>
  );
}
function Td({ children, className = "" }) {
  return (
    <td className={`px-3 py-2 align-top text-gray-900 ${className}`}>
      <div className="min-w-0 whitespace-normal break-words hyphens-auto">{children}</div>
    </td>
  );
}
