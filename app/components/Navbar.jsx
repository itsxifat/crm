import React from "react";
import { FaSearch } from "react-icons/fa";

export const Navbar = () => {
  return (
    <div className="flex justify-between items-center p-3 px-20 border-b border-[#E3E8EE]">
      <div>Logo</div>

      {/* Search Box */}
      <div className="relative w-md ">
        <FaSearch
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
          size={12}
        />
        <input
          type="search"
          placeholder="Search"
          className="w-full pl-10 pr-3 py-1 text-[#333333] border border-[#E3E8EE] rounded-md focus:border-[#737373] outline-none"
        />
      </div>

      <div>Profile</div>
    </div>
  );
};
