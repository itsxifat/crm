"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IoIosArrowBack } from "react-icons/io";
import { MdDashboard, MdTask, MdPeople, MdPersonAdd, MdGroupAdd } from "react-icons/md";
import { FiUsers } from "react-icons/fi";

const navItems = [
  { name: "Dashboard", href: "/", icon: MdDashboard },
  { name: "Projects", href: "/projects", icon: MdTask },
  { name: "Users", href: "/users", icon: FiUsers },
  { name: "Add User", href: "/users/add", icon: MdPersonAdd },
  { name: "Clients", href: "/clients", icon: MdPeople },
  { name: "Add Client", href: "/clients/add", icon: MdGroupAdd },
];

const Sidebar = () => {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className={`h-auto bg-white border-r border-gray-200 flex flex-col transition-all duration-300 shadow-sm ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Header */}
      <div className="flex justify-between items-center p-4">
        {!collapsed && <div className="text-gray-700 font-semibold text-lg">Navigation</div>}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 hover:bg-gray-100 rounded-md transition-transform duration-300"
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
      <div className="flex flex-col gap-1 mt-4 flex-1">
        {navItems.map(({ name, href, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={name}
              href={href}
              className={`flex items-center gap-3 p-3 mx-2 rounded-lg transition-colors duration-200 ${
                isActive
                  ? "bg-blue-100 text-blue-600 font-medium"
                  : "hover:bg-gray-100 text-gray-600"
              }`}
            >
              <div className="flex-shrink-0">
                <Icon size={22} />
              </div>
              {!collapsed && <span className="text-sm">{name}</span>}
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default Sidebar;
