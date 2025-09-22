"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import {
  Search, ChevronDown, ChevronUp, SlidersHorizontal, MoreVertical,
} from "lucide-react";
import { getStatusColor, initialsOf, normalizeId, palette } from "@/lib/projects-utils";

/**
 * Props:
 *  - data: Project[]
 *  - onDeleted?: (id: string) => void
 */
export default function TableProject({ data = [], onDeleted }) {
  const [sortOrder, setSortOrder] = useState("desc");
  const SortIcon = sortOrder === "desc" ? ChevronDown : ChevronUp;

  const toggleSortOrder = () => setSortOrder((v) => (v === "desc" ? "asc" : "desc"));

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
          {/* Column sizing prevents width blowout */}
          <colgroup>
            <col className="w-[120px]" />     {/* Project ID */}
            <col className="w-[24%]" />       {/* Project Name */}
            <col className="w-[20%]" />       {/* Client */}
            <col className="sm:w-[18%]" />    {/* Assigned to (hidden <sm>) */}
            <col className="w-[14%]" />       {/* Status */}
            <col className="md:w-[14%]" />    {/* Due Date (hidden <md>) */}
            <col className="lg:w-[12%]" />    {/* Amount (hidden <lg>) */}
            <col className="w-[64px]" />      {/* Actions */}
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
                return (
                  <tr key={key} className="hover:bg-gray-50 transition-colors">
                    {/* ONLY Project ID navigates; allow breaking long IDs */}
                    <Td>
                      <Link
                        href={`/projects/${encodeURIComponent(row.id)}`}
                        className="text-green-700 hover:underline font-medium break-all"
                      >
                        {row.id}
                      </Link>
                    </Td>

                    {/* Wrap long values; never push width */}
                    <Td>{row.name}</Td>
                    <Td>{row.client}</Td>

                    {/* Assigned to: wrap avatars */}
                    <Td className="hidden sm:table-cell align-top">
                      <div className="flex flex-wrap gap-1">
                        {(row.assignedTo ?? []).map((u) => {
                          const id = normalizeId(u);
                          const init = initialsOf(u.name);
                          const color = palette[Math.abs((id?.charCodeAt?.(0) || 0)) % palette.length];
                          return (
                            <div
                              key={id}
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${color}`}
                              title={u.name}
                            >
                              {init}
                            </div>
                          );
                        })}
                      </div>
                    </Td>

                    {/* STATUS — force single line */}
                    <Td noWrap className="align-top">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(row.status)} whitespace-nowrap`}
                      >
                        {row.status}
                      </span>
                    </Td>

                    <Td className="hidden md:table-cell text-gray-500 align-top">{row.dueDate}</Td>
                    <Td className="hidden lg:table-cell align-top">
                      {Number(row.totalAmount || 0).toFixed(2)}
                    </Td>

                    {/* Actions */}
                    <ActionsCell
                      rowKey={key}
                      row={row}
                      onDelete={() => handleDelete(row)}
                    />
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

/* ------------------------- Actions cell ------------------------- */
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

/* ----------------------------- Small helpers ----------------------------- */
function Th({ children, className = "" }) {
  return (
    <th
      className={`px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider ${className}`}
    >
      <span className="block min-w-0 truncate">{children}</span>
    </th>
  );
}

function Td({ children, className = "", noWrap = false }) {
  const wrapClass = noWrap ? "whitespace-nowrap" : "whitespace-normal break-words hyphens-auto";
  return (
    <td className={`px-4 sm:px-6 py-4 align-top text-sm text-gray-900 ${className}`}>
      <div className={`min-w-0 ${wrapClass}`}>
        {children}
      </div>
    </td>
  );
}
