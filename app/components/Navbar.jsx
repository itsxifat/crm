"use client";

import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export const Navbar = () => {
  const { data: session } = useSession();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const router = useRouter();

  return (
    <div className="flex justify-between items-center p-3 px-20 border-b border-[#E3E8EE] relative">
      <div className="font-bold text-xl cursor-pointer" onClick={() => router.push("/")}>Logo</div>

      {/* Search Box */}
      <div className="relative w-96">
        <input
          type="search"
          placeholder="Search"
          className="w-full border p-2 rounded-md"
        />
      </div>

      {/* Profile/Login Buttons */}
      <div className="relative">
        {!session ? (
          <div className="flex gap-3">
            <button
              onClick={() => router.push("/login")}
              className="px-4 py-1 border border-blue-500 text-blue-500 rounded-md hover:bg-blue-50"
            >
              Log In
            </button>
            <button
              onClick={() => router.push("/signup")}
              className="px-4 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Sign Up
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setDropdownOpen(!dropdownOpen)}>
            {/* User Avatar / Initial */}
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
              {session.user.name[0].toUpperCase()}
            </div>
            <span>{session.user.name}</span>

            {/* Dropdown */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                <div className="p-3 border-b border-gray-200">
                  <p className="font-semibold">{session.user.name}</p>
                  <p className="text-sm text-gray-500">{session.user.email}</p>
                </div>
                <button
                  onClick={() => signOut()}
                  className="w-full text-left px-3 py-2 text-red-500 hover:bg-red-50"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
