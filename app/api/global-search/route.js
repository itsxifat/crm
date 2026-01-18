import { NextResponse } from "next/server";
import { connectMongoose } from "@/lib/mongoose";
import User from "@/models/User";
import Lead from "@/models/Lead";
import Project from "@/models/Project";
import Client from "@/models/Client";
import Expense from "@/models/Expense";
import { requireAdmin } from "@/lib/requireAdmin";

export const dynamic = 'force-dynamic';

// Helper to escape regex special characters
function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

export async function GET(req) {
  try {
    await requireAdmin();
    await connectMongoose();
    
    const { searchParams } = new URL(req.url);
    const rawQ = searchParams.get("q");

    if (!rawQ || rawQ.trim().length < 1) {
      return NextResponse.json([]);
    }

    const q = rawQ.trim();
    const escapedQ = escapeRegex(q);
    
    // 1. Direct Partial Match (High Precision)
    // Matches "John" in "Johnson"
    const exactRegex = new RegExp(escapedQ, 'i');

    // 2. Loose Match (Typo/Relevance Helper)
    // If user types "John google", it matches records containing "John" AND "google" in any searchable field
    const terms = q.split(/\s+/).map(t => new RegExp(escapeRegex(t), 'i'));
    
    // Helper to construct query for a model
    const buildQuery = (fields) => {
      // Logic: Match exact phrase OR match all terms across any of the fields
      return {
        $or: [
          // Match any field with the full query string
          ...fields.map(f => ({ [f]: exactRegex })),
          // OR match records where ALL terms appear in at least one of the fields (simple fuzzy)
          { $and: terms.map(term => ({ $or: fields.map(f => ({ [f]: term })) })) }
        ]
      };
    };

    // Fields to search for each model
    const userFields = ["name", "email"];
    const leadFields = [
      "name", "email", "phone", "company", "designation", 
      "alternativePhone", "platform", "source", "reference", 
      "category", "service", "note"
    ];
    const projectFields = ["name", "status"]; // Populated client name handling is distinct
    const clientFields = ["clientName", "companyName", "email", "phone"];
    const expenseFields = ["title", "details"];

    // Run all queries in parallel
    const [users, leads, projects, clients, expenses] = await Promise.all([
      
      User.find(buildQuery(userFields))
        .select("name email image")
        .limit(3).lean(),

      Lead.find(buildQuery(leadFields))
        .select("name email company designation platform source")
        .limit(5).lean(), // Higher limit for leads

      // For projects, we also want to search by Client Name, which is a lookup. 
      // Basic regex search on project Name first:
      Project.find(buildQuery(projectFields))
        .populate("client", "clientName companyName")
        .select("name status client")
        .limit(3).lean(),

      Client.find(buildQuery(clientFields))
        .select("clientName companyName email phone")
        .limit(3).lean(),

      Expense.find(buildQuery(expenseFields))
        .select("title amount date")
        .limit(3).lean()
    ]);

    // Normalize Data
    const results = [
      ...users.map(u => ({ 
        type: "User", 
        id: u._id, 
        title: u.name, 
        subtitle: u.email, 
        url: `/users/${u._id}` 
      })),
      ...leads.map(l => ({ 
        type: "Lead", 
        id: l._id, 
        title: l.name, 
        subtitle: [l.designation, l.company, l.platform].filter(Boolean).join(" • ") || l.email, 
        url: `/leads/${l._id}` 
      })),
      ...projects.map(p => ({ 
        type: "Project", 
        id: p._id, 
        title: p.name, 
        subtitle: p.client?.clientName || p.status, 
        url: `/projects/${p._id}` 
      })),
      ...clients.map(c => ({ 
        type: "Client", 
        id: c._id, 
        title: c.clientName, 
        subtitle: c.companyName, 
        url: `/clients/${c._id}` 
      })),
      ...expenses.map(e => ({ 
        type: "Expense", 
        id: e._id, 
        title: e.title, 
        subtitle: `৳${e.amount} - ${new Date(e.date).toLocaleDateString()}`, 
        url: `/expenses` 
      })),
    ];

    return NextResponse.json(results);
  } catch (e) {
    console.error("Global search error:", e);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}