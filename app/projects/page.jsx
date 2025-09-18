"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDownToLine, Plus, MoreHorizontal } from "lucide-react";
import TableProject from "@/components/tableProject";
import AssignProject from "@/components/assignProject";
import { getProjects } from "@/lib/projects-utils";

/* ----------------------------- utilities ----------------------------- */
function useMediaQuery(query) {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const m = window.matchMedia(query);
    const onChange = () => setMatches(m.matches);
    onChange();
    m.addEventListener?.("change", onChange);
    return () => m.removeEventListener?.("change", onChange);
  }, [query]);
  return matches;
}

function formatDate(d) {
  if (!d) return "—";
  const date = new Date(d);
  if (isNaN(date)) return String(d);
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function StatusBadge({ status }) {
  const base = "px-2.5 py-0.5 text-xs font-medium rounded-full inline-block";
  const map = {
    done: "bg-green-100 text-green-800",
    completed: "bg-green-100 text-green-800",
    active: "bg-blue-100 text-blue-800",
    inprogress: "bg-blue-100 text-blue-800",
    "in progress": "bg-blue-100 text-blue-800",
    pending: "bg-amber-100 text-amber-800",
    blocked: "bg-red-100 text-red-800",
    cancelled: "bg-gray-100 text-gray-800",
  };
  const key = (status || "").toString().toLowerCase().replace(/\s+/g, "");
  return <span className={`${base} ${map[key] || "bg-gray-100 text-gray-800"}`}>{status || "—"}</span>;
}

/* ----------------------------- header ----------------------------- */
const Header = ({ onAssignProjectClick, onExport }) => (
  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
    <div>
      <h1 className="text-3xl font-bold tracking-tight text-gray-900">Projects</h1>
      <p className="mt-1 text-sm text-gray-600">Manage and track your projects.</p>
    </div>
    <div className="flex items-center gap-2">
      <button
        onClick={onExport}
        className="flex items-center justify-center gap-2 bg-white text-gray-700 border border-gray-300 rounded-lg px-3 sm:px-4 py-2 text-sm font-medium hover:bg-gray-100 transition-colors"
        aria-label="Export projects as PDF"
        title="Export"
      >
        <ArrowDownToLine className="h-4 w-4" />
        <span className="hidden sm:inline">Export</span>
      </button>
      <button
        onClick={onAssignProjectClick}
        className="flex items-center justify-center gap-2 bg-green-600 text-white rounded-lg px-3 sm:px-4 py-2 text-sm font-medium hover:bg-green-700 transition-colors"
      >
        <Plus className="h-4 w-4" />
        <span className="hidden sm:inline">Assign Project</span>
      </button>
    </div>
  </div>
);

/* ----------------------------- pagination ----------------------------- */
const Pagination = ({ total, page = 1, perPage = 14, onChangePage, onChangePerPage }) => {
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const start = total === 0 ? 0 : (page - 1) * perPage + 1;
  const end = Math.min(total, page * perPage);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-6">
      <div className="text-sm text-gray-500">
        Showing {start} to {end} of {total} entries
      </div>
      <div className="flex items-center space-x-2">
        <label className="text-sm text-gray-600" htmlFor="perPage">Count</label>
        <select
          id="perPage"
          value={perPage}
          onChange={(e) => onChangePerPage?.(Number(e.target.value))}
          className="px-2 py-1 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-green-500"
        >
          {[14, 25, 50].map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        <div className="flex items-center space-x-1">
          <button
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-40"
            aria-label="First page"
            onClick={() => onChangePage?.(1)}
            disabled={page <= 1}
          >
            «
          </button>
          <button
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-40"
            aria-label="Previous page"
            onClick={() => onChangePage?.(Math.max(1, page - 1))}
            disabled={page <= 1}
          >
            ‹
          </button>
          <button className="w-8 h-8 rounded-lg bg-green-600 text-white font-semibold" aria-current="page">
            {page}
          </button>
          <button
            className="w-8 h-8 rounded-lg text-gray-700 hover:bg-gray-100 disabled:opacity-40"
            onClick={() => onChangePage?.(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
          >
            {Math.min(totalPages, page + 1)}
          </button>
          <button
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-40"
            aria-label="Next page"
            onClick={() => onChangePage?.(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
          >
            ›
          </button>
          <button
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-40"
            aria-label="Last page"
            onClick={() => onChangePage?.(totalPages)}
            disabled={page >= totalPages}
          >
            »
          </button>
        </div>
      </div>
    </div>
  );
};

/* ----------------------------- mobile cards ----------------------------- */
function MobileProjectList({ data, onRowClick, onEdit }) {
  if (!data?.length) return null;
  return (
    <ul className="divide-y divide-gray-200">
      {data.map((p) => (
        <li key={p.id || p._id} className="p-4 flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <button
                  className="text-left text-sm font-semibold text-gray-900 truncate hover:underline"
                  onClick={() => onRowClick?.(p.id || p._id)}
                  title={p.name}
                >
                  {p.name || "Untitled Project"}
                </button>
                <div className="text-xs text-gray-500 truncate">
                  {p.clientName || p.client || "—"}
                </div>
              </div>
              <button
                className="p-2 -mr-2 rounded-md text-gray-500 hover:text-green-700 hover:bg-gray-50"
                onClick={() => onEdit?.(p)}
                aria-label="More actions"
              >
                <MoreHorizontal className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StatusBadge status={p.status} />
              {p.budget != null && (
                <span className="inline-flex items-center rounded-full bg-gray-100 text-gray-700 px-2.5 py-0.5 text-xs">
                  Budget: {typeof p.budget === "number" ? p.budget.toLocaleString() : String(p.budget)}
                </span>
              )}
            </div>

            <div className="mt-1 text-xs text-gray-500">
              {p.startDate && <>Start: {formatDate(p.startDate)} · </>}
              {p.dueDate && <>Due: {formatDate(p.dueDate)}</>}
            </div>

            <div className="mt-3">
              <button
                className="w-full inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => onRowClick?.(p.id || p._id)}
              >
                View details
              </button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

/* ----------------------------- page ----------------------------- */
export default function ProjectPage() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projects, setProjects] = useState([]);
  const [editingProject, setEditingProject] = useState(null);

  // simple client-side pagination (optional)
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(14);

  const isSmall = useMediaQuery("(max-width: 639px)"); // Tailwind <sm

  const refresh = () => getProjects().then((data) => {
    setProjects(Array.isArray(data) ? data : []);
    setPage(1); // reset to first page when data changes
  });

  useEffect(() => { refresh(); }, []);

  const handleOpenModalForNew = () => { setEditingProject(null); setIsModalOpen(true); };
  const handleOpenModalForEdit = (project) => { setEditingProject(project); setIsModalOpen(true); };
  const handleProjectAssigned = () => { refresh(); setIsModalOpen(false); };
  const handleRowClick = (id) => router.push(`/projects/${encodeURIComponent(id)}`);

  const paged = useMemo(() => {
    const start = (page - 1) * perPage;
    return projects.slice(start, start + perPage);
  }, [projects, page, perPage]);

  const handleExportPDF = async () => {
    // Lazy-load to keep initial bundle small
    const { default: jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;

    const doc = new jsPDF();
    doc.text("Projects", 14, 15);

    const rows = projects.map((p, i) => ([
      i + 1,
      p.name || "Untitled",
      p.clientName || p.client || "—",
      p.status || "—",
      formatDate(p.startDate),
      formatDate(p.dueDate),
      p.budget != null ? (typeof p.budget === "number" ? p.budget.toLocaleString() : String(p.budget)) : "—",
    ]));

    autoTable(doc, {
      head: [["#", "Name", "Client", "Status", "Start", "Due", "Budget"]],
      body: rows,
      startY: 20,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [16, 185, 129] }, // Tailwind green-500
    });

    doc.save("projects.pdf");
  };

  return (
    <div className="bg-gray-50 min-h-screen font-sans text-gray-800">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 overflow-x-hidden">
        {/* Sticky actions area for better mobile UX */}
        <div className="sticky -top-2 sm:top-0 z-20 bg-gray-50/90 backdrop-blur supports-[backdrop-filter]:bg-gray-50/60 pt-1">
          <Header onAssignProjectClick={handleOpenModalForNew} onExport={handleExportPDF} />
        </div>

        {/* Content */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <p className="text-sm text-gray-600">
              Total projects: <span className="font-medium text-gray-900">{projects.length}</span>
            </p>
          </div>

          {/* Mobile cards (<sm) vs. Table (>=sm) */}
          <div className="overflow-x-auto">
            {isSmall ? (
              <MobileProjectList
                data={paged}
                onRowClick={handleRowClick}
                onEdit={handleOpenModalForEdit}
              />
            ) : (
              <TableProject
                data={paged}
                onEdit={handleOpenModalForEdit}
                onRowClick={handleRowClick}
              />
            )}
          </div>
        </div>

        <Pagination
          total={projects.length}
          page={page}
          perPage={perPage}
          onChangePage={setPage}
          onChangePerPage={(n) => { setPerPage(n); setPage(1); }}
        />
      </main>

      <AssignProject
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onProjectAssigned={handleProjectAssigned}
        editProject={editingProject}
      />
    </div>
  );
}
