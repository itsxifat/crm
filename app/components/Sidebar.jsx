"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IoIosArrowBack } from "react-icons/io";
import {
  MdDashboard,
  MdTask,
  MdPeople,
  MdReceiptLong,
  MdAttachMoney, // Expenses
} from "react-icons/md";
import { FiUsers } from "react-icons/fi";
import { RiContactsBookLine } from "react-icons/ri"; // ← icon for Leads

const navItems = [
  { name: "Dashboard", href: "/", icon: MdDashboard },
  { name: "Projects", href: "/projects", icon: MdTask },
  { name: "Users", href: "/users", icon: FiUsers },
  { name: "Clients", href: "/clients", icon: MdPeople },
  { name: "Leads", href: "/leads", icon: RiContactsBookLine }, // ← NEW
  { name: "Invoices", href: "/invoices", icon: MdReceiptLong },
  { name: "Expenses", href: "/expenses", icon: MdAttachMoney },
];

const Sidebar = () => {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (href) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <div
      className={`h-auto bg-white border-r border-gray-200 flex flex-col transition-all duration-300 shadow-sm ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Header */}
      <div className="flex justify-between items-center p-4">
        {!collapsed && (
          <div className="text-gray-700 font-semibold text-lg">Navigation</div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 hover:bg-gray-100 rounded-md transition-transform duration-300"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <IoIosArrowBack
            size={22}
            className={`transform transition-transform duration-300 ${
              collapsed ? "rotate-180" : "rotate-0"
            } text-gray-600`}
          />
        </button>
      </div>

      {/* Nav Links */}
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
              {!collapsed && <span className="text-sm truncate">{name}</span>}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default Sidebar;
