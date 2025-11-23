"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MdDashboard,
  MdTask,
  MdPeople,
  MdReceiptLong,
  MdAttachMoney,
} from "react-icons/md";
import { FiUsers } from "react-icons/fi";
import { RiContactsBookLine } from "react-icons/ri";
import { X } from "lucide-react"; // Import a close icon

const navItems = [
  { name: "Dashboard", href: "/", icon: MdDashboard },
  { name: "Projects", href: "/projects", icon: MdTask },
  { name: "Users", href: "/users", icon: FiUsers },
  { name: "Clients", href: "/clients", icon: MdPeople },
  { name: "Leads", href: "/leads", icon: RiContactsBookLine },
  { name: "Invoices", href: "/invoices", icon: MdReceiptLong },
  { name: "Expenses", href: "/expenses", icon: MdAttachMoney },
];

// 1. Receive 'isOpen' and 'onClose' props from the layout
const Sidebar = ({ isOpen, onClose }) => {
  const pathname = usePathname();
  // 2. The internal 'collapsed' state has been REMOVED.

  const isActive = (href) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <>
      {/* 3. Mobile Overlay: Dims the background when sidebar is open on mobile */}
      <div
        className={`fixed inset-0 z-30 bg-black/50 transition-opacity md:hidden ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* 4. Main Sidebar Container
           - 'fixed' on mobile (to slide over)
           - 'sticky' on desktop (md:)
           - Uses 'translate-x' to slide in and out on mobile
      */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 flex h-screen w-64
          flex-col border-r border-gray-200 bg-white shadow-sm
          transition-transform duration-300 ease-in-out 
          md:sticky md:translate-x-0
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Header: Now includes a mobile-only close button */}
        <div className="flex justify-between items-center p-4">
          <div className="text-gray-700 font-semibold text-lg">Navigation</div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-md md:hidden" // Hide on desktop
            aria-label="Close sidebar"
          >
            <X size={22} className="text-gray-600" />
          </button>
        </div>

        {/* Nav Links (no changes to this part) */}
        <nav className="flex flex-col gap-1 mt-4 flex-1">
          {navItems.map(({ name, href, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={name}
                href={href}
                className={`flex items-center gap-3 p-3 mx-2 rounded-lg transition-colors duration-200 ${
                  active
                    ? "bg-emerald-100 text-emerald-700 font-medium"
                    : "hover:bg-gray-100 text-gray-600"
                }`}
                aria-current={active ? "page" : undefined}
              >
                <div className="flex-shrink-0">
                  <Icon size={22} />
                </div>
                {/* 5. No 'collapsed' logic needed, it's just 'open' now.
                     The sidebar is always full-width (w-64) when it's visible.
                */}
                <span className="text-sm truncate">{name}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;