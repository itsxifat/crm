"use client";
import Link from "next/link";
import { MoreVertical } from "lucide-react";

export default function TableLead({ data = [], onEdit, onDeleted }) {
  async function handleDelete(id) {
    if (!confirm("Delete lead?")) return;
    await fetch(`/api/leads/${id}`, { method: "DELETE" });
    onDeleted?.();
  }

  return (
    <div className="overflow-x-auto border rounded-lg bg-white">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 text-gray-600">
          <tr>
            <th className="px-4 py-2">Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Status</th>
            <th className="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.length === 0 && (
            <tr><td colSpan="5" className="text-center p-4 text-gray-500">No leads found</td></tr>
          )}
          {data.map((lead) => (
            <tr key={lead._id} className="border-t hover:bg-gray-50">
              <td className="px-4 py-2 font-medium">
                <Link href={`/leads/${lead._id}`} className="text-green-600 hover:underline">
                  {lead.name}
                </Link>
              </td>
              <td>{lead.email || "—"}</td>
              <td>{lead.phone || "—"}</td>
              <td>
                <select
                  value={lead.status}
                  onChange={async (e) => {
                    await fetch(`/api/leads/${lead._id}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ status: e.target.value }),
                    });
                    onDeleted?.();
                  }}
                  className="border rounded px-2 py-1 text-sm"
                >
                  <option>Not Converted</option>
                  <option>Converted</option>
                  <option>New Lead</option>
                </select>
              </td>
              <td className="text-right">
                <button onClick={() => onEdit(lead)} className="px-2 text-blue-600">Edit</button>
                <button onClick={() => handleDelete(lead._id)} className="px-2 text-rose-600">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
