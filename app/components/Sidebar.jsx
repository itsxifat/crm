"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BiFoodMenu } from "react-icons/bi";
import { GoHome } from "react-icons/go";
import { FaTasks } from "react-icons/fa";
import { FiUser, FiUserPlus } from "react-icons/fi";
import { MdOutlineGroup, MdOutlineGroupAdd } from "react-icons/md";

const navItems = [
  { name: "Dashboard", href: "/", icon: GoHome },
  { name: "Projects", href: "/projects", icon: FaTasks },
  { name: "Users", href: "/users", icon: FiUser },
  { name: "Add User", href: "/users/add", icon: FiUserPlus },
  { name: "Clients", href: "/clients", icon: MdOutlineGroup },
  { name: "Add Client", href: "/clients/add", icon: MdOutlineGroupAdd },
];

const Sidebar = () => {
  const pathname = usePathname();

  return (
    <div className="w-60 h-screen border-r border-[#E3E8EE] p-5">
      {/* Header */}
      <div className="flex justify-between items-center text-[#333333]">
        <div className="text-[#636363]">Navigation</div>
        <BiFoodMenu size={20} />
      </div>

      {/* Nav Links */}
      <div className="mt-10 flex flex-col gap-2 text-[#737373]">
        {navItems.map(({ name, href, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={name}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                isActive
                  ? "bg-[#E3E8EE] text-[#333333] font-medium"
                  : "hover:bg-gray-100 text-[#737373]"
              }`}
            >
              <Icon size={20} />
              <span>{name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default Sidebar;
