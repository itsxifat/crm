import Link from "next/link";
import { notFound } from "next/navigation";
import { 
  ArrowLeft, Building, Phone, Mail, Globe, MapPin, 
  ChevronRight, Calendar, Star, FileText, User, Link as LinkIcon, History 
} from "lucide-react";
import EditClientButton from "./update.client";
import KycSection from "./kyc.client";
import { requireAdmin } from "@/lib/requireAdmin";
import { connectMongoose } from "@/lib/mongoose";
import Client from "@/models/Client";
import mongoose from "mongoose";

// --- UI Components ---

function SectionTitle({ title }) {
  return (
    <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">
      {title}
    </h3>
  );
}

function Attribute({ icon: Icon, label, value, href, isAddress }) {
  const content = href && value ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-[#10a37f] hover:underline hover:text-[#0d8a6a] transition-colors truncate block">
      {value}
    </a>
  ) : (
    <span className={!value ? "text-slate-300 italic" : "text-slate-700"}>
      {value || "Not set"}
    </span>
  );

  return (
    <div className="group py-3 first:pt-0 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 px-2 -mx-2 rounded-md transition-colors">
      <div className="flex items-center gap-2 mb-1.5">
        {Icon && <Icon className="h-3.5 w-3.5 text-slate-400 group-hover:text-[#10a37f] transition-colors" />}
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide group-hover:text-slate-700 transition-colors">
          {label}
        </span>
      </div>
      <div className={`text-sm font-medium pl-6 leading-relaxed ${isAddress ? "whitespace-pre-wrap" : "truncate"}`}>
        {content}
      </div>
    </div>
  );
}

function PriorityBadge({ priority }) {
  const styles = {
    High: "bg-rose-50 text-rose-700 border-rose-200",
    Medium: "bg-amber-50 text-amber-700 border-amber-200",
    Normal: "bg-slate-50 text-slate-700 border-slate-200"
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide border ${styles[priority] || styles.Normal}`}>
      {priority || "Normal"}
    </span>
  );
}

function ClientAvatar({ name }) {
  const initials = name ? name.substring(0, 2).toUpperCase() : "--";
  return (
    <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-200 text-slate-500 flex items-center justify-center text-xl font-bold shadow-inner">
      {initials}
    </div>
  );
}

// --- Main Page Component ---

export default async function ClientDetailsPage({ params }) {
  await requireAdmin();
  const { id } = await params;

  // 1. Direct DB Connection
  await connectMongoose();

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return notFound();
  }

  // 2. Fetch Data
  const doc = await Client.findById(id).lean();
  if (!doc) return notFound();

  // 3. Serialize Data
  const client = {
    ...doc,
    _id: doc._id.toString(),
    createdAt: doc.createdAt?.toISOString(),
    updatedAt: doc.updatedAt?.toISOString(),
    joiningDate: doc.joiningDate ? doc.joiningDate.toISOString() : null,
    // Ensure leadHistory is array
    leadHistory: Array.isArray(doc.leadHistory) ? doc.leadHistory.map(h => ({
        ...h,
        createdAt: h.createdAt ? h.createdAt.toISOString() : null
    })) : []
  };

  const addressString = [
    client.address?.line1,
    client.address?.line2,
    [client.address?.city, client.address?.state].filter(Boolean).join(", "),
    client.address?.postalCode,
    client.address?.country,
  ].filter(Boolean).join("\n");

  return (
    <div className="min-h-screen bg-[#f9fafb] text-slate-900 font-sans">
      
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/clients" className="p-2 -ml-2 rounded-md text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                <Link href="/clients" className="hover:text-[#10a37f] transition-colors">Clients</Link>
                <ChevronRight className="h-3 w-3" />
                <span className="truncate max-w-[200px]">{client.companyName || "Profile"}</span>
              </div>
              <h1 className="text-xl font-bold text-slate-900 truncate tracking-tight">{client.clientName}</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-3 self-end sm:self-auto">
             <EditClientButton client={client} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-4 sm:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Identity & Contact (4/12) */}
          <div className="lg:col-span-4 space-y-8">
            
            {/* Identity Card with Logo */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 relative overflow-hidden">
              <div className="flex items-start justify-between mb-6">
                {client.logo ? (
                  <div className="h-20 w-20 rounded-xl border border-slate-100 bg-white p-1 shadow-sm">
                     <img src={client.logo} alt="Logo" className="h-full w-full object-contain rounded-lg" />
                  </div>
                ) : (
                  <ClientAvatar name={client.clientName} /> 
                )}
                <PriorityBadge priority={client.priority} />
              </div>
              
              <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-900">{client.clientName}</h2>
                <div className="text-sm font-medium text-[#10a37f] mt-0.5">{client.designation}</div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2 font-medium">
                  <Building className="h-3.5 w-3.5" />
                  <span>{client.companyName || "No Company"}</span>
                </div>
              </div>

              <div className="space-y-1">
                <Attribute icon={Mail} label="Email Address" value={client.email} href={`mailto:${client.email}`} />
                <Attribute icon={Phone} label="Phone Number" value={client.phone} href={`tel:${client.phone}`} />
                <Attribute icon={Phone} label="Alt Phone" value={client.alternativePhone} href={`tel:${client.alternativePhone}`} />
                <Attribute icon={Calendar} label="Client Since" value={client.joiningDate ? new Date(client.joiningDate).toLocaleDateString() : null} />
              </div>
            </div>

            {/* Address Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <SectionTitle title="Location" />
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-slate-400 mt-1 shrink-0" />
                <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {addressString || <span className="text-slate-300 italic">No address provided</span>}
                </p>
              </div>
            </div>

            {/* Web Presence */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <SectionTitle title="Digital Presence" />
              <div className="space-y-1">
                <Attribute icon={Globe} label="Website" value={client.website} href={client.website} />
                {client.links?.map((link, i) => (
                   <Attribute key={i} icon={LinkIcon} label={`Link ${i+1}`} value={link} href={link} />
                ))}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: KYC & History (8/12) */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* KYC Section */}
            <section>
               <div className="flex items-center gap-2 mb-3 text-slate-400">
                  <FileText className="h-4 w-4" />
                  <h3 className="text-xs font-bold uppercase tracking-widest">KYC Documents</h3>
               </div>
               
               <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                 <KycSection clientId={client._id} />
               </div>
            </section>

            {/* Lead History */}
            {client.leadHistory && client.leadHistory.length > 0 && (
              <section>
                 <div className="flex items-center gap-2 mb-3 text-slate-400">
                    <History className="h-4 w-4" />
                    <h3 className="text-xs font-bold uppercase tracking-widest">Pre-Sales Activity</h3>
                 </div>
                 <div className="bg-slate-50 rounded-xl border border-slate-200 p-6">
                    <div className="space-y-6 relative border-l-2 border-slate-200 ml-2 pl-6">
                      {client.leadHistory.map((item, idx) => (
                        <div key={idx} className="relative group">
                          <div className="absolute -left-[31px] top-1.5 h-4 w-4 rounded-full bg-slate-200 border-2 border-slate-50 group-hover:bg-[#10a37f] transition-colors" />
                          <div className="flex justify-between items-baseline mb-1">
                             <span className="text-xs font-bold text-slate-700">{item.author}</span>
                             <span className="text-[10px] text-slate-400 font-mono">{new Date(item.createdAt).toLocaleDateString()}</span>
                          </div>
                          <div className="text-sm text-slate-600 bg-white p-3 rounded-lg border border-slate-200 shadow-sm leading-relaxed">
                            {item.text}
                          </div>
                        </div>
                      ))}
                    </div>
                 </div>
              </section>
            )}

          </div>

        </div>
      </main>
    </div>
  );
}