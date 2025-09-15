"use client";

import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ChevronDown, LogIn, UserPlus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const Navbar = () => {
  const { data: session } = useSession();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const router = useRouter();

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md shadow-sm">
      <div className="container mx-auto flex justify-between items-center py-4 px-6 md:px-12">
        {/* Logo only */}
        <div
          className="flex items-center cursor-pointer"
          onClick={() => router.push("/")}
        >
          <img
            src="/logo.png"
            alt="App Logo"
            className="h-10 w-auto"
          />
        </div>

        {/* Search Box */}
        <div className="relative flex-grow mx-8 max-w-lg">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="search"
            placeholder="Search..."
            className="w-full pl-12 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
          />
        </div>

        {/* Profile/Login Buttons */}
        <div className="relative flex items-center gap-4">
          {!session ? (
            <>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push("/login")}
                className="flex items-center gap-2 px-5 py-2 text-indigo-600 rounded-full font-medium hover:bg-indigo-50 transition"
              >
                <LogIn size={20} />
                Log In
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push("/signup")}
                className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-full font-medium shadow-md hover:bg-indigo-700 transition"
              >
                <UserPlus size={20} />
                Sign Up
              </motion.button>
            </>
          ) : (
            <div className="relative">
              <button
                className="flex items-center gap-2 cursor-pointer text-gray-700 hover:text-gray-900 transition"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                {/* User Avatar */}
                <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-semibold text-lg ring-2 ring-offset-2 ring-indigo-500">
                  {session.user.image ? (
                    <img
                      src={session.user.image}
                      alt="User Avatar"
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    session.user.name[0].toUpperCase()
                  )}
                </div>
                <span className="font-medium hidden md:inline">
                  {session.user.name.split(" ")[0]}
                </span>
                <ChevronDown
                  size={16}
                  className={`text-gray-500 transition-transform duration-200 ${
                    dropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Dropdown Menu */}
              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-3 w-60 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden"
                  >
                    <div className="p-4 border-b border-gray-200">
                      <p className="font-semibold text-gray-800">
                        {session.user.name}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {session.user.email}
                      </p>
                    </div>
                    <button
                      onClick={() => signOut()}
                      className="w-full text-left px-4 py-3 text-red-600 font-medium hover:bg-red-50 transition"
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
