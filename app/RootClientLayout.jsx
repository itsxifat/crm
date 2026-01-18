"use client";

import { SessionProvider } from "next-auth/react";
import { usePathname } from "next/navigation";
import { Navbar } from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import { useState, useEffect } from "react";

const AUTH_PAGES = ["/login", "/signup"];

export default function RootClientLayout({ children }) {
  const pathname = usePathname();
  const isAuthPage = AUTH_PAGES.includes(pathname);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const toggleSidebar = () => setIsSidebarOpen(prev => !prev);
  
  useEffect(() => {
    if (isSidebarOpen) {
      setIsSidebarOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <SessionProvider>
      {isAuthPage ? (
        // FIX: Render children directly. Let the pages handle their own layout.
        children
      ) : (
        // Protected pages - with responsive sidebar/navbar
        <div className="relative flex min-h-screen bg-gray-100/50">
          <Sidebar isOpen={isSidebarOpen} onClose={toggleSidebar} />
          
          <div className="flex-1 flex flex-col">
            <Navbar onToggleSidebar={toggleSidebar} />
            <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
              {children}
            </main>
          </div>
        </div>
      )}
    </SessionProvider>
  );
}