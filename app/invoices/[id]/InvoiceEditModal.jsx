// app/invoices/[id]/InvoiceEditModal.jsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Props:
 * - invoiceId (string)
 * - currentDue (number)
 * - payments (array)
 * - isClientInvoice (boolean)
 * - projects: [{ projectId, name, total, paid, due }]
 */
export default function InvoiceEditModal({
  invoiceId,
  currentDue,
  payments,
  isClientInvoice = false,
  projects = [],
}) {
  const [open, setOpen] = useState(false);
  const [dateISO, setDateISO] = useState(new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [full, setFull] = useState(false);
  const [saving, setSaving] = useState(false);

  // allocation UI state (client invoices only)
  // modes: 'single' | 'multiple' | 'splitAll'
  const [allocMode, setAllocMode] = useState("single");
  const [projectId, setProjectId] = useState(""); // for 'single'
  const [selectedIds, setSelectedIds] = useState(() => new Set()); // for 'multiple'
  const [splitSelectedEvenly, setSplitSelectedEvenly] = useState(true);

  const router = useRouter();
  const firstInputRef = useRef(null);

  const clientDueTotal = Number(currentDue || 0);

  // ---------- helpers ----------
  const getProject = (id) => projects.find((p) => String(p.projectId) === String(id));

  const selectedDue = useMemo(() => {
    if (!isClientInvoice) return 0;
    if (allocMode === "single") {
      const p = getProject(projectId);
      return Number(p?.due || 0);
    }
    if (allocMode === "multiple") {
      let sum = 0;
      for (const id of selectedIds) sum += Number(getProject(id)?.due || 0);
      return sum;
    }
    if (allocMode === "splitAll") {
      return projects.reduce((s, p) => s + Number(p.due || 0), 0);
    }
    return 0;
  }, [isClientInvoice, allocMode, projectId, selectedIds, projects]);

  // The maximum we allow the user to pay in this edit, based on scope
  const maxPayable = isClientInvoice
    ? (allocMode === "single" ? selectedDue
      : allocMode === "multiple" ? selectedDue
      : allocMode === "splitAll" ? selectedDue
      : clientDueTotal)
    : clientDueTotal;

  // When opening in single mode, default to the first project
  useEffect(() => {
    if (!open || !isClientInvoice) return;
    if (allocMode === "single" && !projectId && projects.length > 0) {
      setProjectId(String(projects[0].projectId));
    }
  }, [open, isClientInvoice, allocMode, projectId, projects]);

  // When toggling "Full paid", auto-fill amount with selected scope due
  useEffect(() => {
    if (!open) return;
    if (full) {
      const value = Number((isClientInvoice ? selectedDue : clientDueTotal) || 0).toFixed(2);
      setAmount(value);
    }
  }, [open, full, isClientInvoice, selectedDue, clientDueTotal]);

  // Focus first input on open
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => firstInputRef.current?.focus(), 40);
      return () => clearTimeout(t);
    }
  }, [open]);

  function close() {
    if (saving) return;
    setOpen(false);
  }

  function toggleSelected(id) {
    setSelectedIds((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  const amtNum = Number(amount || 0);
  const amountTooBig = !full && amtNum > maxPayable + 1e-8;

  async function onSubmit(e) {
    e.preventDefault();

    if (!full && !(amtNum > 0)) return alert("Enter a valid amount");
    if (amountTooBig) {
      return alert(
        `Amount exceeds the maximum payable for this selection (${maxPayable.toLocaleString()}).`
      );
    }

    // Build allocation payload for client invoices
    let allocation = undefined;
    if (isClientInvoice) {
      if (allocMode === "single") {
        if (!projectId) return alert("Select a project to allocate payment.");
        allocation = { mode: "single", projectIds: [String(projectId)] };
      } else if (allocMode === "multiple") {
        const ids = [...selectedIds];
        if (ids.length === 0) return alert("Select at least one project.");
        allocation = {
          mode: "multiple",
          projectIds: ids.map(String),
          splitEvenly: Boolean(splitSelectedEvenly),
        };
      } else if (allocMode === "splitAll") {
        allocation = { mode: "splitAll" };
      }
    }

    // If "full" is on, lock amount to scope due
    const finalAmount = full
      ? Number((isClientInvoice ? selectedDue : clientDueTotal).toFixed(2))
      : Number(amtNum.toFixed(2));

    const payload = {
      dateISO,
      amount: finalAmount,
      note,
      // We send the exact amount; backend must NOT expand it further.
      markFullPaid: false,
      allocation,
    };

    setSaving(true);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Update failed");
      setOpen(false);
      setAmount("");
      setNote("");
      setFull(false);
      setSelectedIds(new Set());
      router.refresh();
    } catch (e) {
      alert(e.message || "Failed to update invoice");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border bg-white text-gray-900 hover:bg-gray-50"
      >
        Edit
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-[2px] flex items-center justify-center px-3 sm:px-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <div className="w-full max-w-lg sm:max-w-xl rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b bg-gray-50 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-gray-900">Record payment</div>
                <div className="text-xs text-gray-500 mt-0.5">
                  Update this invoice and regenerate its PDF
                </div>
              </div>
              <button
                onClick={close}
                className="p-2 rounded-md hover:bg-gray-100 text-gray-500"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <form
              onSubmit={onSubmit}
              className="p-5 sm:p-6 space-y-4 overflow-y-auto max-h-[80vh]"
            >
              {/* Due box */}
              <div className="rounded-xl bg-gray-50 border border-gray-200 p-4">
                <div className="text-xs text-gray-500">Current due (scope)</div>
                <div className="mt-0.5 text-lg font-semibold text-gray-900 tabular-nums">
                  {(isClientInvoice ? selectedDue : clientDueTotal).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
                {isClientInvoice && (
                  <div className="mt-1 text-[11px] text-gray-500">
                    Scope changes with the allocation mode / selection below.
                  </div>
                )}
              </div>

              {/* Payment fields */}
              <div className="grid gap-4">
                <label className="block">
                  <span className="text-sm text-gray-700">Payment date</span>
                  <input
                    ref={firstInputRef}
                    type="date"
                    value={dateISO}
                    onChange={(e) => setDateISO(e.target.value)}
                    required
                    className="mt-1 block w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </label>

                <label className="block">
                  <span className="text-sm text-gray-700">Paid amount</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={
                      full
                        ? String(
                            Number(
                              (isClientInvoice ? selectedDue : clientDueTotal) || 0
                            ).toFixed(2)
                          )
                        : amount
                    }
                    onChange={(e) => {
                      setAmount(e.target.value);
                      setFull(false);
                    }}
                    disabled={full}
                    required={!full}
                    className="mt-1 block w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-100"
                  />
                  {amountTooBig && (
                    <div className="text-xs text-rose-600 mt-1">
                      Amount cannot exceed the payable scope total ({maxPayable.toLocaleString()}).
                    </div>
                  )}
                  <div className="text-[11px] text-gray-500 mt-1">
                    Tip: enable “Full paid” to auto-fill and lock the field.
                  </div>
                </label>

                {/* Allocation (client invoices only) */}
                {isClientInvoice && (
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <div className="text-sm font-medium text-gray-800">Allocate payment</div>

                    <div className="mt-3 space-y-3">
                      {/* single project */}
                      <label className="inline-flex items-center gap-2 text-sm">
                        <input
                          type="radio"
                          className="h-4 w-4 text-emerald-600 focus:ring-emerald-500"
                          checked={allocMode === "single"}
                          onChange={() => setAllocMode("single")}
                        />
                        To a single project
                      </label>
                      {allocMode === "single" && (
                        <select
                          value={projectId}
                          onChange={(e) => setProjectId(e.target.value)}
                          className="block w-full mt-1 rounded-xl border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                        >
                          {projects.map((p) => (
                            <option key={p.projectId} value={p.projectId}>
                              {p.name} — Due: {Number(p.due || 0).toLocaleString()} | Paid:{" "}
                              {Number(p.paid || 0).toLocaleString()}
                            </option>
                          ))}
                        </select>
                      )}

                      {/* multiple projects */}
                      <label className="inline-flex items-center gap-2 text-sm">
                        <input
                          type="radio"
                          className="h-4 w-4 text-emerald-600 focus:ring-emerald-500"
                          checked={allocMode === "multiple"}
                          onChange={() => setAllocMode("multiple")}
                        />
                        To multiple selected projects
                      </label>

                      {allocMode === "multiple" && (
                        <div className="mt-2 rounded-xl border border-gray-200 bg-white">
                          <div className="max-h-48 overflow-auto divide-y">
                            {projects.map((p) => {
                              const id = String(p.projectId);
                              const checked = selectedIds.has(id);
                              return (
                                <label
                                  key={id}
                                  className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
                                >
                                  <span className="truncate flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={() => toggleSelected(id)}
                                      className="h-4 w-4 text-emerald-600"
                                    />
                                    <span className="truncate">{p.name}</span>
                                  </span>
                                  <span className="text-xs text-gray-600 shrink-0">
                                    Due: {Number(p.due || 0).toLocaleString()} | Paid:{" "}
                                    {Number(p.paid || 0).toLocaleString()}
                                  </span>
                                </label>
                              );
                            })}
                          </div>

                          {/* selected chips + options */}
                          <div className="p-3 border-t space-y-2">
                            <div className="flex flex-wrap gap-2">
                              {[...selectedIds].map((id) => {
                                const p = getProject(id);
                                return (
                                  <span
                                    key={id}
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-emerald-50 text-emerald-700 border border-emerald-100"
                                  >
                                    {p?.name || id}
                                    <button
                                      type="button"
                                      onClick={() => toggleSelected(id)}
                                      className="ml-1 rounded-full px-1 hover:bg-emerald-100"
                                      aria-label="Remove"
                                    >
                                      ×
                                    </button>
                                  </span>
                                );
                              })}
                              {[...selectedIds].length === 0 && (
                                <span className="text-xs text-gray-500">No projects selected</span>
                              )}
                            </div>
                            <div className="flex items-center justify-between">
                              <label className="inline-flex items-center gap-2 text-sm">
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 text-emerald-600"
                                  checked={splitSelectedEvenly}
                                  onChange={(e) => setSplitSelectedEvenly(e.target.checked)}
                                />
                                Split evenly among selected
                              </label>
                              <span className="text-xs text-gray-600">
                                Selected due total: {selectedDue.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* split all projects evenly */}
                      <label className="inline-flex items-center gap-2 text-sm">
                        <input
                          type="radio"
                          className="h-4 w-4 text-emerald-600 focus:ring-emerald-500"
                          checked={allocMode === "splitAll"}
                          onChange={() => setAllocMode("splitAll")}
                        />
                        Split evenly across all projects
                      </label>

                      {allocMode === "splitAll" && (
                        <div className="text-xs text-gray-600">
                          Total due across all: {selectedDue.toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Full paid */}
                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={full}
                    onChange={(e) => setFull(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  Mark as full paid (auto-fill amount)
                </label>

                {/* Note */}
                <label className="block">
                  <span className="text-sm text-gray-700">Internal note (not printed)</span>
                  <textarea
                    rows={3}
                    className="mt-1 block w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Optional"
                  />
                </label>
              </div>

              {/* Footer */}
              <div className="flex flex-col sm:flex-row sm:justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={close}
                  className="px-4 py-2 rounded-xl border bg-white text-gray-900 hover:bg-gray-50"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
                  disabled={saving || amountTooBig}
                >
                  {saving ? "Updating…" : "Update"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
