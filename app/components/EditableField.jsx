"use client";

import { useState } from "react";
import { Edit2, Check, X, Loader2 } from "lucide-react";
import SearchableSelect from "./SearchableSelect";

export default function EditableField({ 
  label, 
  value, 
  icon: Icon, 
  type = "text", 
  options = [], 
  onSave, 
  onAddNew 
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value || "");
  const [saving, setSaving] = useState(false);

  // Format date for display vs input
  const displayValue = type === "date" && value 
    ? new Date(value).toLocaleDateString() 
    : value || "—";
    
  const inputValue = type === "date" && tempValue 
    ? new Date(tempValue).toISOString().split("T")[0] 
    : tempValue;

  const handleSave = async () => {
    // Don't save if nothing changed
    if (tempValue === value) {
      setIsEditing(false);
      return;
    }

    setSaving(true);
    try {
      await onSave(tempValue);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to save", error);
      alert("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setTempValue(value || ""); // Reset
    setIsEditing(false);
  };

  return (
    <div className="group flex flex-col p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
      {/* Label Row */}
      <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {label}
      </div>

      {/* Content Row */}
      <div className="min-h-[28px] flex items-center">
        {!isEditing ? (
          // --- READ MODE ---
          <div className="flex-1 flex justify-between items-center gap-2">
            <div className={`text-sm font-medium text-gray-900 break-words w-full ${!value && "text-gray-400 italic"}`}>
              {displayValue}
            </div>
            {/* Edit Icon: Visible on hover (desktop) or always (mobile) */}
            <button 
              onClick={() => {
                setTempValue(value || ""); // Init temp value
                setIsEditing(true);
              }}
              className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-all"
              title={`Edit ${label}`}
            >
              <Edit2 className="h-4 w-4" />
            </button>
          </div>
        ) : (
          // --- EDIT MODE ---
          <div className="flex-1 w-full flex items-start gap-2">
            <div className="flex-1">
              {type === "select" || type === "service" || type === "category" ? (
                <div className="w-full">
                  <SearchableSelect 
                    value={tempValue}
                    onChange={setTempValue}
                    options={options}
                    onAddNew={onAddNew}
                    placeholder={`Select ${label}...`}
                  />
                </div>
              ) : type === "textarea" ? (
                <textarea
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  rows={3}
                  value={tempValue}
                  onChange={(e) => setTempValue(e.target.value)}
                />
              ) : (
                <input
                  type={type}
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={inputValue}
                  onChange={(e) => setTempValue(e.target.value)}
                />
              )}
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col gap-1">
              <button
                onClick={handleSave}
                disabled={saving}
                className="p-1.5 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors disabled:opacity-50"
                title="Save"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              </button>
              <button
                onClick={handleCancel}
                disabled={saving}
                className="p-1.5 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition-colors"
                title="Cancel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}