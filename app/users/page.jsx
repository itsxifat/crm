'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/* ---------- tiny inline icons ---------- */
const SearchIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none"
       stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);
const PlusCircleIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none"
       stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="8" x2="12" y2="16"></line>
    <line x1="8" y1="12" x2="16" y2="12"></line>
  </svg>
);
const MoreHorizontalIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none"
       stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="1"></circle>
    <circle cx="19" cy="12" r="1"></circle>
    <circle cx="5" cy="12" r="1"></circle>
  </svg>
);

/* ---------- presence helpers ---------- */
const HEARTBEAT_MS = 15000;       // send "I'm online" every 15s
const POLL_USERS_MS = 10000;      // refresh table every 10s
const ONLINE_WINDOW_MS = 20000;   // if lastSeen within 20s -> Online

function OnlineBadge({ lastSeen }) {
  const now = Date.now();
  const seen = lastSeen ? new Date(lastSeen).getTime() : 0;
  const online = seen && (now - seen) <= ONLINE_WINDOW_MS;
  const base = "px-2.5 py-0.5 text-xs font-medium rounded-full inline-block";
  const cls = online ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800";
  return <span className={`${base} ${cls}`}>{online ? "Online" : "Offline"}</span>;
}

const formatLastLogin = (dateString) => {
  if (!dateString) return 'Never';
  const date = new Date(dateString);
  return date.toLocaleString();
};

/* ---------- page ---------- */
export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // timers so we can clean up on unmount
  const hbRef = useRef(null);
  const pollRef = useRef(null);

  async function fetchUsers() {
    try {
      const res = await fetch('/api/users/list', { cache: 'no-store' });
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('users/list error:', err);
    } finally {
      setLoading(false);
    }
  }

  // presence: heartbeat + offline on tab close/hidden
  useEffect(() => {
    let unmounted = false;

    async function beat() {
      try {
        await fetch('/api/presence/heartbeat', { method: 'POST', keepalive: true });
      } catch {}
    }

    function sendOffline() {
      try {
        if (navigator.sendBeacon) {
          const blob = new Blob([JSON.stringify({ reason: 'tab-close' })], { type: 'application/json' });
          navigator.sendBeacon('/api/presence/offline', blob);
        } else {
          fetch('/api/presence/offline', { method: 'POST', keepalive: true, body: JSON.stringify({ reason: 'tab-close' }) });
        }
      } catch {}
    }

    // initial actions
    fetchUsers();
    beat();

    // repeaters
    hbRef.current = setInterval(beat, HEARTBEAT_MS);
    pollRef.current = setInterval(fetchUsers, POLL_USERS_MS);

    // immediately mark offline when user closes/hides; mark online on focus
    const onBeforeUnload = () => sendOffline();
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') sendOffline();
      else beat();
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      if (unmounted) return;
      unmounted = true;
      clearInterval(hbRef.current);
      clearInterval(pollRef.current);
      window.removeEventListener('beforeunload', onBeforeUnload);
      document.removeEventListener('visibilitychange', onVisibility);
      // best-effort offline on unmount
      sendOffline();
    };
  }, []);

  const filteredUsers = useMemo(() => {
    const q = (searchTerm || '').toLowerCase();
    return users.filter(u =>
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q)
    );
  }, [users, searchTerm]);

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const tableColumn = ["Name", "Email", "Role", "Status"];
    const tableRows = users.map(user => {
      const now = Date.now();
      const seen = user.lastSeen ? new Date(user.lastSeen).getTime() : 0;
      const online = seen && (now - seen) <= ONLINE_WINDOW_MS;
      return [
        user.name,
        user.email,
        user.role,
        online ? "Online" : "Offline"
      ];
    });

    doc.text("User List", 14, 15);
    autoTable(doc, { head: [tableColumn], body: tableRows, startY: 20 });
    doc.save("users.pdf");
  };

  return (
    <div className="bg-gray-50 min-h-screen font-sans text-gray-800">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">User Management</h1>
            <p className="mt-1 text-sm text-gray-600">Manage all users in your organization.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPDF}
              className="flex items-center justify-center gap-2 bg-white text-gray-700 border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-100 transition-colors"
            >
              Export
            </button>
            <a
              href="/users/add"
              className="flex items-center justify-center gap-2 bg-indigo-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              <PlusCircleIcon className="h-4 w-4" />
              Add User
            </a>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          {/* Search */}
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                <SearchIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="text-center py-12 text-gray-500">Loading users...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12 text-gray-500">No users found.</div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      <input type="checkbox" className="h-4 w-4 text-indigo-600 border-gray-300 rounded" />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                    <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Role</th>
                    <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Last Login</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input type="checkbox" className="h-4 w-4 text-indigo-600 border-gray-300 rounded" />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <img
                              className="h-10 w-10 rounded-full"
                              src={user.avatar || `https://placehold.co/40x40/E2E8F0/4A5568?text=??`}
                              alt=""
                            />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {/* ONLINE/OFFLINE from lastSeen freshness */}
                        <OnlineBadge lastSeen={user.lastSeen} />
                      </td>
                      <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.role}</td>
                      <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatLastLogin(user.lastLogin)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button className="text-gray-500 hover:text-indigo-600">
                          <MoreHorizontalIcon className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
