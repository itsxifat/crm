"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, User, Building2, Phone, Mail, MapPin, Link as LinkIcon, Calendar, Tag, FileText, Send, MessageSquare, Briefcase, Layers, Globe } from "lucide-react";
import EditableField from "@/components/EditableField";

export default function LeadDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Attributes for Dropdowns
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);

  // Comment State
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  // --- 1. Fetch Data (Lead + Attributes) ---
  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        const [leadRes, attrRes] = await Promise.all([
          fetch(`/api/leads/${id}`, { cache: "no-store" }),
          fetch("/api/leads/attributes")
        ]);

        if (!leadRes.ok) throw new Error("Lead not found");
        
        const leadData = await leadRes.json();
        const attrData = await attrRes.json();

        setLead(leadData);
        if (attrData.services) setServices(attrData.services);
        if (attrData.categories) setCategories(attrData.categories);
      } catch (e) {
        console.error(e);
        if (!lead) setLead(null); // Only clear if initial load
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // --- 2. Handle Inline Save ---
  const handleFieldSave = async (field, value) => {
    try {
      // Optimistic update
      setLead((prev) => ({ ...prev, [field]: value }));

      const res = await fetch(`/api/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });

      if (!res.ok) throw new Error("Failed to update");
    } catch (error) {
      console.error("Update failed", error);
      // Revert logic could go here, usually a toast is enough
      alert("Failed to update field");
    }
  };

  // --- 3. Handle New Attribute Creation (Inline) ---
  const handleAddNewAttribute = async (type, name) => {
    try {
      await fetch("/api/leads/attributes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, name }),
      });
      // Update local lists
      if (type === 'service') setServices(prev => [...prev, name].sort());
      if (type === 'category') setCategories(prev => [...prev, name].sort());
    } catch (e) {
      console.error("Failed to create attribute", e);
    }
  };

  // --- 4. Handle Comments ---
  async function handleAddComment(e) {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmittingComment(true);
    try {
      const res = await fetch(`/api/leads/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newComment }),
      });
      if (res.ok) {
        const updatedComments = await res.json();
        setLead(prev => ({ ...prev, comments: updatedComments }));
        setNewComment("");
      }
    } catch (error) {
      console.error("Failed to add comment");
    } finally {
      setSubmittingComment(false);
    }
  }

  if (loading) return <div className="p-10 text-center text-gray-500">Loading details...</div>;
  if (!lead) return <div className="p-10 text-center text-gray-500">Lead not found</div>;

  const formatDate = (d) => d ? new Date(d).toLocaleDateString() : "—";

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 break-words">{lead.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            {/* Editable Status Badge */}
            <div className="relative group">
              <select
                value={lead.status}
                onChange={(e) => handleFieldSave("status", e.target.value)}
                className={`appearance-none pl-3 pr-8 py-1 rounded-full text-xs font-bold uppercase tracking-wide cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-emerald-500 transition-all
                  ${lead.status === "New Lead" ? "bg-blue-100 text-blue-800" :
                    lead.status === "Converted" ? "bg-emerald-100 text-emerald-800" :
                    "bg-gray-100 text-gray-800"}`}
              >
                <option value="New Lead">New Lead</option>
                <option value="Not Converted">Not Converted</option>
                <option value="Converted">Converted</option>
              </select>
              {/* Custom arrow for select */}
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-600">
                <svg className="fill-current h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
              </div>
            </div>
            
            {lead.date && <span className="text-sm text-gray-500">Added on {formatDate(lead.date)}</span>}
          </div>
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <Link href="/leads" className="flex-1 sm:flex-none justify-center inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 text-sm font-medium shadow-sm transition-all">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left Columns (Details) */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* Contact Information */}
          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <EditableField label="Email" value={lead.email} icon={Mail} onSave={(v) => handleFieldSave("email", v)} />
              <EditableField label="Phone" value={lead.phone} icon={Phone} onSave={(v) => handleFieldSave("phone", v)} />
              <EditableField label="Company" value={lead.company} icon={Building2} onSave={(v) => handleFieldSave("company", v)} />
              <EditableField label="Location" value={lead.location} icon={MapPin} onSave={(v) => handleFieldSave("location", v)} />
              <EditableField label="FB Page Link" value={lead.fbPageLink} icon={LinkIcon} onSave={(v) => handleFieldSave("fbPageLink", v)} />
            </div>
          </section>

          {/* Lead Details */}
          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Lead Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <EditableField label="Source" value={lead.source} icon={Globe} onSave={(v) => handleFieldSave("source", v)} />
              <EditableField label="Platform" value={lead.platform} icon={Tag} onSave={(v) => handleFieldSave("platform", v)} />
              <EditableField label="Reference" value={lead.reference} icon={User} onSave={(v) => handleFieldSave("reference", v)} />
              
              {/* Dropdown Fields */}
              <EditableField 
                label="Category" 
                value={lead.category} 
                icon={Layers} 
                type="category" 
                options={categories}
                onAddNew={(name) => handleAddNewAttribute('category', name)}
                onSave={(v) => handleFieldSave("category", v)} 
              />
              <EditableField 
                label="Sister Concern" 
                value={lead.service} 
                icon={Briefcase} 
                type="service" 
                options={services}
                onAddNew={(name) => handleAddNewAttribute('service', name)}
                onSave={(v) => handleFieldSave("service", v)} 
              />
            </div>
          </section>

          {/* Schedule */}
          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Schedule</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <EditableField label="Lead Date" value={lead.date} icon={Calendar} type="date" onSave={(v) => handleFieldSave("date", v)} />
              <EditableField label="Sending Date" value={lead.sendingDate} icon={Calendar} type="date" onSave={(v) => handleFieldSave("sendingDate", v)} />
              <EditableField label="Follow Up" value={lead.followupDate} icon={Calendar} type="date" onSave={(v) => handleFieldSave("followupDate", v)} />
            </div>
          </section>

          {/* Notes */}
          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">General Note</h3>
            <EditableField 
              label="Note" 
              value={lead.note} 
              icon={FileText} 
              type="textarea" 
              onSave={(v) => handleFieldSave("note", v)} 
            />
          </section>
        </div>

        {/* Right Column (Comments) - Sticky on Desktop */}
        <div className="xl:col-span-1">
          <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200 h-full flex flex-col xl:sticky xl:top-6 max-h-[800px]">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-emerald-600" />
              Comments
            </h3>

            <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
              {lead.comments?.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 py-10">
                  <MessageSquare className="h-8 w-8 mb-2 opacity-20" />
                  <p className="text-sm">No comments yet.</p>
                </div>
              ) : (
                lead.comments.map((c, i) => (
                  <div key={i} className="bg-white p-3.5 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="font-bold text-gray-800 text-xs uppercase tracking-wide">{c.author}</span>
                      <span className="text-[10px] text-gray-400">{new Date(c.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed">{c.text}</p>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleAddComment} className="relative mt-auto">
              <textarea
                className="w-full p-3 pr-12 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm resize-none shadow-sm"
                rows="3"
                placeholder="Type a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                disabled={submittingComment}
              />
              <button
                type="submit"
                disabled={!newComment.trim() || submittingComment}
                className="absolute bottom-3 right-3 p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                {submittingComment ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}