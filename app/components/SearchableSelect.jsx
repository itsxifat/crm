"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, Plus, Check, Loader2, Trash2, X } from "lucide-react";
import { createPortal } from "react-dom";

export default function SearchableSelect({ 
  label, 
  icon: Icon, 
  value, 
  onChange, 
  options = [], 
  onAddNew, 
  onDelete, 
  placeholder = "Select..." 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  
  const triggerRef = useRef(null);
  const inputRef = useRef(null);

  // Filter options
  const filteredOptions = options.filter(opt => 
    opt.toLowerCase().includes(search.toLowerCase())
  );

  // Calculate position on open
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const heightNeeded = 300;
      
      // Decide if we flip up or down
      const showAbove = spaceBelow < heightNeeded && rect.top > heightNeeded;

      setCoords({
        left: rect.left,
        top: showAbove ? rect.top - 8 : rect.bottom + 8, // slight offset
        width: rect.width,
        placement: showAbove ? "bottom" : "top" // Helper for animation direction
      });

      // Auto focus input
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isOpen]);

  // Close on outside click/scroll
  useEffect(() => {
    if (!isOpen) return;
    const handleGlobalClick = (e) => {
      // If clicking inside the trigger, do nothing (let onClick handle toggle)
      if (triggerRef.current?.contains(e.target)) return;
      // If clicking inside the dropdown portal, do nothing
      if (e.target.closest('.searchable-select-dropdown')) return;
      setIsOpen(false);
    };
    const handleScroll = () => setIsOpen(false); // Close on scroll to avoid detached UI

    window.addEventListener("mousedown", handleGlobalClick);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      window.removeEventListener("mousedown", handleGlobalClick);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [isOpen]);

  const handleAdd = async () => {
    if (!search.trim()) return;
    setIsAdding(true);
    try {
      await onAddNew(search);
      onChange(search);
      setSearch("");
      setIsOpen(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="w-full font-sans">
      
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`group relative w-full flex items-center bg-white border rounded-md py-2 pl-3 pr-8 text-left transition-all duration-200
          ${isOpen 
            ? "border-[#10a37f] ring-1 ring-[#10a37f]" 
            : "border-gray-200 hover:border-gray-300"
          }
        `}
      >
        <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none">
          {Icon && <Icon className={`h-4 w-4 transition-colors ${isOpen ? "text-[#10a37f]" : "text-gray-400"}`} />}
        </span>
        <span className={`block truncate text-sm pl-7 ${!value ? "text-gray-400" : "text-gray-900"}`}>
          {value || placeholder}
        </span>
        <span className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none">
          <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
        </span>
      </button>

      {/* Portal Dropdown (Fixed Position) */}
      {isOpen && createPortal(
        <div 
          className="searchable-select-dropdown fixed z-[9999] bg-white shadow-xl rounded-lg border border-gray-100 ring-1 ring-black/5 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-100"
          style={{
            top: coords.placement === "bottom" ? 'auto' : coords.top,
            bottom: coords.placement === "bottom" ? (window.innerHeight - coords.top) : 'auto',
            left: coords.left,
            width: coords.width,
            maxHeight: '300px'
          }}
        >
          {/* Search Header */}
          <div className="p-2 border-b border-gray-50 shrink-0">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                className="w-full bg-gray-50 border-none rounded-md py-1.5 pl-8 pr-8 text-sm text-gray-900 placeholder:text-gray-400 focus:ring-1 focus:ring-[#10a37f] focus:bg-white transition-all outline-none"
                placeholder="Find or create..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button 
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-2 p-0.5 text-gray-400 hover:text-gray-600 rounded-full"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          {/* Options List */}
          <div className="overflow-y-auto p-1 scrollbar-thin scrollbar-thumb-gray-200">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <div
                  key={option}
                  className={`group flex items-center justify-between px-3 py-2 text-sm rounded-md cursor-pointer transition-colors
                    ${value === option ? "bg-[#10a37f]/10 text-[#10a37f] font-medium" : "text-gray-700 hover:bg-gray-50"}
                  `}
                  onClick={() => {
                    onChange(option);
                    setIsOpen(false);
                    setSearch("");
                  }}
                >
                  <span className="truncate mr-2">{option}</span>
                  <div className="flex items-center gap-2">
                    {value === option && <Check className="h-3.5 w-3.5" />}
                    {onDelete && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Delete "${option}"?`)) onDelete(option);
                        }}
                        className="p-1 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : !search && (
              <div className="px-4 py-6 text-center">
                <p className="text-xs text-gray-400">Type to search options</p>
              </div>
            )}

            {/* Create New Action */}
            {search && !filteredOptions.includes(search) && (
              <button
                type="button"
                onClick={handleAdd}
                disabled={isAdding}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 mt-1 text-sm font-medium text-[#10a37f] bg-emerald-50/50 hover:bg-emerald-50 rounded-md transition-colors"
              >
                {isAdding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                <span>Create "{search}"</span>
              </button>
            )}
          </div>
        </div>,
        document.body // Portal to Body to avoid overflow clipping
      )}
    </div>
  );
}