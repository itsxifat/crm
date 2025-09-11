'use client';

import React, { useState } from 'react';
import { useSession } from "next-auth/react";
import axios from "axios";
import toast from "react-hot-toast";

// --- Icon Components ---
const ArrowLeftIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24"
       viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
       strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>
  </svg>
);

export default function AddClientPage() {
  const { data: session } = useSession();
  const [priority, setPriority] = useState('Normal');
  const [loading, setLoading] = useState(false);

  if (!session) {
    return <div className="p-6 text-center text-red-600">You must log in first.</div>;
  }

  if (session.user.role !== "admin") {
    return <div className="p-6 text-center text-red-600">Only admins can add clients.</div>;
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    const name = form.get("name");
    const email = form.get("email");
    const phone = form.get("phone");
    const website = form.get("website");
    const pageLink = form.get("pageLink");
    const joiningDate = form.get("joiningDate");

    try {
      setLoading(true);
      await axios.post("/api/clients/add", {
        name,
        email,
        phone,
        website,
        pageLink,
        joiningDate,
        priority
      });
      toast.success("Client added successfully!");
      e.target.reset();
      setPriority("Normal");
    } catch (err) {
      toast.error(err.response?.data?.message || "Error adding client");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50/50 min-h-screen font-sans text-gray-800">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <a href="/clients"
             className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors mb-4">
            <ArrowLeftIcon className="h-4 w-4"/>
            Back to Clients
          </a>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Add New Client</h1>
          <p className="mt-1 text-sm text-gray-600">Enter the details below to create a new client record.</p>
        </div>

        {/* Form Card */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-md">
          <form onSubmit={handleFormSubmit}>
            <div className="p-6 sm:p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Name */}
                <div className="md:col-span-2">
                  <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    placeholder="Enter full name"
                    required
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 shadow-sm"
                  />
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="example@email.com"
                    required
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 shadow-sm"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                  <input
                    type="text"
                    id="phone"
                    name="phone"
                    placeholder="Enter phone number"
                    required
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 shadow-sm"
                  />
                </div>

                {/* Website */}
                <div>
                  <label htmlFor="website" className="block text-sm font-semibold text-gray-700 mb-2">Website Link</label>
                  <input
                    type="url"
                    id="website"
                    name="website"
                    placeholder="https://example.com"
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 shadow-sm"
                  />
                </div>

                {/* Page Link */}
                <div>
                  <label htmlFor="pageLink" className="block text-sm font-semibold text-gray-700 mb-2">Page Link</label>
                  <input
                    type="url"
                    id="pageLink"
                    name="pageLink"
                    placeholder="https://facebook.com/page"
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 shadow-sm"
                  />
                </div>

                {/* Joining Date */}
                <div>
                  <label htmlFor="joiningDate" className="block text-sm font-semibold text-gray-700 mb-2">Joining Date</label>
                  <input
                    type="date"
                    id="joiningDate"
                    name="joiningDate"
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 shadow-sm"
                  />
                </div>

                {/* Priority */}
                <div>
                  <label htmlFor="priority" className="block text-sm font-semibold text-gray-700 mb-2">Priority</label>
                  <select
                    id="priority"
                    name="priority"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 shadow-sm"
                  >
                    <option>High</option>
                    <option>Medium</option>
                    <option>Normal</option>
                  </select>
                </div>

              </div>
            </div>

            {/* Form Footer */}
            <div className="bg-gray-50 px-6 py-4 rounded-b-xl border-t border-gray-200 flex items-center justify-end gap-3">
              <a href="/clients"
                 className="bg-white text-gray-700 border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-100 transition-colors">
                Cancel
              </a>
              <button
                type="submit"
                disabled={loading}
                className="bg-indigo-600 text-white rounded-lg px-5 py-2 text-sm font-medium hover:bg-indigo-700 shadow-sm transition-colors"
              >
                {loading ? "Adding..." : "Add Client"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
