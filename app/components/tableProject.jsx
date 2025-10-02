"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { Search, ChevronDown, ChevronUp, SlidersHorizontal, MoreVertical } from "lucide-react";
import { getStatusColor, initialsOf, normalizeId, palette } from "@/lib/projects-utils";

/** Robust, ID-or-string tolerant table — pure JS (.jsx) */
export default function TableProject({ data = [], onDeleted }) {
  const [sortOrder, setSortOrder] = useState("desc");
  const SortIcon = sortOrder === "desc" ? ChevronDown : ChevronUp;
  const toggleSortOrder = () => setSortOrder((v) => (v === "desc" ? "asc" : "desc"));

  // Caches for optional ID->object lookups (plain JS objects)
  const [clientMap, setClientMap] = useState({});
  const [userMap, setUserMap] = useState({});

  /** Collect only the IDs we truly need to resolve (when no name string is present) */
  const needs = useMemo(() => {
    const clientIds = new Set();
    const userIds = new Set();

    for (const row of data) {
      // CLIENT: only add clientId if we don't already have a name string on the row
      const clientNameString =
        (typeof row?.client === "string" && row.client) ||
        (row?.client && typeof row.client === "object" && row.client.name) ||
        row?.clientName;

      const clientId =
        (row?.clientId && String(row.clientId)) ||
        (row?.client && typeof row.client === "object" && (row.client._id || row.client.id));

      if (!clientNameString && clientId) clientIds.add(String(clientId));

      // USERS: prefer assignedTo objects; otherwise collect IDs from assignedUserIds
      const assignedTo = Array.isArray(row?.assignedTo) ? row.assignedTo : [];
      const alreadyHaveObjects = assignedTo.some((u) => typeof u === "object" && (u?.name || u?.email));

      if (!alreadyHaveObjects) {
        const ids = Array.isArray(row?.assignedUserIds) ? row.assignedUserIds : [];
        for (const raw of ids) {
          const id = String(
            typeof raw === "object" ? (raw?._id || raw?.id || "") : raw || ""
          ).trim();
          if (id) userIds.add(id);
        }
      }
    }

    return {
      clientIdsNeeded: Array.from(clientIds),
      userIdsNeeded: Array.from(userIds),
    };
  }, [data]);

  /** OPTIONAL: resolve clients only if we *only* have clientId but no client/clientName */
  useEffect(() => {
    let aborted = false;
    async function go() {
      if (needs.clientIdsNeeded.length === 0) return;

      // If /api/clients/lookup exists, this enriches names when only clientId was sent.
      // If it doesn't exist, client/clientName will still show when present; otherwise "—".
      try {
        const res = await fetch(`/api/clients/lookup?ids=${encodeURIComponent(needs.clientIdsNeeded.join(","))}`);
        if (aborted) return;
        if (res.ok) {
          const json = await res.json();
          const map = {};
          for (const c of json?.clients || []) {
            const id = String(c?._id || c?.id || "");
            const name = String(c?.name || c?.companyName || c?.clientName || id);
            if (id) map[id] = { id, name };
          }
          setClientMap((m) => ({ ...m, ...map }));
        }
      } catch {
        // ignore — we'll just display "—" if there's truly no name
      }
    }
    go();
    return () => { aborted = true; };
  }, [needs.clientIdsNeeded.join(",")]);

  /** Resolve users when the row only has assignedUserIds (no objects) */
  useEffect(() => {
    let aborted = false;
    async function go() {
      if (needs.userIdsNeeded.length === 0) return;
      try {
        const res = await fetch("/api/users/list");
        if (aborted) return;
        if (res.ok) {
          const json = await res.json();
          const index = {};
          for (const u of json || []) {
            const id = String(u?._id || u?.id || "");
            if (!id) continue;
            index[id] = {
              id,
              name: u?.name || u?.fullName || u?.email || id,
              email: u?.email || "",
              avatarUrl: u?.avatarUrl || undefined,
            };
          }
          const filtered = {};
          for (const id of needs.userIdsNeeded) if (index[id]) filtered[id] = index[id];
          setUserMap((m) => ({ ...m, ...filtered }));
        }
      } catch {
        // ignore; we’ll fallback to IDs/initials
      }
    }
    go();
    return () => { aborted = true; };
  }, [needs.userIdsNeeded.join(",")]);

  /** Client display resolver: prefer strings; fallback to clientId lookup */
  const clientDisplayOf = (row) => {
    if (!row) return "—";
    if (typeof row.client === "string" && row.client.trim()) return row.client.trim();
    if (row.client && typeof row.client === "object" && row.client.name) return String(row.client.name);
    if (row.clientName) return String(row.clientName);
    const cid = row.clientId ? String(row.clientId) : (row.client && (row.client._id || row.client.id));
    if (cid && clientMap[cid]?.name) return clientMap[cid].name;
    return "—";
  };

  /** Assigned array for rendering bubbles: prefer objects; otherwise map IDs via userMap */
  const assignedArrayOf = (row) => {
    const list = Array.isArray(row?.assignedTo) ? row.assignedTo : [];
    const hasObjects = list.length && list.every((u) => typeof u === "object");

    if (hasObjects) {
      return list.map((u, idx) => {
        const id = String(u?._id || u?.id || `${row?.id || "row"}-u-${idx}`);
        const name = String(u?.name || u?.fullName || u?.email || userMap[id]?.name || id);
        const avatarUrl = u?.avatarUrl || userMap[id]?.avatarUrl || undefined;
        return { id, name, avatarUrl };
      });
    }

    const ids = Array.isArray(row?.assignedUserIds) ? row.assignedUserIds : [];
    if (!ids.length) return [];
    return ids.map((raw, idx) => {
      const id = String(typeof raw === "object" ? (raw?._id || raw?.id || "") : raw || `${row?.id || "row"}-u-${idx}`);
      const name = userMap[id]?.name || id;
      const avatarUrl = userMap[id]?.avatarUrl || undefined;
      return { id, name, avatarUrl };
    });
  };

  async function handleDelete(row) {
    const id = row?.id;
    if (!id) return;
    const ok = window.confirm(`Delete project "${row.name || id}"? This cannot be undone.`);
    if (!ok) return;
    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(id)}`, { method: "DELETE" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Failed to delete");
      onDeleted?.(id);
    } catch (err) {
      console.error("Delete project error:", err);
      alert("Failed to delete the project.");
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      {/* Filters */}
      <div className="p-4 sm:p-6 border-b border-gray-200">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-xl">
            <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search projects..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 sm:text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleSortOrder}
              className="flex items-center justify-center gap-2 bg-white text-gray-700 border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium hover:bg-gray-100 transition-colors"
            >
              Sort by <SortIcon className="h-4 w-4" />
            </button>
            <button className="flex items-center justify-center gap-2 bg-white text-gray-700 border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium hover:bg-gray-100 transition-colors">
              <SlidersHorizontal className="h-4 w-4" />
              All
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full table-fixed divide-y divide-gray-200">
          <colgroup>
            <col className="w-[120px]" />
            <col className="w-[24%]" />
            <col className="w-[20%]" />
            <col className="sm:w-[18%]" />
            <col className="w-[14%]" />
            <col className="md:w-[14%]" />
            <col className="lg:w-[12%]" />
            <col className="w-[64px]" />
          </colgroup>

          <thead className="bg-gray-50">
            <tr>
              <Th>Project ID</Th>
              <Th>Project Name</Th>
              <Th>Client</Th>
              <Th className="hidden sm:table-cell">Assigned to</Th>
              <Th>Status</Th>
              <Th className="hidden md:table-cell">Due Date</Th>
              <Th className="hidden lg:table-cell">Amount</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {data.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-12 text-center text-gray-500 text-sm">
                  No projects found.
                </td>
              </tr>
            ) : (
              data.map((row, i) => {
                const key = row.id ?? i;
                const clientDisplay = clientDisplayOf(row);
                const assignedArray = assignedArrayOf(row);

                return (
                  <tr key={key} className="hover:bg-gray-50 transition-colors">
                    {/* Project ID */}
                    <Td>
                      <Link
                        href={`/projects/${encodeURIComponent(row.id)}`}
                        className="text-green-700 hover:underline font-medium break-all"
                      >
                        {row.id}
                      </Link>
                    </Td>

                    <Td>{row.name || "-"}</Td>
                    <Td>{clientDisplay}</Td>

                    {/* Assigned to */}
                    <Td className="hidden sm:table-cell align-top">
                      <div className="flex flex-wrap gap-1">
                        {assignedArray.length === 0 ? (
                          <span className="text-gray-400 text-xs">—</span>
                        ) : (
                          assignedArray.map((u, idx) => {
                            const id = normalizeId(u.id) || `${key}-u-${idx}`;
                            const init = (u.name && initialsOf(u.name)) || "U";
                            const color = palette[Math.abs((id?.charCodeAt?.(0) || 0)) % palette.length] || "bg-gray-400";
                            return (
                              <div
                                key={id}
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${color}`}
                                title={u.name || u.id}
                              >
                                {init}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </Td>

                    {/* Status */}
                    <Td noWrap className="align-top">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(row.status)} whitespace-nowrap`}>
                        {row.status || "—"}
                      </span>
                    </Td>

                    <Td className="hidden md:table-cell text-gray-500 align-top">{row.dueDate || "—"}</Td>
                    <Td className="hidden lg:table-cell align-top">
                      {Number(row.totalAmount || 0).toFixed(2)}
                    </Td>

                    <ActionsCell rowKey={key} row={row} onDelete={() => handleDelete(row)} />
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ActionsCell({ rowKey, row, onDelete }) {
  const btnRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0, w: 0 });

  const calcCoords = () => {
    const el = btnRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setCoords({ x: r.left, y: r.bottom + 6, w: r.width });
  };

  useLayoutEffect(() => { if (open) calcCoords(); }, [open]);

  useEffect(() => {
    if (!open) return;
    const onScroll = () => calcCoords();
    const onResize = () => calcCoords();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    const onDoc = (e) => {
      const btn = btnRef.current;
      if (!btn) return;
      const menu = document.getElementById(`menu-${rowKey}`);
      if (!menu) return;
      if (!btn.contains(e.target) && !menu.contains(e.target)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDoc);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDoc);
    };
  }, [open, rowKey]);

  return (
    <Td noWrap className="text-right">
      <button
        ref={btnRef}
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(v => !v); }}
        className="inline-flex items-center justify-center p-2 text-gray-500 hover:text-green-600 rounded-md hover:bg-gray-50 transition"
      >
        <MoreVertical className="h-5 w-5" />
      </button>

      {open && createPortal(
        <div
          id={`menu-${rowKey}`}
          role="menu"
          style={{
            position: "fixed",
            top: coords.y,
            left: Math.max(8, Math.min(coords.x - 180 + coords.w, window.innerWidth - 188)),
            zIndex: 50,
          }}
          className="w-44 rounded-xl border border-gray-200 bg-white p-1 shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            role="menuitem"
            onClick={() => { onDelete?.(); setOpen(false); }}
            className="w-full text-left px-3 py-2 text-sm rounded-md text-rose-600 hover:bg-rose-50"
          >
            Delete project
          </button>
        </div>,
        document.body
      )}
    </Td>
  );
}

function Th({ children, className = "" }) {
  return (
    <th className={`px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider ${className}`}>
      <span className="block min-w-0 truncate">{children}</span>
    </th>
  );
}

function Td({ children, className = "", noWrap = false }) {
  const wrapClass = noWrap ? "whitespace-nowrap" : "whitespace-normal break-words hyphens-auto";
  return (
    <td className={`px-4 sm:px-6 py-4 align-top text-sm text-gray-900 ${className}`}>
      <div className={`min-w-0 ${wrapClass}`}>{children}</div>
    </td>
  );
}
