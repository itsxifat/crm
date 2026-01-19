"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import ClientEditModal from "@/components/ClientEditModal";

export default function EditClientButton({ client }) {
  const [open, setOpen] = useState(false);

  const handleClick = (e) => {
    // Prevents the click from bubbling up (e.g., if inside a clickable table row or Link)
    e.preventDefault(); 
    e.stopPropagation();
    setOpen(true);
  };

  return (
    <>
      <button
        onClick={handleClick}
        title="Update Client Details"
        className="
          group relative inline-flex items-center justify-center gap-2 
          rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white uppercase tracking-wide
          shadow-md shadow-emerald-500/20 
          transition-all duration-200 ease-out
          hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-500/30 hover:-translate-y-0.5
          focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2
          active:scale-95 active:translate-y-0 active:shadow-sm
          whitespace-nowrap
        "
      >
        <Pencil className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-rotate-12" />
        {/* Hide text on mobile to save space, show on small screens and up */}
        <span className="hidden sm:inline">Update</span>
      </button>

      {/* Conditionally render Modal to keep DOM lightweight */}
      {open && (
        <ClientEditModal 
          open={open} 
          onClose={() => setOpen(false)} 
          client={client} 
        />
      )}
    </>
  );
}