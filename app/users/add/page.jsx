'use client';

import React, { useState } from 'react';
import { useSession } from "next-auth/react";
import axios from "axios";
import toast from "react-hot-toast";

const ArrowLeftIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24"
       viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
       strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>
  </svg>
);

const EyeIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24"
       viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
       strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24"
       viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
       strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
    <line x1="2" x2="22" y1="2" y2="22" />
  </svg>
);

export default function AddUserPage() {
  const { data: session } = useSession();
  const [role, setRole] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!session) {
    return <div className="p-6 text-center text-red-600">You must log in first.</div>;
  }

  if (session.user.role !== "admin") {
    return <div className="p-6 text-center text-red-600">Only admins can add users.</div>;
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    const name = form.get("name");
    const email = form.get("email");
    const password = form.get("password");
    const confirmPassword = form.get("confirm-password");
    const designation = form.get("designation");
    const salary = form.get("monthly-salary");

    if (password !== confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    try {
      setLoading(true);
      await axios.post("/api/users/add", {
        name,
        email,
        password,
        role,
        designation,
        salary
      });
      toast.success("User created successfully!");
      e.target.reset();
      setRole("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Error adding user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50/50 min-h-screen font-sans text-gray-800">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <a href="/users"
             className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors mb-4">
            <ArrowLeftIcon className="h-4 w-4"/>
            Back to Users
          </a>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Add New User</h1>
          <p className="mt-1 text-sm text-gray-600">Enter the details below to create a new user account.</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-md">
          <form onSubmit={handleFormSubmit}>
            <div className="p-6 sm:p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label htmlFor="name"
                         className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    placeholder="Enter full name"
                    required
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 shadow-sm"
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="email"
                         className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="example@email.com"
                    required
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 shadow-sm"
                  />
                </div>

                <div>
                  <label htmlFor="role" className="block text-sm font-semibold text-gray-700 mb-2">Role</label>
                  <select
                    id="role"
                    name="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    required
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 shadow-sm"
                  >
                    <option value="" disabled>Select a role</option>
                    <option value="in-house">In-house</option>
                    <option value="remote">Remote</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="designation"
                         className="block text-sm font-semibold text-gray-700 mb-2">Designation</label>
                  <input
                    type="text"
                    id="designation"
                    name="designation"
                    placeholder="Job title"
                    required
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 shadow-sm"
                  />
                </div>

                {role === 'in-house' && (
                  <div className="md:col-span-2 transition-all duration-300 ease-in-out">
                    <label htmlFor="monthly-salary"
                           className="block text-sm font-semibold text-gray-700 mb-2">Monthly Salary</label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                        <span className="text-gray-500 sm:text-sm">৳</span>
                      </div>
                      <input
                        type="number"
                        id="monthly-salary"
                        name="monthly-salary"
                        placeholder="0.00"
                        className="block w-full rounded-lg border border-gray-300 bg-gray-50 pl-7 pr-12 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 shadow-sm"
                      />
                      <div className="pointer-events-none absolute inset-y-0 right-0 pr-3 flex items-center">
                        <span className="text-gray-500 sm:text-sm">BDT</span>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor="password"
                         className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      placeholder="••••••••"
                      required
                      className="block w-full rounded-lg border border-gray-300 bg-gray-50 pr-10 py-2 px-4 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 shadow-sm"
                    />
                    <button type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">
                      {showPassword ? <EyeOffIcon className="h-5 w-5"/> : <EyeIcon className="h-5 w-5"/>}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirm-password"
                         className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirm-password"
                      name="confirm-password"
                      placeholder="••••••••"
                      required
                      className="block w-full rounded-lg border border-gray-300 bg-gray-50 pr-10 py-2 px-4 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 shadow-sm"
                    />
                    <button type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">
                      {showConfirmPassword ? <EyeOffIcon className="h-5 w-5"/> : <EyeIcon className="h-5 w-5"/>}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 rounded-b-xl border-t border-gray-200 flex items-center justify-end gap-3">
              <a href="/users"
                 className="bg-white text-gray-700 border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                Cancel
              </a>
              <button
                type="submit"
                disabled={loading}
                className="bg-indigo-600 text-white rounded-lg px-5 py-2 text-sm font-medium hover:bg-indigo-700 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {loading ? "Creating..." : "Create User"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}