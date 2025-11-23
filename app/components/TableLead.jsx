"use client";
import Link from "next/link";
import { Edit, Trash2 } from "lucide-react"; // Import new icons

// --- StatusBadge Component ---
function StatusBadge({ status }) {
  const map = {
    "New Lead": "bg-blue-100 text-blue-800",
    "Not Converted": "bg-gray-100 text-gray-800",
    Converted: "bg-emerald-100 text-emerald-800",
  };
  return (
    <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${map[status] || map["Not Converted"]}`}>
      {status}
    </span>
  );
}

// --- Sub-component for consistent Header styling ---
function Th({ children, className = "" }) {
  return (
    <th className={`px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider ${className}`}>
      {children}
    </th>
  );
}

// --- Sub-component for consistent Cell styling ---
function Td({ children, className = "" }) {
  // Added whitespace-nowrap to key cells, but not all
  return (
    <td className={`px-4 sm:px-6 py-4 text-sm text-gray-900 ${className}`}>
      {children}
    </td>
  );
}

export default function TableLead({ data = [], onEdit, onDeleted }) {
  
  async function handleDelete(id) {
    if (!confirm("Are you sure you want to delete this lead?")) return;
    await fetch(`/api/leads/${id}`, { method: "DELETE" });
    onDeleted?.(); // Refresh the data
  }

  // NOTE: This component doesn't seem to use onStatusChange,
  // but if it did, you'd call it from a component like StatusSelect.
  // The original file had a select box, but it was not wired to a prop.
  // I've replaced it with a read-only StatusBadge for a cleaner UI.

  return (
    // 1. THE RESPONSIVE FIX:
    //    'overflow-x-auto' allows horizontal scrolling on small screens.
    <div className="border border-gray-200 rounded-lg bg-white shadow-sm overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 text-gray-600">
          <tr>
            <Th>Name</Th>
            {/* 2. RESPONSIVE COLUMNS */}
            <Th className="hidden md:table-cell">Email</Th>
            <Th className="hidden lg:table-cell">Phone</Th>
            <Th>Status</Th>
            <Th className="text-right">Actions</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {data.length === 0 && (
            <tr>
              <td colSpan="5" className="text-center p-8 text-gray-500">
                No leads found
              </td>
            </tr>
          )}
          
          {data.map((lead) => (
            <tr key={lead._id} className="hover:bg-gray-50 transition-colors">
              <Td className="font-medium whitespace-nowrap">
                <Link href={`/leads/${lead._id}`} className="text-emerald-700 hover:underline">
                  {lead.name}
                </Link>
              </Td>
              
              <Td className="hidden md:table-cell text-gray-600">{lead.email || "—"}</Td>
              <Td className="hidden lg:table-cell text-gray-600">{lead.phone || "—"}</Td>
              
              <Td>
                {/* 3. UI FIX: Use a clean badge instead of an ugly select */}
                <StatusBadge status={lead.status} />
              </Td>
              
              <Td className="text-right whitespace-nowrap">
                {/* 4. UI FIX: Replaced text with icon buttons */}
                <button 
                  onClick={() => onEdit(lead)} 
                  className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition"
                  aria-label="Edit lead"
                >
                  <Edit size={16} />
                </button>
                <button 
                  onClick={() => handleDelete(lead._id)} 
                  className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition"
                  aria-label="Delete lead"
                >
                  <Trash2 size={16} />
                </button>
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}