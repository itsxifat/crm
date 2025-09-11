"use client";

import { useState } from "react";
import {
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  Search,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Plus,
  ArrowDownToLine,
  MoreVertical,
  Calendar,
  User,
  Tag,
  Briefcase,
  X,
} from "lucide-react";

// --- SIMULATED BACKEND API & DATABASE ---
// In a real application, this would be a separate file (e.g., app/api/projects/route.js)
// and connect to a real MongoDB database. This is for demonstration purposes only.
let mockProjectsDb = [
  {
    id: "PROJ-101",
    name: "Website Redesign",
    client: "Client A",
    assignedTo: [
      { id: "user1", initial: "PP", color: "bg-green-500" },
      { id: "user2", initial: "DS", color: "bg-red-500" },
    ],
    status: "In progress",
    startDate: "2023-01-15",
    dueDate: "2023-05-30",
  },
  {
    id: "PROJ-102",
    name: "Mobile App Development",
    client: "Client B",
    assignedTo: [
      { id: "user3", initial: "JH", color: "bg-purple-500" },
      { id: "user4", initial: "MK", color: "bg-red-500" },
      { id: "user5", initial: "RS", color: "bg-green-500" },
    ],
    status: "Completed",
    startDate: "2023-02-20",
    dueDate: "2023-06-15",
  },
  {
    id: "PROJ-103",
    name: "Marketing Campaign",
    client: "Client C",
    assignedTo: [
      { id: "user6", initial: "SA", color: "bg-yellow-500" },
    ],
    status: "In progress",
    startDate: "2023-04-10",
    dueDate: "2023-08-01",
  },
];

const mockClients = [
  "Client A",
  "Client B",
  "Client C",
  "Client D",
];

const mockUsers = [
  { id: "user1", name: "Peter Parker" },
  { id: "user2", name: "Donna Smoak" },
  { id: "user3", name: "John Holmes" },
  { id: "user4", name: "Mark Kenter" },
  { id: "user5", name: "Rose Shaw" },
  { id: "user6", name: "Sandra Allen" },
  { id: "user7", name: "Robert Downey" },
  { id: "user8", name: "Jennifer Aniston" },
];

async function assignProject(projectData) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  const newProject = {
    id: `PROJ-${Math.floor(Math.random() * 100000)}`,
    ...projectData,
    status: "In progress",
  };

  mockProjectsDb.push(newProject);
  return { success: true, project: newProject };
}

// --- FRONTEND COMPONENTS ---

const getStatusColor = (status) => {
  if (status === "In progress") return "bg-yellow-100 text-yellow-800";
  if (status === "Completed") return "bg-green-100 text-green-800";
  return "bg-gray-100 text-gray-800";
};

const Header = ({ onAssignProjectClick }) => (
  <header className="flex items-center justify-between mb-8">
    <h1 className="text-3xl font-extrabold text-gray-900">Projects</h1>
    <div className="flex space-x-4">
      <button className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
        <ArrowDownToLine size={20} />
        <span>Export</span>
      </button>
      <button
        onClick={onAssignProjectClick}
        className="flex items-center gap-2 px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
      >
        <Plus size={20} />
        <span>Assign Project</span>
      </button>
      <button className="flex items-center gap-2 px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors">
        <Plus size={20} />
        <span>Bulk assignment</span>
      </button>
    </div>
  </header>
);

const FilterBar = () => {
  const [sortOrder, setSortOrder] = useState("desc");
  const toggleSortOrder = () => setSortOrder(sortOrder === "desc" ? "asc" : "desc");
  const getSortIcon = () => (sortOrder === "desc" ? <ChevronDown size={16} /> : <ChevronUp size={16} />);

  return (
    <div className="flex items-center justify-between p-4 mb-6 bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="relative flex-1 mr-4">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="search"
          placeholder="Search users, sites, or metrics..."
          className="w-full pl-12 pr-4 py-2 rounded-lg bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
        />
      </div>
      <div className="flex space-x-4">
        <button
          onClick={toggleSortOrder}
          className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Sort by
          {getSortIcon()}
        </button>
        <button className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
          <SlidersHorizontal size={20} />
          <span>All</span>
          <ChevronDown size={16} />
        </button>
      </div>
    </div>
  );
};

const Table = ({ data }) => (
  <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-200">
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Project ID
          </th>
          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Project Name
          </th>
          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Client
          </th>
          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Assigned to
          </th>
          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Status
          </th>
          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Start Date
          </th>
          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Due Date
          </th>
          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Actions
          </th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {data.map((row) => (
          <tr key={row.id}>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.id}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.name}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.client}</td>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="flex -space-x-2 overflow-hidden">
                {row.assignedTo.map((user, idx) => (
                  <div
                    key={idx}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ring-2 ring-white ${user.color}`}
                  >
                    {user.initial}
                  </div>
                ))}
              </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(row.status)}`}>
                {row.status}
              </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.startDate}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.dueDate}</td>
            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <button className="text-gray-500 hover:text-gray-900">
                <MoreVertical size={20} />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const Pagination = () => {
  const currentPage = 1;
  const totalPages = 40;

  const renderPageNumbers = () => {
    const pages = [];
    for (let i = 1; i <= 4; i++) {
      pages.push(
        <button
          key={i}
          className={`w-8 h-8 rounded-lg ${currentPage === i ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'} hover:bg-green-500 hover:text-white transition-colors`}
        >
          {i}
        </button>
      );
    }
    return pages;
  };

  return (
    <div className="flex justify-between items-center mt-6">
      <div className="text-sm text-gray-500">
        Showing data 1 to 14 of 3792 entries
      </div>
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-600">Count</span>
        <select className="px-2 py-1 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-green-500">
          <option>14</option>
          <option>25</option>
          <option>50</option>
        </select>
        <div className="flex items-center space-x-1">
          <button className="p-2 rounded-lg text-gray-600 hover:bg-gray-200 transition-colors">
            <ChevronsLeft size={16} />
          </button>
          <button className="p-2 rounded-lg text-gray-600 hover:bg-gray-200 transition-colors">
            <ChevronLeft size={16} />
          </button>
        </div>
        {renderPageNumbers()}
        <div className="flex items-center space-x-1">
          <button className="p-2 rounded-lg text-gray-600 hover:bg-gray-200 transition-colors">
            <ChevronRight size={16} />
          </button>
          <button className="p-2 rounded-lg text-gray-600 hover:bg-gray-200 transition-colors">
            <ChevronsRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

// --- ASSIGN PROJECT MODAL COMPONENT ---
const AssignProjectModal = ({ isOpen, onClose, onProjectAssigned }) => {
  const [projectName, setProjectName] = useState("");
  const [selectedClient, setSelectedClient] = useState(mockClients[0]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const assignedTo = selectedUsers.map(userId => {
      const user = mockUsers.find(u => u.id === userId);
      return {
        id: userId,
        initial: user.name.split(' ').map(n => n[0]).join(''),
        color: `bg-${['red', 'green', 'purple', 'yellow', 'blue'][Math.floor(Math.random() * 5)]}-500`,
      };
    });

    const projectData = {
      name: projectName,
      client: selectedClient,
      assignedTo,
      startDate,
      dueDate,
    };

    const response = await assignProject(projectData);

    if (response.success) {
      onProjectAssigned(response.project);
      onClose();
    } else {
      // Handle error
      console.error("Failed to assign project");
    }
    setIsSubmitting(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-lg relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800">
          <X size={24} />
        </button>
        <h2 className="text-2xl font-bold mb-6 text-gray-900">Assign Project</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
              <div className="relative">
                <Briefcase size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
              <div className="relative">
                <Tag size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <select
                  value={selectedClient}
                  onChange={(e) => setSelectedClient(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                >
                  {mockClients.map((client) => (
                    <option key={client} value={client}>{client}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Users</label>
              <div className="relative">
                <User size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <select
                  multiple
                  value={selectedUsers}
                  onChange={(e) => {
                    const options = e.target.options;
                    const value = [];
                    for (let i = 0, l = options.length; i < l; i++) {
                      if (options[i].selected) {
                        value.push(options[i].value);
                      }
                    }
                    setSelectedUsers(value);
                  }}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                >
                  {mockUsers.map((user) => (
                    <option key={user.id} value={user.id}>{user.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex space-x-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <div className="relative">
                  <Calendar size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <div className="relative">
                  <Calendar size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
              </div>
            </div>
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-green-400"
          >
            {isSubmitting ? 'Assigning...' : 'Assign Project'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default function ProjectPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projects, setProjects] = useState(mockProjectsDb);

  const handleProjectAssigned = (newProject) => {
    setProjects(prevProjects => [newProject, ...prevProjects]);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 md:p-12">
      <Header onAssignProjectClick={() => setIsModalOpen(true)} />
      <FilterBar />
      <Table data={projects} />
      <Pagination />
      <AssignProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onProjectAssigned={handleProjectAssigned}
      />
    </div>
  );
}
