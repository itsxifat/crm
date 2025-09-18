"use client"; // Needed because SessionProvider is a Client Component

import { SessionProvider } from "next-auth/react";
import { Navbar } from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import "./globals.css";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <SessionProvider>
          {/* App shell */}
          <div className="flex min-h-screen flex-col">
            {/* Top navbar */}
            <Navbar />

            {/* Sidebar + main */}
            <div className="flex flex-1 min-h-0">
              {/* Sidebar: fixed width, never shrink, full height */}
              <aside className="flex shrink-0 min-h-screen">
                <Sidebar />
              </aside>

              {/* Main: scrollable content */}
              <main className="flex-1 min-w-0 bg-gray-50 overflow-auto">
                {children}
              </main>
            </div>
          </div>
        </SessionProvider>
      </body>
    </html>
  );
}
