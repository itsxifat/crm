"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Plus,
  Search as SearchIcon,
  Receipt,
  Calendar,
  User,
  Briefcase,
  CreditCard,
  FileDown,
  Loader2,
  ChevronDown,
  Upload,
  X,
} from "lucide-react";

/* ---------------- helpers ---------------- */

function fmtCurrency(n) {
  const x = Number(n || 0);
  return x.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function Th({ children, className = "" }) {
  return (
    <th
      className={`px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider ${className}`}
    >
      {children}
    </th>
  );
}
function Td({ children, className = "" }) {
  return (
    <td
      className={`px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${className}`}
    >
      {children}
    </td>
  );
}

const PAYMENT_METHODS = [
  "Bkash",
  "Bank",
  "Nagad",
  "Rocket",
  "Card",
  "Cash",
  "Others",
];

/* ---------------- small UI atoms ---------------- */

function Label({ children, htmlFor }) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1 block text-xs font-medium text-gray-600"
    >
      {children}
    </label>
  );
}

function Input({
  id,
  type = "text",
  value,
  onChange,
  placeholder,
  required,
  min,
  step,
}) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      min={min}
      step={step}
      required={required}
      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
    />
  );
}

function Textarea({ id, rows = 3, value, onChange, placeholder }) {
  return (
    <textarea
      id={id}
      rows={rows}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
    />
  );
}

function Select({ id, value, onChange, children, disabled }) {
  return (
    <div className="relative">
      <select
        id={id}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 py-2 pr-9 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:text-gray-400"
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
      <div className="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-inset ring-transparent focus-within:ring-emerald-500" />
    </div>
  );
}

/* ---------------- Dropzone (receipt) ---------------- */

function FileDrop({
  file,
  onFile,
  accept = "image/*,application/pdf",
  label = "Upload receipt (image/PDF)",
}) {
  const inputRef = useRef(null);
  const [isOver, setIsOver] = useState(false);

  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOver(false);
    const f = e.dataTransfer?.files?.[0];
    if (f) onFile(f);
  };
  const onPick = (e) => {
    const f = e.target.files?.[0];
    if (f) onFile(f);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsOver(true);
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={onDrop}
      className={`rounded-xl border-2 border-dashed p-4 transition ${
        isOver
          ? "border-emerald-400 bg-emerald-50/50"
          : "border-gray-300 bg-gray-50"
      }`}
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter") inputRef.current?.click();
      }}
      aria-label="Upload receipt"
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={onPick}
        className="hidden"
      />
      {!file ? (
        <div className="flex items-center justify-center gap-3 text-sm text-gray-600">
          <Upload className="h-4 w-4 text-gray-400" />
          <span>
            Drag & drop file here, or click to browse (image/PDF)
          </span>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-medium text-gray-900 truncate">
              {file.name}
            </div>
            <div className="text-xs text-gray-500">
              {(file.type || "file")} • {Math.round(file.size / 1024)} KB
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onFile(null);
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-sm text-gray-700 hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
            Remove
          </button>
        </div>
      )}
    </div>
  );
}

/* ---------------- Modal: Record Expense ---------------- */

function RecordExpenseModal({ isOpen, onClose, onSaved }) {
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [amount, setAmount] = useState("");
  const [whereSpent, setWhereSpent] = useState("");
  const [whoSpent, setWhoSpent] = useState(""); // user id
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [accountNumber, setAccountNumber] = useState(""); // optional
  const [date, setDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );

  const [projectId, setProjectId] = useState("");
  const [receiptFile, setReceiptFile] = useState(null);

  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loadingDD, setLoadingDD] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setLoadingDD(true);
    setError("");
    Promise.all([
      fetch("/api/users/list", { cache: "no-store" })
        .then((r) => r.json())
        .catch(() => ({ rows: [] })),
      fetch("/api/projects/list", { cache: "no-store" })
        .then((r) => r.json())
        .catch(() => ({ rows: [] })),
    ])
      .then(([u, p]) => {
        const usersNorm = (Array.isArray(u) ? u : u?.rows || []).map((x) => ({
          id: String(x.id ?? x._id ?? x.value ?? ""),
          name: x.name || x.fullName || x.email || "Unnamed",
          email: x.email || "",
        }));
        const projectsNorm = (Array.isArray(p) ? p : p?.rows || []).map(
          (x) => ({
            id: String(x.id ?? x._id ?? x.value ?? ""),
            name: x.name || x.projectName || `Project ${x.id ?? x._id ?? ""}`,
          })
        );
        setUsers(usersNorm);
        setProjects(projectsNorm);
      })
      .finally(() => setLoadingDD(false));
  }, [isOpen]);

  function resetForm() {
    setTitle("");
    setDetails("");
    setAmount("");
    setWhereSpent("");
    setWhoSpent("");
    setPaymentMethod("Cash");
    setAccountNumber("");
    setDate(new Date().toISOString().slice(0, 10));
    setProjectId("");
    setReceiptFile(null);
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (saving) return;
    setError("");
    if (!title.trim()) return setError("Title is required.");
    if (!amount || Number(amount) <= 0)
      return setError("Amount must be greater than 0.");
    if (!whoSpent) return setError("Select who spent.");

    try {
      setSaving(true);
      const fd = new FormData();
      fd.append("title", title.trim());
      if (details.trim()) fd.append("details", details.trim());
      fd.append("amount", String(amount));
      if (whereSpent.trim()) fd.append("whereSpent", whereSpent.trim());
      fd.append("whoSpentUserId", String(whoSpent));
      fd.append("paymentMethod", paymentMethod);
      // accountNumber is OPTIONAL
      if (accountNumber.trim()) fd.append("accountNumber", accountNumber.trim());
      if (date) fd.append("date", date);
      if (projectId) fd.append("projectId", String(projectId));
      if (receiptFile) fd.append("receipt", receiptFile, receiptFile.name);

      const res = await fetch("/api/expenses", {
        method: "POST",
        body: fd,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !(json?.success || json?.id || json?._id)) {
        throw new Error(json?.error || "Failed to save expense");
      }
      onSaved?.();
      resetForm();
      onClose?.();
    } catch (err) {
      setError(err?.message || "Failed to save expense");
    } finally {
      setSaving(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Modal container */}
      <div className="absolute inset-0 flex items-center justify-center p-3 sm:p-4">
        <div className="w-full sm:max-w-3xl">
          {/* Card: fullscreen on mobile, fixed height with scroll on larger screens */}
          <div className="flex max-h-[92vh] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b px-4 py-3 sm:px-5 sm:py-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                Record Expense
              </h3>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Body (scrollable) */}
            <form
              onSubmit={handleSubmit}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5">
                {error && (
                  <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                    {error}
                  </div>
                )}

                {/* Basic info */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="exp-title">Title</Label>
                    <Input
                      id="exp-title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Domain renewal"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="exp-amount">Amount</Label>
                    <Input
                      id="exp-amount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <Label htmlFor="exp-details">Expense Details</Label>
                  <Textarea
                    id="exp-details"
                    rows={3}
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="Add notes or breakdown…"
                  />
                </div>

                {/* Who/Where/When */}
                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  <div>
                    <Label htmlFor="exp-where">Where it was spent</Label>
                    <Input
                      id="exp-where"
                      value={whereSpent}
                      onChange={(e) => setWhereSpent(e.target.value)}
                      placeholder="e.g. Vendor/Shop name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="exp-who">Who spent</Label>
                    <Select
                      id="exp-who"
                      value={whoSpent}
                      onChange={(e) => setWhoSpent(e.target.value)}
                      disabled={loadingDD}
                    >
                      <option value="">
                        {loadingDD ? "Loading users…" : "Select user…"}
                      </option>
                      {!loadingDD &&
                        users.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name} {u.email ? `(${u.email})` : ""}
                          </option>
                        ))}
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="exp-date">Date</Label>
                    <Input
                      id="exp-date"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Payment */}
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="exp-method">Payment Method</Label>
                    <Select
                      id="exp-method"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    >
                      {PAYMENT_METHODS.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="exp-account">Account Number</Label>
                      <span className="text-[11px] text-gray-400">
                        Optional
                      </span>
                    </div>
                    <Input
                      id="exp-account"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="e.g. 017XXXXXXXX"
                    />
                  </div>
                </div>

                {/* Project link & receipt */}
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="exp-project">Project (optional)</Label>
                    <Select
                      id="exp-project"
                      value={projectId}
                      onChange={(e) => setProjectId(e.target.value)}
                      disabled={loadingDD}
                    >
                      <option value="">
                        {loadingDD ? "Loading projects…" : "Not linked"}
                      </option>
                      {!loadingDD &&
                        projects.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                    </Select>
                  </div>

                  <div>
                    <Label>Upload Receipt</Label>
                    <FileDrop file={receiptFile} onFile={setReceiptFile} />
                  </div>
                </div>
              </div>

              {/* Footer (sticky) */}
              <div className="border-t bg-gray-50 px-4 py-3 sm:px-5 sm:py-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Page: Expenses ---------------- */

export default function ExpensesPage() {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Robust normalizer for any API shape
  const toArray = (json) => {
    if (Array.isArray(json)) return json;
    if (Array.isArray(json?.rows)) return json.rows;
    if (Array.isArray(json?.data)) return json.data;
    return [];
  };

  async function fetchExpenses(term) {
    try {
      // Try /list first; fall back to /api/expenses
      let res = await fetch(`/api/expenses/list?q=${encodeURIComponent(term)}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        res = await fetch(`/api/expenses?q=${encodeURIComponent(term)}`, {
          cache: "no-store",
        });
      }
      const json = await res.json();
      const list = toArray(json).map((x) => ({
        id: String(x.id ?? x._id ?? ""),
        title: x.title || "",
        details: x.details || "",
        amount: Number(x.amount || 0),
        whereSpent: x.whereSpent || "",
        whoSpentUserId: String(x.whoSpentUserId ?? x.userId ?? ""),
        whoSpentName: x.whoSpentName || x.userName || "",
        paymentMethod: x.paymentMethod || "",
        accountNumber: x.accountNumber || "",
        date: x.date || x.createdAt || "",
        projectId: String(x.projectId ?? ""),
        projectName: x.projectName || "",
        receipt: x.receipt || null, // { filename, mimetype, size, path? }
      }));
      return list;
    } catch (e) {
      console.error("load expenses failed:", e);
      return [];
    }
  }

  async function load(term = "") {
    setLoading(true);
    const list = await fetchExpenses(term);
    setRows(list);
    setLoading(false);
  }

  // initial load
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // debounced search
  useEffect(() => {
    const t = setTimeout(() => load(q), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const filtered = useMemo(() => rows, [rows]); // server filters by q

  return (
    <div className="bg-gray-50 min-h-screen font-sans text-gray-800">
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        {/* Header */}
        <div className="mb-6 sm:mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
              Expenses
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Track and search all company spending.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Record Expense
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 p-4 sm:p-5">
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <SearchIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by expense ID, project ID, project name, title, who spent…"
                className="block w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm placeholder-gray-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-14 text-center text-gray-500">Loading…</div>
            ) : filtered.length === 0 ? (
              <div className="py-14 text-center text-gray-500">
                No expenses found.
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <Th>Date</Th>
                    <Th>Title</Th>
                    <Th className="hidden md:table-cell">Project</Th>
                    <Th className="hidden lg:table-cell">Who Spent</Th>
                    <Th>Amount</Th>
                    <Th className="hidden sm:table-cell">Payment</Th>
                    <Th className="hidden xl:table-cell">Where</Th>
                    <Th className="text-right">Receipt</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {filtered.map((r, i) => {
                    const receiptUrl =
                      r.receipt?.path ||
                      (r.id
                        ? `/api/expenses/${encodeURIComponent(
                            r.id
                          )}/files/receipt`
                        : "");
                    return (
                      <tr
                        key={r.id}
                        className={i % 2 ? "bg-white" : "bg-gray-50/40"}
                      >
                        <Td>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span>
                              {r.date ? String(r.date).slice(0, 10) : "—"}
                            </span>
                          </div>
                        </Td>
                        <Td>
                          <div className="font-medium">{r.title || "—"}</div>
                          <div className="max-w-[22rem] truncate text-xs text-gray-500">
                            {r.details || ""}
                          </div>
                          <div className="mt-0.5 flex flex-wrap gap-2 text-xs text-gray-500">
                            {r.projectId && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5">
                                <Briefcase className="h-3 w-3" /> {r.projectId}
                              </span>
                            )}
                            {r.id && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5">
                                <Receipt className="h-3 w-3" /> {r.id}
                              </span>
                            )}
                          </div>
                        </Td>
                        <Td className="hidden md:table-cell">
                          {r.projectName ? (
                            <Link
                              href={`/projects/${encodeURIComponent(
                                r.projectId
                              )}`}
                              className="text-emerald-700 hover:underline"
                            >
                              {r.projectName}
                            </Link>
                          ) : r.projectId ? (
                            <span className="text-gray-700">{r.projectId}</span>
                          ) : (
                            "—"
                          )}
                        </Td>
                        <Td className="hidden lg:table-cell">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <span>
                              {r.whoSpentName || r.whoSpentUserId || "—"}
                            </span>
                          </div>
                        </Td>
                        <Td className="tabular-nums font-semibold">
                          ৳{fmtCurrency(r.amount)}
                        </Td>
                        <Td className="hidden sm:table-cell">
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-gray-400" />
                            <span>{r.paymentMethod || "—"}</span>
                          </div>
                          {r.accountNumber && (
                            <div className="text-xs text-gray-500">
                              {r.accountNumber}
                            </div>
                          )}
                        </Td>
                        <Td className="hidden xl:table-cell">
                          {r.whereSpent || "—"}
                        </Td>
                        <Td className="text-right">
                          {receiptUrl ? (
                            <a
                              href={receiptUrl}
                              target="_blank"
                              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
                            >
                              <FileDown className="h-4 w-4" />
                              View
                            </a>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </Td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>

      {/* Modal */}
      <RecordExpenseModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={() => load(q)}
      />
    </div>
  );
}
