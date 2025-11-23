"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, Plus, Check, Loader2, Trash2 } from "lucide-react";

export default function SearchableSelect({ 
  label, 
  icon: Icon, 
  value, 
  onChange, 
  options = [], 
  onAddNew, 
  onDelete, // <-- New Prop
  placeholder = "Select..." 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const dropdownRef = useRef(null);

  const filteredOptions = options.filter(opt => 
    opt.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    <div className="relative w-full" ref={dropdownRef}>
      {label && <label className="block text-xs font-medium text-gray-700 mb-1 ml-1">{label}</label>}
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-full flex items-center bg-white border border-gray-300 rounded-lg py-2.5 pl-3 pr-10 text-left focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
      >
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          {Icon && <Icon className="h-4 w-4 text-gray-400" />}
        </span>
        <span className={`block truncate pl-9 ${!value ? "text-gray-400" : "text-gray-900"}`}>
          {value || placeholder}
        </span>
        <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <ChevronDown className="h-4 w-4 text-gray-400" aria-hidden="true" />
        </span>
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
          
          <div className="sticky top-0 bg-white p-2 border-b border-gray-100 z-10">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                className="w-full border border-gray-200 rounded-md py-2 pl-8 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="Search or add new..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
            </div>
          </div>

          <div className="max-h-48 overflow-y-auto">
            {filteredOptions.map((option) => (
              <div
                key={option}
                className="group cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-emerald-50 text-gray-900 flex justify-between items-center"
                onClick={() => {
                  onChange(option);
                  setIsOpen(false);
                  setSearch("");
                }}
              >
                <span className={`block truncate ${value === option ? 'font-semibold' : 'font-normal'}`}>
                  {option}
                </span>
                
                <div className="flex items-center gap-2">
                  {/* Delete Button (Visible on Group Hover) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent selection when deleting
                      if (confirm(`Are you sure you want to delete "${option}"?`)) {
                        onDelete(option);
                      }
                    }}
                    className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove item"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>

                  {/* Selected Checkmark */}
                  {value === option && (
                    <span className="text-emerald-600 pr-4">
                      <Check className="h-4 w-4" />
                    </span>
                  )}
                </div>
              </div>
            ))}

            {search && !filteredOptions.includes(search) && (
              <button
                type="button"
                onClick={handleAdd}
                disabled={isAdding}
                className="w-full text-left flex items-center px-3 py-2 text-emerald-600 hover:bg-emerald-50 transition-colors border-t border-gray-100"
              >
                {isAdding ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                <span className="font-medium">Add "{search}"</span>
              </button>
            )}
            
            {!search && filteredOptions.length === 0 && (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">
                No options found. Type to add.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}