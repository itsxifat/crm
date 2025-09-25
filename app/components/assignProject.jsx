// components/assignProject.jsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Briefcase, ChevronDown, Check, Search, StickyNote, Trash2, X, Plus, PencilLine, Users, Calendar, BadgeDollarSign,
} from "lucide-react";
import {
  currency, saveProject,
} from "@/lib/projects-utils";

// Simple empty service with the new "cost" field
const emptyService = () => ({
  description: "",
  unitPrice: "",
  unit: "",
  offerPrice: "",
  note: "",
  totalPrice: 0,
  cost: "", // NEW: per-service cost
});

// Utilities for robust directory normalization
const toArray = (payload) =>
  Array.isArray(payload)
    ? payload
    : payload?.rows || payload?.items || payload?.data || payload?.results || [];

const getAddressText = (x) => {
  const a =
    x.address ||
    x.addr ||
    {
      line1: x.addressLine1 || x.line1,
      line2: x.addressLine2 || x.line2,
      city: x.city,
      state: x.state,
      postalCode: x.postalCode || x.zip,
      country: x.country,
    };

  if (!a || typeof a !== "object") return "";
  const parts = [a.line1, a.line2, a.city, a.state, a.postalCode, a.country]
    .filter(Boolean)
    .map(String);
  return parts.join(" ").trim();
};

const normalizeDirectoryItem = (x, kind) => {
  const id = String(x.id ?? x._id ?? "");
  const name =
    x.name ??
    x.companyName ??
    x.clientName ??
    x.fullName ??
    (kind === "user" ? x.username : x.companyName) ??
    x.email ??
    "Unnamed";
  const email = x.email ?? x.contactEmail ?? "";
  const phone = x.phone ?? x.mobile ?? x.contactPhone ?? "";
  const addressText = getAddressText(x);

  const haystack = [name, email, phone, addressText]
    .filter(Boolean)
    .map((v) => String(v).toLowerCase())
    .join(" ");

  return {
    ...x,
    id,
    _id: id,
    name: String(name),
    email: String(email),
    phone: String(phone),
    __addressText: addressText,
    __searchHaystack: haystack,
  };
};

const forceNormalizeList = (list, kind) =>
  (list || []).map((x) => normalizeDirectoryItem(x, kind));

export default function AssignProject({
  isOpen,
  onClose,
  onProjectAssigned,
  editProject,
}) {
  const [projectName, setProjectName] = useState("");

  // NEW: Sister Concern
  const SISTER_OPTIONS = ["Enfinito", "Enfinito Studio", "Enmark", "Entech"];
  const [sisterConcern, setSisterConcern] = useState("");

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

  const [services, setServices] = useState([emptyService()]);

  const [descOpen, setDescOpen] = useState(false);
  const [editingIdx, setEditingIdx] = useState(null);
  const [descDraft, setDescDraft] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const MAX_DESC = 2000;

  // We will now compute totalCost from per-service costs; no manual input
  const computedTotalAmount = useMemo(() => {
    return services.reduce((sum, s) => {
      const unit = Number(s.unit) || 0;
      const unitPrice = Number(s.unitPrice) || 0;
      const auto = unit * unitPrice;
      const offer = s.offerPrice !== "" ? Number(s.offerPrice) || 0 : auto;
      return sum + offer;
    }, 0);
  }, [services]);

  const computedTotalCost = useMemo(() => {
    return services.reduce((sum, s) => sum + (Number(s.cost) || 0), 0);
  }, [services]);

  const profit = (Number(computedTotalAmount) || 0) - (Number(computedTotalCost) || 0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* ---------- Load clients + users when modal opens ---------- */
  useEffect(() => {
    if (!isOpen) return;

    Promise.all([
      fetch("/api/clients/list").then((r) => r.json()).catch(() => []),
      fetch("/api/users/list").then((r) => r.json()).catch(() => []),
    ])
      .then(([clientsRaw, usersRaw]) => {
        const clientsArr = toArray(clientsRaw);
        const usersArr = toArray(usersRaw);

        const normalizedClients = forceNormalizeList(clientsArr, "client");
        const normalizedUsers = forceNormalizeList(usersArr, "user");

        setClients(normalizedClients);
        setUsers(normalizedUsers);
      })
      .catch(() => {
        setClients([]);
        setUsers([]);
      });
  }, [isOpen]);

  /* ---------- Seed form for edit mode ---------- */
  useEffect(() => {
    if (!isOpen) return;
    if (editProject) {
      setProjectName(editProject.name || "");
      setSelectedClient(String(editProject.clientId || editProject.client || ""));
      setSelectedUsers((editProject.assignedTo || editProject.assignedUserIds || []).map((u) => String(u?.id ?? u)));
      setStartDate(editProject.startDate || "");
      setDueDate(editProject.dueDate || "");
      setSisterConcern(editProject.sisterConcern || "");

      if (Array.isArray(editProject.services) && editProject.services.length) {
        setServices(
          editProject.services.map((s) => ({
            description: s.description || "",
            unitPrice: s.unitPrice ?? "",
            unit: s.unit ?? "",
            totalPrice: Number(s.totalPrice || (Number(s.unit) || 0) * (Number(s.unitPrice) || 0)),
            offerPrice: s.offerPrice ?? "",
            note: s.note ?? "",
            cost: s.cost ?? "", // NEW: cost
          }))
        );
      } else {
        setServices([emptyService()]);
      }
    } else {
      setProjectName("");
      setSelectedClient("");
      setSelectedUsers([]);
      setStartDate("");
      setDueDate("");
      setServices([emptyService()]);
      setSisterConcern("");
    }
  }, [editProject, isOpen]);

  /* ---------- Outside click handling ---------- */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target)) setUserDropdownOpen(false);
      if (clientDropdownRef.current && !clientDropdownRef.current.contains(e.target)) setShowClientDropdown(false);
    };
    if (userDropdownOpen || showClientDropdown) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [userDropdownOpen, showClientDropdown]);

  /* ---------- Autofocus search boxes ---------- */
  useEffect(() => {
    if (userDropdownOpen) setTimeout(() => userSearchRef.current?.focus(), 50);
    if (showClientDropdown) setTimeout(() => clientSearchRef.current?.focus(), 50);
  }, [userDropdownOpen, showClientDropdown]);

  /* ---------- Filtering (search in name/email/phone/address) ---------- */
  const clientSearchLower = clientSearch.toLowerCase();
  const filteredClients = clients.filter((c) =>
    (c.__searchHaystack ||
      `${c.name || ""} ${c.email || ""} ${c.phone || ""}`.toLowerCase()
    ).includes(clientSearchLower)
  );

  const userSearchLower = userSearch.toLowerCase();
  const filteredUsers = users.filter((u) =>
    (u.__searchHaystack ||
      `${u.name || ""} ${u.email || ""} ${u.phone || ""}`.toLowerCase()
    ).includes(userSearchLower)
  );

  /* ---------- Users selection helpers ---------- */
  const handleUserToggle = (uid) =>
    setSelectedUsers((prev) => {
      const id = String(uid);
      return prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
    });
  const removeSelectedUser = (uid) => setSelectedUsers((prev) => prev.filter((id) => id !== String(uid)));
  const selectAllVisibleUsers = () => {
    const visible = filteredUsers.map((u) => String(u.id));
    setSelectedUsers((prev) => Array.from(new Set([...prev, ...visible])));
  };
  const clearAllUsers = () => setSelectedUsers([]);

  /* ---------- Services table helpers ---------- */
  const setService = (idx, patch) => {
    setServices((prev) => {
      const copy = [...prev];
      const s = { ...copy[idx], ...patch };
      const unit = Number(s.unit) || 0;
      const unitPrice = Number(s.unitPrice) || 0;
      s.totalPrice = unit * unitPrice;
      copy[idx] = s;
      return copy;
    });
  };

  const addService = () => setServices((prev) => [...prev, emptyService()]);
  const removeService = (idx) => setServices((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== idx)));

  const openDescEditor = (idx) => {
    setEditingIdx(idx);
    setDescDraft(services[idx].description || "");
    setNoteDraft(services[idx].note || "");
    setDescOpen(true);
  };
  const applyDescEditor = () => {
    if (editingIdx == null) return;
    setService(editingIdx, { description: descDraft, note: noteDraft });
    setDescOpen(false);
  };

  /* ---------- Submit ---------- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    const cleanServices = services
      .filter((s) => (s.description?.trim() || "").length)
      .map((s) => ({
        description: s.description.trim(),
        unitPrice: Number(s.unitPrice) || 0,
        unit: Number(s.unit) || 0,
        totalPrice: (Number(s.unitPrice) || 0) * (Number(s.unit) || 0),
        offerPrice: s.offerPrice !== "" ? Number(s.offerPrice) || 0 : undefined,
        cost: s.cost !== "" ? Number(s.cost) || 0 : 0, // NEW
        ...(s.note?.trim() ? { note: s.note.trim() } : {}),
      }));

    const payload = {
      ...(editProject && { id: editProject.id, _id: editProject._id }),
      name: projectName,
      clientId: String(selectedClient || ""),
      assignedUserIds: selectedUsers.map(String),
      startDate,
      dueDate,
      services: cleanServices,
      sisterConcern: sisterConcern || "", // NEW
      totalCost: computedTotalCost,       // NEW: server will respect/compute too
    };

    try {
      const res = await saveProject(payload, !!editProject);
      if (res?.success || res?.id) {
        onProjectAssigned?.();
        onClose?.();
      } else {
        throw new Error(res?.error || "Failed to save project");
      }
    } catch (err) {
      console.error("Failed to save project:", err);
      alert(err?.message || "Failed to save project");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      {/* Modal */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-5xl">
          <div className="rounded-3xl border border-gray-200/70 bg-white/90 backdrop-blur p-0 max-h-[92vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-gray-900">
                  {editProject ? "Edit Project" : "Assign Project"}
                </h2>
                <p className="text-xs text-gray-500">
                  Create a clean, line-item proposal with schedule, team & pricing.
                </p>
              </div>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700" aria-label="Close">
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
              {/* Scrollable content area */}
              <div className="flex-1 overflow-y-auto">
                <div className="grid gap-6 p-6 md:grid-cols-2">
                  {/* Project */}
                  <section className="rounded-2xl border border-gray-200/70 bg-white/90 p-5">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                      <Briefcase className="h-4 w-4 text-gray-600" /> Project
                    </h3>
                    <div className="mt-4 space-y-4">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-600">Project Name</label>
                        <div className="relative">
                          <input
                            type="text"
                            value={projectName}
                            onChange={(e) => setProjectName(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 focus:ring-2 focus:ring-emerald-500"
                            placeholder="e.g. Corporate website redesign"
                            required
                          />
                        </div>
                      </div>

                      {/* Client dropdown */}
                      <div ref={clientDropdownRef}>
                        <label className="mb-1 block text-xs font-medium text-gray-600">Client</label>
                        <button
                          type="button"
                          onClick={() => setShowClientDropdown((v) => !v)}
                          className="flex w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2 text-left hover:bg-gray-50"
                        >
                          <span className={selectedClient ? "text-gray-900" : "text-gray-400"}>
                            {clients.find((c) => String(c.id) === String(selectedClient))?.name || "Select a client"}
                          </span>
                          <ChevronDown size={16} className={`transition-transform ${showClientDropdown ? "rotate-180" : ""}`} />
                        </button>
                        {showClientDropdown && (
                          <div className="relative">
                            <div className="absolute z-20 mt-2 w-full rounded-xl border border-gray-200 bg-white p-3 shadow max-h-[60vh] overflow-auto">
                              <div className="relative mb-3">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input
                                  ref={clientSearchRef}
                                  type="text"
                                  value={clientSearch}
                                  onChange={(e) => setClientSearch(e.target.value)}
                                  placeholder="Search by name, phone, email, address…"
                                  className="w-full rounded-lg border border-gray-300 pl-8 pr-3 py-2 focus:ring-2 focus:ring-emerald-500"
                                />
                              </div>
                              <ul className="space-y-1">
                                {filteredClients.length === 0 ? (
                                  <li className="px-2 py-2 text-sm text-gray-500">No clients found</li>
                                ) : (
                                  filteredClients.map((c) => {
                                    const isSelected = String(selectedClient) === String(c.id);
                                    return (
                                      <li
                                        key={c.id}
                                        onClick={() => { setSelectedClient(String(c.id)); setShowClientDropdown(false); }}
                                        className="flex cursor-pointer items-center justify-between rounded-md px-2 py-2 hover:bg-gray-50"
                                      >
                                        <div>
                                          <div className="text-sm font-medium text-gray-900">{c.name}</div>
                                          {(c.phone || c.email) && (
                                            <div className="text-xs text-gray-500">
                                              {c.phone || c.email}
                                            </div>
                                          )}
                                          {c.__addressText && (
                                            <div className="text-[11px] text-gray-400 truncate">
                                              {c.__addressText}
                                            </div>
                                          )}
                                        </div>
                                        {isSelected && <Check className="text-emerald-600" size={18} />}
                                      </li>
                                    );
                                  })
                                )}
                              </ul>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </section>

                  {/* Team + Sister Concern */}
                  <section className="rounded-2xl border border-gray-200/70 bg-white/90 p-5">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                      <Users className="h-4 w-4 text-gray-600" /> Team
                    </h3>

                    {/* Sister Concern (NEW) */}
                    <div className="mt-4">
                      <label className="mb-1 block text-xs font-medium text-gray-600">Sister Concern</label>
                      <select
                        value={sisterConcern}
                        onChange={(e) => setSisterConcern(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="">Select…</option>
                        {SISTER_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>

                    {/* Assigned Users */}
                    <div className="mt-4" ref={userDropdownRef}>
                      <label className="mb-1 block text-xs font-medium text-gray-600">Assigned Users</label>
                      <button
                        type="button"
                        onClick={() => setUserDropdownOpen((v) => !v)}
                        className="flex w-full items-center justify-between rounded-lg border border-gray-300 bg-white p-2 text-left hover:bg-gray-50"
                      >
                        <div className="flex flex-1 flex-wrap gap-2">
                          {selectedUsers.length ? (
                            selectedUsers.map((uid) => {
                              const u = users.find((x) => String(x.id) === String(uid)) || {};
                              return (
                                <span
                                  key={uid}
                                  className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-2 py-1 text-xs shadow-sm"
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
                        <div className="relative">
                          <div className="absolute z-20 mt-2 w-full rounded-xl border border-gray-200 bg-white p-3 shadow max-h-[60vh] overflow-auto">
                            <div className="relative mb-3">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                              <input
                                ref={userSearchRef}
                                type="text"
                                value={userSearch}
                                onChange={(e) => setUserSearch(e.target.value)}
                                placeholder="Search by name, phone, email…"
                                className="w-full rounded-lg border border-gray-300 pl-8 pr-3 py-2 focus:ring-2 focus:ring-emerald-500"
                              />
                            </div>
                            <div className="mb-2 flex items-center justify-between">
                              <span className="text-xs text-gray-500">{selectedUsers.length} selected</span>
                              <div className="space-x-2">
                                <button type="button" onClick={selectAllVisibleUsers} className="text-xs text-emerald-600 hover:underline">Select all</button>
                                <button type="button" onClick={clearAllUsers} className="text-xs text-emerald-600 hover:underline">Clear all</button>
                              </div>
                            </div>
                            <ul className="space-y-1">
                              {filteredUsers.length === 0 ? (
                                <li className="px-2 py-2 text-sm text-gray-500">No users found</li>
                              ) : (
                                filteredUsers.map((user) => {
                                  const uid = String(user.id);
                                  const checked = selectedUsers.includes(uid);
                                  return (
                                    <li key={uid}>
                                      <label className="flex cursor-pointer items-center gap-3 rounded-md p-2 hover:bg-gray-50">
                                        <input
                                          type="checkbox"
                                          checked={checked}
                                          onChange={() => handleUserToggle(uid)}
                                          className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500"
                                        />
                                        <div>
                                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                          {(user.phone || user.email) && (
                                            <div className="text-xs text-gray-500">
                                              {user.phone || user.email}
                                            </div>
                                          )}
                                          {user.__addressText && (
                                            <div className="text-[11px] text-gray-400 truncate">
                                              {user.__addressText}
                                            </div>
                                          )}
                                        </div>
                                      </label>
                                    </li>
                                  );
                                })
                              )}
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  </section>

                  {/* Schedule */}
                  <section className="rounded-2xl border border-gray-200/70 bg-white/90 p-5">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                      <Calendar className="h-4 w-4 text-gray-600" /> Schedule
                    </h3>
                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-600">Start Date</label>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:ring-2 focus:ring-emerald-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-600">Due Date</label>
                        <input
                          type="date"
                          value={dueDate}
                          onChange={(e) => setDueDate(e.target.value)}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:ring-2 focus:ring-emerald-500"
                          required
                        />
                      </div>
                    </div>
                  </section>

                  {/* Financials */}
                  <section className="rounded-2xl border border-gray-200/70 bg-white/90 p-5">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                      <BadgeDollarSign className="h-4 w-4 text-gray-600" /> Financials
                    </h3>
                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-600">Total Amount ($)</label>
                        <input
                          type="text"
                          value={`$${currency(computedTotalAmount)}`}
                          readOnly
                          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-gray-800"
                        />
                        <p className="mt-1 text-xs text-gray-500">Auto-calculated (Offer or Unit×UnitPrice)</p>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-600">Total Cost ($)</label>
                        <input
                          type="text"
                          value={`$${currency(computedTotalCost)}`}
                          readOnly
                          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-gray-800"
                          title="Sum of per-service costs"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-600">Profit ($)</label>
                        <input
                          type="text"
                          value={`$${currency(profit)}`}
                          readOnly
                          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-gray-800"
                        />
                      </div>
                    </div>
                  </section>

                  {/* Services */}
                  <section className="md:col-span-2 rounded-2xl border border-gray-200/70 bg-white/90 p-0">
                    <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                      <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                        <StickyNote className="h-4 w-4 text-gray-600" /> Services
                      </h3>
                      <button
                        type="button"
                        onClick={addService}
                        className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm text-white hover:bg-emerald-700"
                      >
                        <Plus className="h-4 w-4" /> Add service
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-100 bg-white text-gray-600">
                            <th className="px-3 py-2 text-left w-12">#</th>
                            <th className="px-3 py-2 text-left">Description</th>
                            <th className="px-3 py-2 text-right w-32">Unit price</th>
                            <th className="px-3 py-2 text-right w-24">Unit</th>
                            <th className="px-3 py-2 text-right w-32">Total</th>
                            <th className="px-3 py-2 text-right w-32">Offer</th>
                            <th className="px-3 py-2 text-right w-32">Cost (NEW)</th>
                            <th className="px-3 py-2 text-right w-12"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {services.map((s, idx) => {
                            const totalAuto = (Number(s.unitPrice) || 0) * (Number(s.unit) || 0);
                            const hasDesc = (s.description || "").trim().length > 0;
                            return (
                              <tr key={idx} className="hover:bg-gray-50/60">
                                <td className="px-3 py-2 text-gray-500">{idx + 1}</td>
                                <td className="px-3 py-2">
                                  <button
                                    type="button"
                                    onClick={() => openDescEditor(idx)}
                                    className={`group w-full rounded-md border px-3 py-2 text-left transition ${
                                      hasDesc
                                        ? "border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50"
                                        : "border-dashed border-gray-300 hover:bg-gray-50"
                                    }`}
                                    title={hasDesc ? "Edit description" : "Add description"}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className={`truncate ${hasDesc ? "text-gray-900" : "text-gray-400"}`}>
                                        {hasDesc ? s.description : "Add detailed service description"}
                                      </div>
                                      <PencilLine className="h-4 w-4 shrink-0 text-gray-400 group-hover:text-gray-600" />
                                    </div>
                                  </button>
                                </td>
                                <td className="px-3 py-2 text-right">
                                  <div className="relative">
                                    <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">$</span>
                                    <input
                                      type="number"
                                      value={s.unitPrice}
                                      onChange={(e) => setService(idx, { unitPrice: e.target.value })}
                                      className="w-full rounded-md border pl-5 pr-2 py-1 text-right"
                                      placeholder="0.00"
                                      step="0.01"
                                      min="0"
                                    />
                                  </div>
                                </td>
                                <td className="px-3 py-2 text-right">
                                  <input
                                    type="number"
                                    value={s.unit}
                                    onChange={(e) => setService(idx, { unit: e.target.value })}
                                    className="w-full rounded-md border px-2 py-1 text-right"
                                    placeholder="0"
                                    min="0"
                                  />
                                </td>
                                <td className="px-3 py-2 text-right font-medium tabular-nums">${currency(totalAuto)}</td>
                                <td className="px-3 py-2 text-right">
                                  <div className="relative">
                                    <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">$</span>
                                    <input
                                      type="number"
                                      value={s.offerPrice}
                                      onChange={(e) => setService(idx, { offerPrice: e.target.value })}
                                      className="w-full rounded-md border pl-5 pr-2 py-1 text-right"
                                      placeholder="(optional)"
                                      step="0.01"
                                      min="0"
                                    />
                                  </div>
                                </td>

                                {/* NEW: Cost field driving total cost */}
                                <td className="px-3 py-2 text-right">
                                  <div className="relative">
                                    <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">$</span>
                                    <input
                                      type="number"
                                      value={s.cost}
                                      onChange={(e) => setService(idx, { cost: e.target.value })}
                                      className="w-full rounded-md border pl-5 pr-2 py-1 text-right"
                                      placeholder="0.00"
                                      step="0.01"
                                      min="0"
                                    />
                                  </div>
                                </td>

                                <td className="px-3 py-2 text-right">
                                  <button
                                    type="button"
                                    onClick={() => removeService(idx)}
                                    className="p-1 text-gray-500 hover:text-rose-600"
                                    title="Remove row"
                                    aria-label="Remove service"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex items-center justify-end gap-6 border-t border-gray-100 bg-white px-4 py-3">
                      <div className="text-sm text-gray-600">Subtotal</div>
                      <div className="tabular-nums text-base font-semibold">${currency(computedTotalAmount)}</div>
                    </div>
                  </section>
                </div>
              </div>

              {/* Sticky footer */}
              <div className="sticky bottom-0 z-10 border-t border-gray-100 bg-white/80 backdrop-blur">
                <div className="flex items-center justify-between gap-4 px-6 py-4">
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Summary:</span>{" "}
                    {services.length} service{services.length === 1 ? "" : "s"} · Amount{" "}
                    <span className="font-semibold">${currency(computedTotalAmount)}</span> · Cost{" "}
                    <span className="font-semibold">${currency(computedTotalCost)}</span> · Profit{" "}
                    <span className={`font-semibold ${profit >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                      ${currency(profit)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-lg border border-gray-300 px-5 py-2.5 text-gray-700 hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="rounded-lg bg-emerald-600 px-5 py-2.5 font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-400"
                    >
                      {isSubmitting ? "Saving..." : editProject ? "Update Project" : "Assign Project"}
                    </button>
                  </div>
                </div>
              </div>
            </form>

            {/* Slide-over: Description Editor */}
            {descOpen && (
              <div className="fixed inset-0 z-50">
                <div className="absolute inset-0 bg-black/30" onClick={() => setDescOpen(false)} aria-hidden="true" />
                <aside className="absolute right-0 top-0 h-full w-full border-l bg-white shadow-2xl sm:w-[520px]">
                  <div className="flex items-center justify-between border-b px-5 py-4">
                    <h4 className="text-base font-semibold text-gray-900">Service Description</h4>
                    <button onClick={() => setDescOpen(false)} className="text-gray-500 hover:text-gray-700" aria-label="Close description">
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto px-5 py-4">
                    <label className="mb-1 block text-xs font-medium text-gray-600">Description</label>
                    <textarea
                      value={descDraft}
                      onChange={(e) => setDescDraft(e.target.value.slice(0, MAX_DESC))}
                      rows={8}
                      placeholder="Describe scope, deliverables, milestones, assumptions…"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-emerald-500"
                    />
                    <div className="mt-1 text-right text-xs text-gray-500">{descDraft.length}/{MAX_DESC}</div>

                    <div className="mt-4">
                      <label className="mb-1 block text-xs font-medium text-gray-600">Internal Note (optional)</label>
                      <input
                        type="text"
                        value={noteDraft}
                        onChange={(e) => setNoteDraft(e.target.value)}
                        placeholder="Only visible to your team"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-3 border-t px-5 py-4">
                    <button
                      type="button"
                      onClick={() => setDescOpen(false)}
                      className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={applyDescEditor}
                      className="rounded-lg bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700"
                    >
                      Apply
                    </button>
                  </div>
                </aside>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
