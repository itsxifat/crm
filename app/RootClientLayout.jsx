"use client";

import { SessionProvider } from "next-auth/react";
import { usePathname } from "next/navigation";
import { Navbar } from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import { useState, useEffect } from "react"; // <-- Import hooks for state

// These are the pages that will NOT have the Sidebar/Navbar
const AUTH_PAGES = ["/login", "/signup"];

export default function RootClientLayout({ children }) {
  const pathname = usePathname();
  const isAuthPage = AUTH_PAGES.includes(pathname);

  // --- This is the new shared state ---
  // We default to `false` (closed) on mobile.
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Helper function to pass down
  const toggleSidebar = () => setIsSidebarOpen(prev => !prev);
  
  // Add a listener to close the sidebar when the route changes
  useEffect(() => {
    if (isSidebarOpen) {
      setIsSidebarOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);
  // --- End of new state logic ---

  return (
    <SessionProvider>
      {isAuthPage ? (
        // Auth pages (login, signup) - no sidebar/navbar
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
          {children}
        </div>
      ) : (
        // Protected pages - with responsive sidebar/navbar
        <div className="relative flex min-h-screen bg-gray-100/50">
          {/* The Sidebar is now controlled by state from this layout.
            It's given the 'isOpen' state and the 'onClose' toggle function.
          */}
          <Sidebar isOpen={isSidebarOpen} onClose={toggleSidebar} />
          
          <div className="flex-1 flex flex-col">
            {/* The Navbar is given the toggle function to trigger
              the sidebar from the hamburger button.
            */}
            <Navbar onToggleSidebar={toggleSidebar} />
            
            {/* Main content area */}
            <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
              {children}
            </main>
          </div>
        </div>
      )}
    </SessionProvider>
  );
}