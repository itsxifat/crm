"use client";

import { useState } from "react";
import { Check, X, Loader2 } from "lucide-react";
import SearchableSelect from "./SearchableSelect";

export default function EditableField({ 
  label, 
  value, 
  icon: Icon, 
  type = "text", 
  options = [], 
  onSave, 
  onAddNew,
  onDelete,
  className = ""
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value || "");
  const [saving, setSaving] = useState(false);

  // Formatting for display
  const displayValue = type === "date" && value 
    ? new Date(value).toLocaleDateString("en-US", { day: 'numeric', month: 'short', year: 'numeric' })
    : value;

  const inputValue = type === "date" && tempValue 
    ? new Date(tempValue).toISOString().split("T")[0] 
    : tempValue;

  const handleSave = async () => {
    if (tempValue === value) {
      setIsEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onSave(tempValue);
      setIsEditing(false);
    } catch (error) {
      alert("Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  // --- EDIT MODE ---
  if (isEditing) {
    return (
      <div className={`py-2 animate-in fade-in duration-100 ${className}`}>
        {label && (
           <div className="flex items-center gap-1.5 mb-1.5 ml-0.5">
             {Icon && <Icon className="h-3 w-3 text-[#10a37f]" />}
             <span className="text-[11px] font-bold text-[#10a37f] uppercase tracking-wide">{label}</span>
           </div>
        )}
        
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            {type === "select" || type === "service" || type === "category" ? (
              <SearchableSelect 
                value={tempValue}
                onChange={setTempValue}
                options={options}
                onAddNew={onAddNew}
                onDelete={onDelete}
                placeholder="Select..."
              />
            ) : type === "textarea" ? (
              <textarea
                className="w-full p-2.5 text-sm bg-white border border-[#10a37f] rounded-md shadow-sm focus:ring-1 focus:ring-[#10a37f] outline-none transition-all resize-y min-h-[80px]"
                rows={3}
                autoFocus
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
              />
            ) : (
              <input
                type={type}
                className="w-full px-2.5 py-2 text-sm bg-white border border-[#10a37f] rounded-md shadow-sm focus:ring-1 focus:ring-[#10a37f] outline-none transition-all"
                autoFocus
                value={inputValue}
                onChange={(e) => setTempValue(e.target.value)}
              />
            )}
          </div>
          <div className="flex flex-col gap-1 pt-0.5 shrink-0">
            <button
              onClick={handleSave}
              disabled={saving}
              className="p-1.5 bg-[#10a37f] text-white rounded hover:bg-[#0e906f] shadow-sm transition-colors"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            </button>
            <button
              onClick={() => { setIsEditing(false); setTempValue(value || ""); }}
              className="p-1.5 bg-white border border-gray-200 text-gray-500 rounded hover:bg-gray-50 hover:text-gray-700 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- READ-ONLY MODE (Click-to-Edit) ---
  return (
    <div 
      onClick={() => { setTempValue(value || ""); setIsEditing(true); }}
      className={`group relative py-2 px-2 -mx-2 rounded-md cursor-pointer hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200/50 ${className}`}
    >
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
             {Icon && <Icon className="h-3.5 w-3.5 text-gray-400 group-hover:text-gray-600 transition-colors" />}
             <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider group-hover:text-gray-600 transition-colors">
               {label}
             </span>
          </div>
        </div>

        <div className={`text-sm pl-5.5 leading-relaxed break-words ${!displayValue ? "text-gray-300 italic" : "text-gray-900"}`}>
           {displayValue || "Empty"}
        </div>
      </div>
    </div>
  );
}