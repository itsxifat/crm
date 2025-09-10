import { Navbar } from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import "./globals.css";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="h-screen flex">
        {/* Sidebar on the left */}
        <Sidebar />

        {/* Main content area (Navbar + Page Content) */}
        <div className="flex flex-col flex-1">
          {/* Navbar at the top */}
          <Navbar />

          {/* Page Content */}
          <main className="flex-1 p-6 bg-gray-50">{children}</main>
        </div>
      </body>
    </html>
  );
}
