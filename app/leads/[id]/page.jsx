"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, User, Building2, Phone, Mail, MapPin, Link as LinkIcon, 
  Calendar, Tag, FileText, Send, MessageSquare, Briefcase, Layers, Globe, 
  Clock, ChevronRight, Loader2, Hash, Activity, Info, ChevronDown
} from "lucide-react";
import EditableField from "@/components/EditableField";

// Helper: Avatar for timeline
function Avatar({ name }) {
  const initials = name ? name.substring(0, 2).toUpperCase() : "U";
  return (
    <div className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold border-2 border-white shadow-sm shrink-0">
      {initials}
    </div>
  );
}

export default function LeadDetailsPage() {
  const { id } = useParams();
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Metadata
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);

  // Comments
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const commentsEndRef = useRef(null);
  
  // Mobile Tab State
  const [activeTab, setActiveTab] = useState("details");

  // --- Fetch Data ---
  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        const [leadRes, attrRes] = await Promise.all([
          fetch(`/api/leads/${id}`, { cache: "no-store" }),
          fetch("/api/leads/attributes")
        ]);
        if (!leadRes.ok) throw new Error("Lead not found");
        
        setLead(await leadRes.json());
        const attrData = await attrRes.json();
        if (attrData.services) setServices(attrData.services);
        if (attrData.categories) setCategories(attrData.categories);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  useEffect(() => {
    // Scroll to bottom when comments change or tab switches
    if (activeTab === "activity") {
      commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [lead?.comments, activeTab]);

  // --- Actions ---
  const handleFieldSave = async (field, value) => {
    try {
      setLead((prev) => ({ ...prev, [field]: value })); // Optimistic UI
      await fetch(`/api/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
    } catch (error) {
      alert("Failed to update.");
    }
  };

  const handleAddNewAttribute = async (type, name) => {
    try {
      await fetch("/api/leads/attributes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, name }),
      });
      if (type === 'service') setServices(prev => [...prev, name].sort());
      if (type === 'category') setCategories(prev => [...prev, name].sort());
    } catch (e) { console.error(e); }
  };

  const handleDeleteAttribute = async (type, name) => {
    try {
      await fetch(`/api/leads/attributes?type=${type}&name=${encodeURIComponent(name)}`, { method: "DELETE" });
      if (type === 'service') setServices(prev => prev.filter(i => i !== name));
      if (type === 'category') setCategories(prev => prev.filter(i => i !== name));
    } catch (e) { console.error(e); }
  };

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
    } finally {
      setSubmittingComment(false);
    }
  }

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-gray-50">
      <Loader2 className="h-8 w-8 text-emerald-600 animate-spin" />
    </div>
  );
  
  if (!lead) return <div className="p-10 text-center text-gray-500">Lead not found</div>;

  return (
    <div className="min-h-screen bg-gray-100/50 flex flex-col">
      
      {/* --- 1. Header (Relative, scrolls with page) --- */}
      <header className="bg-white border-b border-gray-200 px-4 sm:px-8 py-4 shadow-sm z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            
            {/* Breadcrumbs & Title */}
            <div className="flex items-center gap-3 min-w-0">
              <Link href="/leads" className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors shrink-0">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-0.5">
                  <span className="hidden sm:inline">Leads</span>
                  <ChevronRight className="h-3 w-3 hidden sm:inline" />
                  <span className="truncate font-medium text-gray-900">{lead.company || "Prospect"}</span>
                </div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight truncate">
                  {lead.name}
                </h1>
              </div>
            </div>

            {/* Status Pill */}
            <div className="shrink-0 flex items-center">
              <div className="relative">
                <select
                  value={lead.status}
                  onChange={(e) => handleFieldSave("status", e.target.value)}
                  className={`appearance-none pl-4 pr-9 py-2 rounded-full text-xs font-bold uppercase tracking-wide cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all border border-transparent shadow-sm
                    ${lead.status === "New Lead" ? "bg-blue-50 text-blue-700 hover:bg-blue-100" :
                      lead.status === "Converted" ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" :
                      "bg-gray-50 text-gray-700 hover:bg-gray-200"}`}
                >
                  <option value="New Lead">New Lead</option>
                  <option value="Not Converted">Not Converted</option>
                  <option value="Converted">Converted</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-current opacity-60">
                  <ChevronDown className="h-4 w-4" />
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Tabs */}
          <div className="flex lg:hidden mt-4 border-t border-gray-100 pt-2 -mb-4">
            <button 
              onClick={() => setActiveTab("details")}
              className={`flex-1 pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "details" ? "border-emerald-500 text-emerald-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
            >
              <div className="flex items-center justify-center gap-2">
                <Info className="h-4 w-4" /> Details
              </div>
            </button>
            <button 
              onClick={() => setActiveTab("activity")}
              className={`flex-1 pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "activity" ? "border-emerald-500 text-emerald-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
            >
              <div className="flex items-center justify-center gap-2">
                <Activity className="h-4 w-4" /> Activity
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* --- 2. Main Content --- */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* --- LEFT: Details Column --- */}
          <div className={`lg:col-span-8 space-y-6 ${activeTab === "activity" ? "hidden lg:block" : "block"}`}>
            
            {/* Quick Notes */}
            <div className="bg-amber-50 rounded-lg border border-amber-100 p-1">
              <EditableField 
                label="Quick Notes" 
                value={lead.note} 
                icon={FileText} 
                type="textarea" 
                onSave={(v) => handleFieldSave("note", v)}
                className="border-none bg-transparent hover:bg-amber-100/50"
              />
            </div>

            {/* Card: Contact */}
            <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/30 flex items-center gap-2">
                <User className="h-4 w-4 text-gray-400" />
                <h3 className="font-semibold text-gray-900 text-sm">Contact Info</h3>
              </div>
              <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                <EditableField label="Email" value={lead.email} icon={Mail} onSave={(v) => handleFieldSave("email", v)} />
                <EditableField label="Phone" value={lead.phone} icon={Phone} onSave={(v) => handleFieldSave("phone", v)} />
                <EditableField label="Company" value={lead.company} icon={Building2} onSave={(v) => handleFieldSave("company", v)} />
                <EditableField label="Location" value={lead.location} icon={MapPin} onSave={(v) => handleFieldSave("location", v)} />
                <div className="md:col-span-2">
                  <EditableField label="Social Link" value={lead.fbPageLink} icon={LinkIcon} onSave={(v) => handleFieldSave("fbPageLink", v)} />
                </div>
              </div>
            </section>

            {/* Card: Deal Info */}
            <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/30 flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-gray-400" />
                <h3 className="font-semibold text-gray-900 text-sm">Deal Details</h3>
              </div>
              <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                <EditableField 
                  label="Sister Concern" value={lead.service} icon={Briefcase} type="service" 
                  options={services} onAddNew={(n) => handleAddNewAttribute('service', n)} onDelete={(n) => handleDeleteAttribute('service', n)} onSave={(v) => handleFieldSave("service", v)} 
                />
                <EditableField 
                  label="Category" value={lead.category} icon={Layers} type="category" 
                  options={categories} onAddNew={(n) => handleAddNewAttribute('category', n)} onDelete={(n) => handleDeleteAttribute('category', n)} onSave={(v) => handleFieldSave("category", v)} 
                />
                <EditableField label="Source" value={lead.source} icon={Globe} onSave={(v) => handleFieldSave("source", v)} />
                <EditableField label="Platform" value={lead.platform} icon={Tag} onSave={(v) => handleFieldSave("platform", v)} />
                <EditableField label="Reference" value={lead.reference} icon={Hash} onSave={(v) => handleFieldSave("reference", v)} />
              </div>
            </section>

            {/* Card: Dates */}
            <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/30 flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-400" />
                <h3 className="font-semibold text-gray-900 text-sm">Timeline</h3>
              </div>
              <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <EditableField label="Lead Date" value={lead.date} icon={Calendar} type="date" onSave={(v) => handleFieldSave("date", v)} />
                <EditableField label="Sent Date" value={lead.sendingDate} icon={Calendar} type="date" onSave={(v) => handleFieldSave("sendingDate", v)} />
                <EditableField label="Follow Up" value={lead.followupDate} icon={Calendar} type="date" onSave={(v) => handleFieldSave("followupDate", v)} />
              </div>
            </section>
          </div>

          {/* --- RIGHT: Activity Column (4/12) --- */}
          <div className={`lg:col-span-4 ${activeTab === "details" ? "hidden lg:block" : "block"}`}>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col h-[600px] lg:h-[calc(100vh-140px)] lg:sticky lg:top-24">
              
              <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-gray-400" /> Activity
                </h3>
                <span className="bg-gray-200 text-gray-600 text-xs font-bold px-2 py-0.5 rounded-full">
                  {lead.comments?.length || 0}
                </span>
              </div>

              {/* Timeline Feed */}
              <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-gray-50/30">
                {lead.comments?.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400">
                    <MessageSquare className="h-8 w-8 mb-2 opacity-20" />
                    <p className="text-xs">No updates yet.</p>
                  </div>
                ) : (
                  lead.comments.map((c, i) => (
                    <div key={i} className="flex gap-3 group">
                      <div className="flex-shrink-0 mt-1">
                        <Avatar name={c.author} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between mb-1 gap-2">
                          <span className="text-xs font-bold text-gray-900 truncate">{c.author}</span>
                          <span className="text-[10px] text-gray-400 shrink-0">
                            {new Date(c.createdAt).toLocaleString(undefined, { 
                              month: 'short', 
                              day: 'numeric', 
                              hour: 'numeric', 
                              minute: '2-digit',
                              hour12: true // 12-hour format
                            })}
                          </span>
                        </div>
                        <div className="bg-white p-3 rounded-lg rounded-tl-none border border-gray-200 text-sm text-gray-700 whitespace-pre-wrap shadow-sm">
                          {c.text}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={commentsEndRef} />
              </div>

              {/* Comment Box */}
              <div className="p-3 bg-white border-t border-gray-200 rounded-b-xl">
                <form onSubmit={handleAddComment} className="relative">
                  <textarea
                    className="w-full p-3 pr-10 bg-gray-50 border border-transparent rounded-lg text-sm focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none resize-none transition-all placeholder:text-gray-400"
                    rows="1"
                    placeholder="Write a note..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleAddComment(e);
                      }
                    }}
                    disabled={submittingComment}
                  />
                  <button
                    type="submit"
                    disabled={!newComment.trim() || submittingComment}
                    className="absolute bottom-2 right-2 p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-md disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
                  >
                    {submittingComment ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </button>
                </form>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}