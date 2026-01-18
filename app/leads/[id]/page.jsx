"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, User, Building, Phone, Mail, MapPin, Globe, 
  Calendar, Tag, FileText, Send, MessageSquare, Briefcase, Layers, 
  Clock, ChevronRight, Loader2, Hash, Activity, ChevronDown, Link as LinkIcon, Plus, Trash2 
} from "lucide-react";
import EditableField from "@/components/EditableField";
import ConvertToClientModal from "@/components/ConvertToClientModal"; // Import the modal

// --- Configuration ---
const STATUS_OPTIONS = [
  "New Lead", "Contacted", "Qualified", "Proposal Sent", 
  "Negotiation", "Closed - Won", "Closed - Lost", "Follow-Up"
];

// --- Sub-Components ---

function StatusBadge({ status, onChange }) {
  const getStyle = (s) => {
    switch (s) {
      case "New Lead": return "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100";
      case "Qualified": return "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100";
      case "Closed - Won": return "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100";
      case "Closed - Lost": return "bg-red-50 text-red-700 border-red-200 hover:bg-red-100";
      default: return "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100";
    }
  };

  return (
    <div className="relative inline-block w-40">
      <select
        value={status}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full appearance-none pl-3 pr-8 py-1.5 text-xs font-bold uppercase tracking-wide rounded-md border cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#10a37f]/20 transition-all ${getStyle(status)}`}
      >
        {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 opacity-50">
        <ChevronDown className="h-3 w-3" />
      </div>
    </div>
  );
}

function SectionTitle({ title }) {
  return (
    <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3 border-b border-gray-100 pb-1">
      {title}
    </h3>
  );
}

// Helper to handle links array
function LinksEditor({ links, onSave }) {
  const [list, setList] = useState(links || []);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => setList(links || []), [links]);

  const handleChange = (idx, val) => {
    const newList = [...list];
    newList[idx] = val;
    setList(newList);
  };

  const handleAdd = () => setList([...list, ""]);
  const handleRemove = (idx) => setList(list.filter((_, i) => i !== idx));

  const save = async () => {
    const cleanList = list.filter(l => l.trim() !== "");
    await onSave(cleanList);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="bg-gray-50 p-3 rounded-lg border border-[#10a37f]/30 space-y-2">
        {list.map((link, idx) => (
          <div key={idx} className="flex gap-2">
            <input 
              className="flex-1 text-xs p-2 rounded border border-gray-200 focus:ring-1 focus:ring-[#10a37f] outline-none"
              value={link}
              onChange={(e) => handleChange(idx, e.target.value)}
              placeholder="https://..."
            />
            <button onClick={() => handleRemove(idx)} className="text-red-400 hover:text-red-600"><Trash2 size={14}/></button>
          </div>
        ))}
        <div className="flex justify-between mt-2">
          <button onClick={handleAdd} className="text-xs flex items-center gap-1 text-[#10a37f] font-medium"><Plus size={12}/> Add Link</button>
          <button onClick={save} className="text-xs bg-[#10a37f] text-white px-3 py-1 rounded">Save</button>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative">
      <SectionTitle title="Digital Presence" />
      <div className="space-y-1.5">
        {links?.length > 0 ? links.map((l, i) => (
          <a key={i} href={l} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs text-blue-600 hover:underline truncate">
            <LinkIcon size={12} className="text-gray-400"/> {l}
          </a>
        )) : <span className="text-xs text-gray-400 italic">No links added</span>}
      </div>
      <button 
        onClick={() => setIsEditing(true)} 
        className="absolute top-0 right-0 p-1 text-gray-400 hover:text-[#10a37f] opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}

export default function LeadDetailsPage() {
  const { id } = useParams();
  const router = useRouter(); // For redirection after conversion
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // State for Conversion Modal
  const [showConvertModal, setShowConvertModal] = useState(false);

  // Attribute Options State
  const [attributes, setAttributes] = useState({
    services: [], categories: [], sources: [], platforms: [], references: []
  });

  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const commentsEndRef = useRef(null);
  const [activeTab, setActiveTab] = useState("overview"); 

  // --- Fetching Logic ---
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
        setAttributes({
          services: attrData.services || [],
          categories: attrData.categories || [],
          sources: attrData.sources || [],
          platforms: attrData.platforms || [],
          references: attrData.references || []
        });

      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  useEffect(() => {
    if (activeTab === "overview" && commentsEndRef.current) {
        commentsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [lead?.comments, activeTab]);

  // --- Handlers ---
  const handleSave = async (field, value) => {
    // INTERCEPT: If status is set to "Closed - Won", open modal first
    if (field === "status" && value === "Closed - Won") {
      setShowConvertModal(true);
      return; 
    }

    try {
      setLead(prev => ({ ...prev, [field]: value }));
      await fetch(`/api/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
    } catch (e) { alert("Failed to save"); }
  };

  const handleAttribute = async (method, type, name) => {
    try {
      const url = `/api/leads/attributes${method === 'DELETE' ? `?type=${type}&name=${encodeURIComponent(name)}` : ''}`;
      const opts = { method: method === 'DELETE' ? 'DELETE' : 'POST', headers: { "Content-Type": "application/json" } };
      if (method === 'POST') opts.body = JSON.stringify({ type, name });
      
      await fetch(url, opts);
      
      const mapKey = { service: 'services', category: 'categories', source: 'sources', platform: 'platforms', reference: 'references' }[type];
      
      if (method === 'POST') {
        setAttributes(prev => ({ ...prev, [mapKey]: [...prev[mapKey], name].sort() }));
      } else {
        setAttributes(prev => ({ ...prev, [mapKey]: prev[mapKey].filter(i => i !== name) }));
      }

    } catch (e) { console.error(e); }
  };

  const postComment = async (e) => {
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
    } finally { setSubmittingComment(false); }
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-6 w-6 text-[#10a37f] animate-spin" />
        <span className="text-xs text-gray-400 font-mono">LOADING DATA...</span>
      </div>
    </div>
  );
  
  if (!lead) return <div className="p-10 text-center text-gray-500">Lead not found</div>;

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-[#10a37f]/10 selection:text-[#10a37f]">
      
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-100 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <Link href="/leads" className="p-2 -ml-2 rounded-md text-gray-400 hover:text-gray-900 hover:bg-gray-50 transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">
                <Link href="/leads" className="hover:text-[#10a37f] transition-colors">Leads</Link>
                <ChevronRight className="h-3 w-3" />
                <span className="truncate">{lead.company || "Prospect"}</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900 truncate tracking-tight">{lead.name}</h1>
            </div>
          </div>
          <div className="flex items-center gap-4 self-end sm:self-auto">
            <div className="hidden sm:block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Status</div>
            <StatusBadge status={lead.status} onChange={(v) => handleSave("status", v)} />
          </div>
        </div>

        {/* Mobile Tabs */}
        <div className="flex lg:hidden mt-6 border-b border-gray-100 gap-8">
           {["overview", "details"].map(tab => (
             <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-colors ${activeTab === tab ? "border-[#10a37f] text-[#10a37f]" : "border-transparent text-gray-400 hover:text-gray-600"}`}
             >
               {tab}
             </button>
           ))}
        </div>
      </header>

      {/* Main Workspace */}
      <main className="max-w-7xl mx-auto p-4 sm:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* LEFT: Context & Activity (8/12) */}
          <div className={`lg:col-span-8 space-y-10 ${activeTab === "details" ? "hidden lg:block" : "block"}`}>
            
            <section className="group">
               <div className="flex items-center gap-2 mb-3 text-gray-400 group-focus-within:text-[#10a37f] transition-colors">
                  <FileText className="h-4 w-4" />
                  <h3 className="text-xs font-bold uppercase tracking-widest">Executive Summary</h3>
               </div>
               <div className="bg-gray-50/50 rounded-lg border border-gray-200/60 p-1 focus-within:bg-white focus-within:ring-1 focus-within:ring-[#10a37f] focus-within:border-[#10a37f] transition-all">
                 <EditableField 
                    value={lead.note} 
                    type="textarea" 
                    onSave={(v) => handleSave("note", v)} 
                    className="border-none bg-transparent hover:bg-transparent px-4 min-h-[120px] text-base" 
                  />
               </div>
            </section>

            <section>
               <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Activity className="h-4 w-4" />
                    <h3 className="text-xs font-bold uppercase tracking-widest">Activity Log</h3>
                  </div>
               </div>
               
               <div className="bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col h-[600px]">
                 <div className="flex-1 p-6 space-y-6 overflow-y-auto custom-scrollbar">
                   <div className="relative border-l-2 border-gray-100 ml-2 space-y-8 pb-4 pl-8">
                     {lead.comments?.length === 0 && (
                       <div className="py-8"><p className="text-gray-400 text-sm italic">No recent activity recorded.</p></div>
                     )}
                     {lead.comments?.map((c, i) => (
                       <div key={i} className="relative group">
                         <div className="absolute -left-[41px] top-1.5 h-5 w-5 rounded-full bg-white border-2 border-gray-100 flex items-center justify-center group-hover:border-[#10a37f] transition-colors z-10">
                           <div className="h-1.5 w-1.5 rounded-full bg-gray-300 group-hover:bg-[#10a37f] transition-colors" />
                         </div>
                         <div className="flex flex-col gap-2">
                            <div className="flex items-baseline justify-between">
                               <span className="text-sm font-bold text-gray-900">{c.author}</span>
                               <span className="text-[10px] text-gray-400 font-mono">
                                 {new Date(c.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                               </span>
                            </div>
                            <div className="text-sm text-gray-600 leading-relaxed bg-gray-50/50 p-4 rounded-lg border border-gray-100/50 group-hover:border-[#10a37f]/20 transition-colors">
                              {c.text}
                            </div>
                         </div>
                       </div>
                     ))}
                     <div ref={commentsEndRef} />
                   </div>
                 </div>

                 <div className="p-4 border-t border-gray-100 bg-gray-50/30 rounded-b-lg shrink-0">
                   <form onSubmit={postComment} className="relative">
                      <textarea
                        className="w-full p-4 pr-14 text-sm bg-white border border-gray-200 rounded-lg focus:ring-1 focus:ring-[#10a37f] focus:border-[#10a37f] outline-none resize-none shadow-sm transition-all placeholder:text-gray-400"
                        rows="2"
                        placeholder="Add a note or log an interaction..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && postComment(e)}
                        disabled={submittingComment}
                      />
                      <button type="submit" disabled={!newComment.trim() || submittingComment} className="absolute bottom-2 right-2 p-2 bg-[#10a37f] text-white rounded-md hover:bg-[#0e906f] disabled:opacity-50 disabled:bg-gray-200 disabled:text-gray-400 transition-all">
                        {submittingComment ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      </button>
                   </form>
                 </div>
               </div>
            </section>
          </div>

          {/* RIGHT: Sidebar (4/12) */}
          <div className={`lg:col-span-4 space-y-10 ${activeTab === "overview" ? "hidden lg:block" : "block"}`}>
            
            <div>
               <SectionTitle title="Primary Contact" />
               <div className="space-y-1">
                  <EditableField label="Email" value={lead.email} icon={Mail} onSave={(v) => handleSave("email", v)} />
                  <EditableField label="Phone" value={lead.phone} icon={Phone} onSave={(v) => handleSave("phone", v)} />
                  <EditableField label="Alt Phone" value={lead.alternativePhone} icon={Phone} onSave={(v) => handleSave("alternativePhone", v)} />
                  <EditableField label="Location" value={lead.location} icon={MapPin} onSave={(v) => handleSave("location", v)} />
                  <EditableField label="Company" value={lead.company} icon={Building} onSave={(v) => handleSave("company", v)} />
                  <EditableField label="Designation" value={lead.designation} icon={User} onSave={(v) => handleSave("designation", v)} />
               </div>
            </div>

            <div>
               <LinksEditor links={lead.links} onSave={(v) => handleSave("links", v)} />
            </div>

            <div>
               <SectionTitle title="Deal Context" />
               <div className="space-y-1">
                  <EditableField label="Service" value={lead.service} icon={Briefcase} type="service" options={attributes.services} onAddNew={(n) => handleAttribute('POST', 'service', n)} onDelete={(n) => handleAttribute('DELETE', 'service', n)} onSave={(v) => handleSave("service", v)} />
                  <EditableField label="Category" value={lead.category} icon={Layers} type="category" options={attributes.categories} onAddNew={(n) => handleAttribute('POST', 'category', n)} onDelete={(n) => handleAttribute('DELETE', 'category', n)} onSave={(v) => handleSave("category", v)} />
                  <EditableField label="Source" value={lead.source} icon={Globe} type="select" options={attributes.sources} onAddNew={(n) => handleAttribute('POST', 'source', n)} onDelete={(n) => handleAttribute('DELETE', 'source', n)} onSave={(v) => handleSave("source", v)} />
                  <EditableField label="Platform" value={lead.platform} icon={Tag} type="select" options={attributes.platforms} onAddNew={(n) => handleAttribute('POST', 'platform', n)} onDelete={(n) => handleAttribute('DELETE', 'platform', n)} onSave={(v) => handleSave("platform", v)} />
                  <EditableField label="Reference" value={lead.reference} icon={Hash} type="select" options={attributes.references} onAddNew={(n) => handleAttribute('POST', 'reference', n)} onDelete={(n) => handleAttribute('DELETE', 'reference', n)} onSave={(v) => handleSave("reference", v)} />
               </div>
            </div>

            <div>
               <SectionTitle title="Timeline" />
               <div className="space-y-1">
                  <EditableField label="Lead Date" value={lead.date} icon={Calendar} type="date" onSave={(v) => handleSave("date", v)} />
                  <EditableField label="Sent Date" value={lead.sendingDate} icon={Calendar} type="date" onSave={(v) => handleSave("sendingDate", v)} />
                  <EditableField label="Follow Up" value={lead.followupDate} icon={Clock} type="date" onSave={(v) => handleSave("followupDate", v)} />
               </div>
            </div>

          </div>
        </div>
      </main>

      {/* Render the Conversion Modal if status changes */}
      {showConvertModal && (
        <ConvertToClientModal 
          lead={lead} 
          onClose={() => setShowConvertModal(false)}
          onSuccess={(clientId) => {
             // Redirect to the new client page
             router.push(`/clients/${clientId}`);
          }}
        />
      )}
    </div>
  );
}