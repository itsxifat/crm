"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDownToLine, Plus } from "lucide-react";
import TableProject from "@/components/tableProject";
import AssignProject from "@/components/assignProject";
import { getProjects } from "@/lib/projects-utils";

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

const Pagination = ({ projectsCount }) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-6">
    <div className="text-sm text-gray-500">Showing 1 to {projectsCount} of {projectsCount} entries</div>
    <div className="flex items-center space-x-2">
      <span className="text-sm text-gray-600">Count</span>
      <select className="px-2 py-1 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-green-500">
        <option>14</option><option>25</option><option>50</option>
      </select>
      <div className="flex items-center space-x-1">
        <button className="p-2 rounded-lg text-gray-600 hover:bg-gray-100" aria-label="First page">«</button>
        <button className="p-2 rounded-lg text-gray-600 hover:bg-gray-100" aria-label="Previous page">‹</button>
        <button className="w-8 h-8 rounded-lg bg-green-600 text-white font-semibold">1</button>
        <button className="w-8 h-8 rounded-lg text-gray-700 hover:bg-gray-100">2</button>
        <button className="p-2 rounded-lg text-gray-600 hover:bg-gray-100" aria-label="Next page">›</button>
        <button className="p-2 rounded-lg text-gray-600 hover:bg-gray-100" aria-label="Last page">»</button>
      </div>
    </div>
  </div>
);

export default function ProjectPage() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projects, setProjects] = useState([]);
  const [editingProject, setEditingProject] = useState(null);

  const refresh = () => getProjects().then(setProjects);
  useEffect(() => { refresh(); }, []);

  const handleOpenModalForNew = () => { setEditingProject(null); setIsModalOpen(true); };
  const handleOpenModalForEdit = (project) => { setEditingProject(project); setIsModalOpen(true); };
  const handleProjectAssigned = () => { refresh(); setIsModalOpen(false); };

  const handleRowClick = (id) => router.push(`/projects/${encodeURIComponent(id)}`);

  return (
    <div className="bg-gray-50 min-h-screen font-sans text-gray-800">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 overflow-x-hidden">
        <Header onAssignProjectClick={handleOpenModalForNew} />
        <TableProject data={projects} onEdit={handleOpenModalForEdit} onRowClick={handleRowClick} />
        <Pagination projectsCount={projects.length} />
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
