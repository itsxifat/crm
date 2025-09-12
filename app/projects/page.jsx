// app/projects/page.jsx
"use client";

import { useState, useEffect, useRef } from "react";
import {
  ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight,
  Search, ChevronDown, ChevronUp, SlidersHorizontal,
  Plus, ArrowDownToLine, MoreVertical, Briefcase, X, Check,
} from "lucide-react";

/* ---------- Helpers ---------- */
const getStatusColor = (status) => {
  if (status === "In progress") return "bg-yellow-100 text-yellow-800";
  if (status === "Completed") return "bg-green-100 text-green-800";
  return "bg-gray-100 text-gray-800";
};

const palette = ["bg-red-500", "bg-green-500", "bg-purple-500", "bg-yellow-500", "bg-blue-500"];
const initialsOf = (name = "NA") =>
  name.split(" ").map((n) => n[0] || "").join("").slice(0, 2).toUpperCase();

// Normalize ANY incoming object to have a stable string id (stringified for safety)
const normalizeId = (obj) => {
  const raw = obj?.id ?? obj?._id ?? obj?.value ?? obj?.email ?? obj?.name;
  return String(raw ?? "");
};

const normalizeArrayWithId = (arr) =>
  (Array.isArray(arr) ? arr : []).map((x) => ({ ...x, id: normalizeId(x) }));

/* ---------- API Helpers ---------- */
async function getProjects() {
  try {
    const res = await fetch("/api/projects/list", { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch projects");
    return await res.json();
  } catch (e) {
    console.error(e);
    return [];
  }
}

async function saveProject(payload, isEdit = false) {
  try {
    const url = isEdit ? "/api/projects/update" : "/api/projects/create";
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to save project");
    return await res.json();
  } catch (e) {
    console.error(e);
    return { success: false };
  }
}

/* ---------- UI: Header ---------- */
const Header = ({ onAssignProjectClick }) => (
  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
    <div>
      <h1 className="text-3xl font-bold tracking-tight text-gray-900">Projects</h1>
      <p className="mt-1 text-sm text-gray-600">Manage and track your projects.</p>
    </div>
    <div className="flex items-center gap-2">
      <button className="flex items-center justify-center gap-2 bg-white text-gray-700 border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-100 transition-colors">
        <ArrowDownToLine className="h-4 w-4" />
        Export
      </button>
      <button
        onClick={onAssignProjectClick}
        className="flex items-center justify-center gap-2 bg-green-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-green-700 transition-colors"
      >
        <Plus className="h-4 w-4" />
        Assign Project
      </button>
    </div>
  </div>
);

/* ---------- Filter + Table Card ---------- */
const FilterAndTable = ({ data, onEdit }) => {
  const [sortOrder, setSortOrder] = useState("desc");
  const toggleSortOrder = () => setSortOrder((v) => (v === "desc" ? "asc" : "desc"));
  const SortIcon = sortOrder === "desc" ? ChevronDown : ChevronUp;

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
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Project ID</th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Project Name</th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Client</th>
              <th className="hidden sm:table-cell px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Assigned to</th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
              <th className="hidden md:table-cell px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Start</th>
              <th className="hidden md:table-cell px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Due</th>
              <th className="hidden lg:table-cell px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
              <th className="hidden lg:table-cell px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Cost</th>
              <th className="hidden xl:table-cell px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Profit</th>
              <th className="px-4 sm:px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
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
                <tr key={row.id || i}>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.id}</td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.name}</td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.client}</td>
                  <td className="hidden sm:table-cell px-4 sm:px-6 py-4">
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
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(row.status)}`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="hidden md:table-cell px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.startDate}</td>
                  <td className="hidden md:table-cell px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.dueDate}</td>
                  <td className="hidden lg:table-cell px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {Number(row.totalAmount || 0).toFixed(2)}
                  </td>
                  <td className="hidden lg:table-cell px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {Number(row.totalCost || 0).toFixed(2)}
                  </td>
                  <td className="hidden xl:table-cell px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {Number(row.profit || 0).toFixed(2)}
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => onEdit(row)}
                      className="text-gray-500 hover:text-green-600 transition"
                      aria-label={`Edit ${row.name}`}
                    >
                      <MoreVertical className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ---------- Pagination (static placeholder) ---------- */
const Pagination = ({ projectsCount }) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-6">
    <div className="text-sm text-gray-500">Showing 1 to {projectsCount} of {projectsCount} entries</div>
    <div className="flex items-center space-x-2">
      <span className="text-sm text-gray-600">Count</span>
      <select className="px-2 py-1 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-green-500">
        <option>14</option><option>25</option><option>50</option>
      </select>
      <div className="flex items-center space-x-1">
        <button className="p-2 rounded-lg text-gray-600 hover:bg-gray-100" aria-label="First page"><ChevronsLeft size={16} /></button>
        <button className="p-2 rounded-lg text-gray-600 hover:bg-gray-100" aria-label="Previous page"><ChevronLeft size={16} /></button>
        <button className="w-8 h-8 rounded-lg bg-green-600 text-white font-semibold">1</button>
        <button className="w-8 h-8 rounded-lg text-gray-700 hover:bg-gray-100">2</button>
        <button className="p-2 rounded-lg text-gray-600 hover:bg-gray-100" aria-label="Next page"><ChevronRight size={16} /></button>
        <button className="p-2 rounded-lg text-gray-600 hover:bg-gray-100" aria-label="Last page"><ChevronsRight size={16} /></button>
      </div>
    </div>
  </div>
);

/* ---------- Assign Project Modal (unchanged logic, responsive paddings) ---------- */
const AssignProjectModal = ({ isOpen, onClose, onProjectAssigned, editProject }) => {
  const [projectName, setProjectName] = useState("");
  const [clients, setClients] = useState([]);
  const [users, setUsers] = useState([]);

  const [selectedClient, setSelectedClient] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);

  const [clientSearch, setClientSearch] = useState("");
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const clientDropdownRef = useRef(null);
  const clientSearchRef = useRef(null);

  const [userSearch, setUserSearch] = useState("");
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const userDropdownRef = useRef(null);
  const userSearchRef = useRef(null);

  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [totalCost, setTotalCost] = useState("");
  const profit = (Number(totalAmount) || 0) - (Number(totalCost) || 0);

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    fetch("/api/clients/list")
      .then((r) => r.json())
      .then((data) => setClients(normalizeArrayWithId(data)))
      .catch(() => setClients([]));

    fetch("/api/users/list")
      .then((r) => r.json())
      .then((data) => setUsers(normalizeArrayWithId(data)))
      .catch(() => setUsers([]));
  }, [isOpen]);

  // Prefill on edit
  useEffect(() => {
    if (!isOpen) return;
    if (editProject) {
      setProjectName(editProject.name || "");
      setSelectedClient(String(editProject.clientId || ""));
      setSelectedUsers((editProject.assignedTo || []).map((u) => String(normalizeId(u))));
      setStartDate(editProject.startDate || "");
      setDueDate(editProject.dueDate || "");
      setTotalAmount(editProject.totalAmount ?? "");
      setTotalCost(editProject.totalCost ?? "");
    } else {
      setProjectName("");
      setSelectedClient("");
      setSelectedUsers([]);
      setStartDate("");
      setDueDate("");
      setTotalAmount("");
      setTotalCost("");
    }
  }, [editProject, isOpen]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target)) setUserDropdownOpen(false);
      if (clientDropdownRef.current && !clientDropdownRef.current.contains(e.target)) setShowClientDropdown(false);
    };
    if (userDropdownOpen || showClientDropdown) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [userDropdownOpen, showClientDropdown]);

  // Autofocus search
  useEffect(() => {
    if (userDropdownOpen) setTimeout(() => userSearchRef.current?.focus(), 50);
    if (showClientDropdown) setTimeout(() => clientSearchRef.current?.focus(), 50);
  }, [userDropdownOpen, showClientDropdown]);

  const filteredClients = clients.filter((c) =>
    `${c.name || ""} ${c.email || ""}`.toLowerCase().includes(clientSearch.toLowerCase())
  );
  const filteredUsers = users.filter((u) =>
    `${u.name || ""} ${u.email || ""}`.toLowerCase().includes(userSearch.toLowerCase())
  );

  const handleUserToggle = (uid) =>
    setSelectedUsers((prev) => (prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]));
  const removeSelectedUser = (uid) => setSelectedUsers((prev) => prev.filter((id) => id !== uid));
  const selectAllVisibleUsers = () => {
    const visible = filteredUsers.map((u) => u.id);
    setSelectedUsers((prev) => Array.from(new Set([...prev, ...visible])));
  };
  const clearAllUsers = () => setSelectedUsers([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    const payload = {
      ...(editProject && { id: editProject.id }),
      name: projectName,
      clientId: selectedClient,
      assignedUserIds: selectedUsers,
      startDate,
      dueDate,
      totalAmount: Number(totalAmount) || 0,
      totalCost: Number(totalCost) || 0,
    };

    const res = await saveProject(payload, !!editProject);
    if (res?.success || res?.id) {
      onProjectAssigned();
      onClose();
    } else {
      console.error("Failed to save project");
    }
    setIsSubmitting(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 sm:px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">{editProject ? "Edit Project" : "Assign Project"}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-5 sm:px-6 py-5 space-y-5 overflow-y-auto">
          {/* Project name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter project name"
                required
              />
            </div>
          </div>

          {/* Client */}
          <div ref={clientDropdownRef} className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
            <button
              type="button"
              onClick={() => setShowClientDropdown((v) => !v)}
              className="w-full text-left px-3 py-2 border border-gray-300 rounded-lg bg-white hover:shadow-sm flex items-center justify-between gap-3"
            >
              <span className={selectedClient ? "text-gray-900" : "text-gray-400"}>
                {clients.find((c) => c.id === selectedClient)?.name || "Select a client"}
              </span>
              <ChevronDown size={16} className={`transition-transform ${showClientDropdown ? "rotate-180" : ""}`} />
            </button>
            {showClientDropdown && (
              <div className="absolute left-0 right-0 z-20 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 max-h-60 overflow-auto">
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    ref={clientSearchRef}
                    type="text"
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                    placeholder="Search clients..."
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <ul className="space-y-1">
                  {filteredClients.length ? (
                    filteredClients.map((c) => {
                      const isSelected = selectedClient === c.id;
                      return (
                        <li
                          key={c.id}
                          onClick={() => {
                            setSelectedClient(String(c.id));
                            setShowClientDropdown(false);
                          }}
                          className="px-2 py-2 rounded-md hover:bg-gray-50 cursor-pointer flex items-center justify-between"
                        >
                          <div>
                            <div className="text-sm font-medium text-gray-900">{c.name}</div>
                            {c.email && <div className="text-xs text-gray-500">{c.email}</div>}
                          </div>
                          {isSelected && <Check className="text-green-600" size={18} />}
                        </li>
                      );
                    })
                  ) : (
                    <li className="text-sm text-gray-500 px-2 py-2">No clients found</li>
                  )}
                </ul>
              </div>
            )}
          </div>

          {/* Assigned Users (multi-select) */}
          <div ref={userDropdownRef} className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Users</label>
            <button
              type="button"
              onClick={() => setUserDropdownOpen((v) => !v)}
              className="w-full text-left p-2 border border-gray-300 rounded-lg bg-white hover:shadow-sm flex items-center justify-between gap-3"
            >
              <div className="flex flex-wrap gap-2 flex-1">
                {selectedUsers.length ? (
                  selectedUsers.map((uid) => {
                    const u = users.find((x) => x.id === uid) || {};
                    return (
                      <span
                        key={uid}
                        className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-gray-100 border text-sm"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span className="truncate max-w-[10rem]">{u.name || uid}</span>
                        <button
                          type="button"
                          onClick={() => removeSelectedUser(uid)}
                          className="text-gray-400 hover:text-gray-600"
                          aria-label={`Remove ${u.name || uid}`}
                        >
                          <X size={14} />
                        </button>
                      </span>
                    );
                  })
                ) : (
                  <span className="text-gray-400">Select users...</span>
                )}
              </div>
              <ChevronDown size={16} className={`transition-transform ${userDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {userDropdownOpen && (
              <div className="absolute left-0 right-0 z-20 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 max-h-64 overflow-auto">
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    ref={userSearchRef}
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search users..."
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-gray-500">{selectedUsers.length} selected</span>
                  <div>
                    <button
                      type="button"
                      onClick={selectAllVisibleUsers}
                      className="text-xs text-green-600 hover:underline px-2"
                    >
                      Select all
                    </button>
                    <button
                      type="button"
                      onClick={clearAllUsers}
                      className="text-xs text-green-600 hover:underline px-2"
                    >
                      Clear all
                    </button>
                  </div>
                </div>
                <ul className="space-y-1">
                  {filteredUsers.length ? (
                    filteredUsers.map((user) => {
                      const uid = String(user.id);
                      const checked = selectedUsers.includes(uid);
                      return (
                        <li key={uid}>
                          <label className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => handleUserToggle(uid)}
                              className="w-4 h-4 rounded text-green-600 focus:ring-green-500"
                            />
                            <div>
                              <div className="text-sm font-medium text-gray-900">{user.name}</div>
                              <div className="text-xs text-gray-500">{user.email}</div>
                            </div>
                          </label>
                        </li>
                      );
                    })
                  ) : (
                    <li className="text-sm text-gray-500 px-2 py-2">No users found</li>
                  )}
                </ul>
              </div>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
          </div>

          {/* Finance */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount ($)</label>
              <input
                type="number"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Cost ($)</label>
              <input
                type="number"
                value={totalCost}
                onChange={(e) => setTotalCost(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Profit ($)</label>
              <input
                type="number"
                value={profit}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed"
              />
            </div>

            {/* Actions */}
            <div className="md:col-span-3 flex justify-end gap-3 border-t pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition disabled:bg-green-400 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Saving..." : editProject ? "Update Project" : "Assign Project"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ---------- Main Page ---------- */
export default function ProjectPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projects, setProjects] = useState([]);
  const [editingProject, setEditingProject] = useState(null);

  const refresh = () => getProjects().then(setProjects);
  useEffect(() => { refresh(); }, []);

  const handleOpenModalForNew = () => { setEditingProject(null); setIsModalOpen(true); };
  const handleOpenModalForEdit = (project) => { setEditingProject(project); setIsModalOpen(true); };
  const handleProjectAssigned = () => { refresh(); setIsModalOpen(false); };

  return (
    <div className="bg-gray-50 min-h-screen font-sans text-gray-800">
      {/* match your Users page container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 overflow-x-hidden">
        <Header onAssignProjectClick={handleOpenModalForNew} />
        <FilterAndTable data={projects} onEdit={handleOpenModalForEdit} />
        <Pagination projectsCount={projects.length} />
      </main>

      <AssignProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onProjectAssigned={handleProjectAssigned}
        editProject={editingProject}
      />
    </div>
  );
}
