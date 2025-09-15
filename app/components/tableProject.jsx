"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search, ChevronDown, ChevronUp, SlidersHorizontal, MoreVertical,
} from "lucide-react";
import { getStatusColor, initialsOf, normalizeId, palette } from "@/lib/projects-utils";

export default function TableProject({ data = [], onEdit, onRowClick }) {
  const [sortOrder, setSortOrder] = useState("desc");
  const toggleSortOrder = () => setSortOrder((v) => (v === "desc" ? "asc" : "desc"));
  const SortIcon = sortOrder === "desc" ? ChevronDown : ChevronUp;

  // NOTE: wire your sorting against data here if you want actual sorting

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
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <Th>Project ID</Th>
              <Th>Project Name</Th>
              <Th>Client</Th>
              <Th className="hidden sm:table-cell">Assigned to</Th>
              <Th>Status</Th>
              <Th className="hidden md:table-cell">Start</Th>
              <Th className="hidden md:table-cell">Due</Th>
              <Th className="hidden lg:table-cell">Amount</Th>
              <Th className="hidden lg:table-cell">Cost</Th>
              <Th className="hidden xl:table-cell">Profit</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-6 py-12 text-center text-gray-500 text-sm">
                  No projects found.
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr
                  key={row.id || i}
                  onClick={() => row.id && onRowClick?.(row.id)}
                  className="cursor-pointer hover:bg-gray-50 transition-colors"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter') onRowClick?.(row.id); }}
                >
                  <Td>
                    <Link
                      href={`/projects/${encodeURIComponent(row.id)}`}
                      className="text-green-700 hover:underline font-medium"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {row.id}
                    </Link>
                  </Td>
                  <Td>{row.name}</Td>
                  <Td>{row.client}</Td>
                  <Td className="hidden sm:table-cell">
                    <div className="flex -space-x-2 overflow-hidden">
                      {(row.assignedTo ?? []).map((u) => {
                        const id = normalizeId(u);
                        const init = initialsOf(u.name);
                        const color = palette[Math.abs((id?.charCodeAt?.(0) || 0)) % palette.length];
                        return (
                          <div
                            key={id}
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ring-2 ring-white ${color}`}
                            title={u.name}
                          >
                            {init}
                          </div>
                        );
                      })}
                    </div>
                  </Td>
                  <Td>
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(row.status)}`}>
                      {row.status}
                    </span>
                  </Td>
                  <Td className="hidden md:table-cell text-gray-500">{row.startDate}</Td>
                  <Td className="hidden md:table-cell text-gray-500">{row.dueDate}</Td>
                  <Td className="hidden lg:table-cell">{Number(row.totalAmount || 0).toFixed(2)}</Td>
                  <Td className="hidden lg:table-cell">{Number(row.totalCost || 0).toFixed(2)}</Td>
                  <Td className="hidden xl:table-cell">{Number(row.profit || 0).toFixed(2)}</Td>
                  <Td className="text-right">
                    <button
                      onClick={(e) => { e.stopPropagation(); onEdit?.(row); }}
                      className="text-gray-500 hover:text-green-600 transition"
                      aria-label={`Edit ${row.name}`}
                    >
                      <MoreVertical className="h-5 w-5" />
                    </button>
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children, className = "" }) {
  return (
    <th className={`px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider ${className}`}>
      {children}
    </th>
  );
}

function Td({ children, className = "" }) {
  return (
    <td className={`px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${className}`}>
      {children}
    </td>
  );
}
