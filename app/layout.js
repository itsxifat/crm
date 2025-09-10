"use client"; // Needed because SessionProvider is a Client Component

import { SessionProvider } from "next-auth/react";
import { Navbar } from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import "./globals.css";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="h-screen flex flex-col">
        {/* Wrap your app with SessionProvider for NextAuth */}
        <SessionProvider>
          {/* Full width Navbar on top */}
          <Navbar />

          {/* Content below Navbar */}
          <div className="flex flex-1">
            {/* Sidebar on the left */}
            <Sidebar />

            {/* Main content area */}
            <main className="flex-1 p-6 bg-gray-50">{children}</main>
          </div>
        </SessionProvider>
      </body>
    </html>
  );
}
