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
  onAddNew,
  onDelete,
  className = ""
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value || "");
  const [saving, setSaving] = useState(false);

  const displayValue = type === "date" && value 
    ? new Date(value).toLocaleDateString("en-GB", { day: 'numeric', month: 'short', year: 'numeric' })
    : value || <span className="text-gray-300 italic">Empty</span>;
    
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

  return (
    <div className={`py-3 border-b border-gray-100 last:border-0 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {Icon && <Icon className="h-3.5 w-3.5 text-gray-400" />}
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
              {label}
            </span>
          </div>

          {!isEditing ? (
            <div className="text-sm font-medium text-gray-900 break-words pl-5.5">
              {displayValue}
            </div>
          ) : (
            <div className="mt-1 pl-5.5 animate-in fade-in duration-200">
              <div className="flex gap-2">
                <div className="flex-1">
                  {type === "select" || type === "service" || type === "category" ? (
                    <SearchableSelect 
                      value={tempValue}
                      onChange={setTempValue}
                      options={options}
                      onAddNew={onAddNew}
                      onDelete={onDelete}
                      placeholder={`Select ${label}...`}
                    />
                  ) : type === "textarea" ? (
                    <textarea
                      className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 outline-none transition-shadow"
                      rows={3}
                      autoFocus
                      value={tempValue}
                      onChange={(e) => setTempValue(e.target.value)}
                    />
                  ) : (
                    <input
                      type={type}
                      className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 outline-none transition-shadow"
                      autoFocus
                      value={inputValue}
                      onChange={(e) => setTempValue(e.target.value)}
                    />
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="p-1.5 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 shadow-sm transition-colors"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => { setIsEditing(false); setTempValue(value || ""); }}
                    className="p-1.5 bg-white border border-gray-200 text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex-shrink-0 pt-1">
          {!isEditing && (
            <button 
              onClick={() => { setTempValue(value || ""); setIsEditing(true); }}
              className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
              title="Edit"
            >
              <Edit2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}