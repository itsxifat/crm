"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import ClientEditModal from "@/components/ClientEditModal";

/** Renders the green "Update" button and the modal */
export default function EditClientButton({ client }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
      >
        <Pencil className="h-4 w-4" />
        Update
      </button>

      <ClientEditModal open={open} onClose={() => setOpen(false)} client={client} />
    </>
  );
}
