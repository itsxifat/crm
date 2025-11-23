"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Search, ChevronDown, LogIn, UserPlus, Menu } from "lucide-react"; // <-- Import Menu icon
import { motion, AnimatePresence } from "framer-motion";

function getInitials(name, email) {
  const n = (name || "").trim();
  if (n) {
    const parts = n.split(/\s+/).slice(0, 2);
    return parts.map(p => p[0]).join("").toUpperCase();
  }
  if (email) return email[0].toUpperCase();
  return "?";
}

// 1. Receive 'onToggleSidebar' prop from layout
export const Navbar = ({ onToggleSidebar }) => {
  const { data: session, status } = useSession();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const router = useRouter();

  const userName = session?.user?.name || "";
  const userEmail = session?.user?.email || "";
  const userImage = session?.user?.image || "";
  const initials = useMemo(() => getInitials(userName, userEmail), [userName, userEmail]);
  const nameFirst = useMemo(() => (userName ? userName.split(" ")[0] : ""), [userName]);

  // Close dropdown on outside click / Esc
  useEffect(() => {
    function onDocClick(e) {
      if (!dropdownRef.current) return;
      if (!dropdownRef.current.contains(e.target)) setDropdownOpen(false);
    }
    function onKey(e) {
      if (e.key === "Escape") setDropdownOpen(false);
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", onDocClick);
      document.addEventListener("keydown", onKey);
    }
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [dropdownOpen]);

  return (
    <nav className="sticky top-0 z-20 bg-white/80 backdrop-blur-md shadow-sm">
      <div className="container mx-auto flex justify-between items-center py-4 px-4 sm:px-6">
        
        {/* 2. Hamburger Menu & Logo */}
        <div className="flex items-center gap-2">
          {/* Hamburger Menu (Mobile Only) */}
          <button
            onClick={onToggleSidebar} // <-- Triggers layout state
            className="p-2 rounded-md text-gray-600 hover:bg-gray-100 md:hidden"
            aria-label="Open navigation"
          >
            <Menu size={24} />
          </button>
          
          {/* Logo (Desktop Only) */}
          <div
            className="hidden md:flex items-center cursor-pointer flex-shrink-0"
            onClick={() => router.push("/")}
            role="button"
            aria-label="Go to home"
          >
            <Image src="/logo.png" alt="App Logo" width={120} height={40} priority />
          </div>
        </div>

        {/* Search Box */}
        <div className="relative flex-grow mx-4 max-w-lg">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="search"
            placeholder="Search..."
            className="w-full pl-12 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
          />
        </div>

        {/* Profile/Login Buttons */}
        <div className="relative flex items-center gap-2 sm:gap-4">
          {/* Loading shimmer */}
          {status === "loading" && (
            <div className="h-10 w-24 rounded-full bg-gray-200/80 animate-pulse" />
          )}

          {/* Signed out (This part was already responsive, no change) */}
          {status === "unauthenticated" && (
            <>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push("/login")}
                className="flex items-center justify-center p-2.5 sm:px-4 sm:py-2 text-emerald-600 rounded-full font-medium hover:bg-emerald-50 transition sm:gap-2"
              >
                <LogIn size={20} />
                <span className="hidden sm:inline">Log In</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push("/signup")}
                className="flex items-center justify-center p-2.5 sm:px-4 sm:py-2 bg-emerald-600 text-white rounded-full font-medium shadow-md hover:bg-emerald-700 transition sm:gap-2"
              >
                <UserPlus size={20} />
                <span className="hidden sm:inline">Sign Up</span>
              </motion.button>
            </>
          )}

          {/* Signed in (This part was already responsive, no change) */}
          {status === "authenticated" && (
            <div className="relative" ref={dropdownRef}>
              <button
                className="flex items-center gap-2 cursor-pointer text-gray-700 hover:text-gray-900 transition"
                onClick={() => setDropdownOpen(o => !o)}
                aria-haspopup="menu"
                aria-expanded={dropdownOpen}
                title={userName || userEmail || "Account"}
              >
                <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white font-semibold text-lg ring-2 ring-offset-2 ring-emerald-500 overflow-hidden">
                  {userImage ? (
                    <img
                      src={userImage}
                      alt={userName || "User"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    initials
                  )}
                </div>
                <span className="font-medium hidden md:inline">
                  {nameFirst || "Account"}
                </span>
                <ChevronDown
                  size={16}
                  className={`text-gray-500 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}
                />
              </button>

              {/* Dropdown Menu */}
              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.18 }}
                    className="absolute right-0 mt-3 w-60 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden"
                    role="menu"
                    aria-label="Account Menu"
                  >
                    <div className="p-4 border-b border-gray-200">
                      <p className="font-semibold text-gray-800 truncate">
                        {userName || "Signed in"}
                      </p>
                      {userEmail ? (
                        <p className="text-sm text-gray-500 truncate">{userEmail}</p>
                      ) : null}
                    </div>
                    <button
                      onClick={() => signOut()}
                      className="w-full text-left px-4 py-3 text-red-600 font-medium hover:bg-red-50 transition"
                      role="menuitem"
                    >
                      Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};