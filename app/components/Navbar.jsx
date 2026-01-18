"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { 
  Search, ChevronDown, Menu, LogOut, User, Zap, 
  Briefcase, Building, Receipt, Loader2, Command, Settings 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- Icons Mapping ---
const ICONS = {
  User: User,
  Lead: Zap,
  Project: Briefcase,
  Client: Building,
  Expense: Receipt,
  Default: Search
};

function getInitials(name, email) {
  const n = (name || "").trim();
  if (n) {
    const parts = n.split(/\s+/).slice(0, 2);
    return parts.map(p => p[0]).join("").toUpperCase();
  }
  if (email) return email[0].toUpperCase();
  return "?";
}

export const Navbar = ({ onToggleSidebar }) => {
  const { data: session, status } = useSession();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  // Search State
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  
  const dropdownRef = useRef(null);
  const searchRef = useRef(null);
  const router = useRouter();

  const userName = session?.user?.name || "";
  const userEmail = session?.user?.email || "";
  const userImage = session?.user?.image || "";
  const initials = useMemo(() => getInitials(userName, userEmail), [userName, userEmail]);

  // --- Search Logic ---
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.trim().length > 0) {
        setIsSearching(true);
        try {
          const res = await fetch(`/api/global-search?q=${encodeURIComponent(query)}`);
          if (res.ok) {
            const data = await res.json();
            setResults(data);
            setShowResults(true);
          }
        } catch (error) {
          console.error(error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setResults([]);
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  // Close menus on outside click
  useEffect(() => {
    function onDocClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200/80">
      <div className="max-w-[1800px] mx-auto flex justify-between items-center h-16 px-4 sm:px-6">
        
        {/* LEFT: Menu & Logo */}
        <div className="flex items-center gap-5">
          <button
            onClick={onToggleSidebar}
            className="p-2 -ml-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors md:hidden"
          >
            <Menu size={20} />
          </button>
          
          <div
            className="relative h-29 w-29 cursor-pointer select-none hover:opacity-90 transition-opacity"
            onClick={() => router.push("/")}
          >
             <Image 
               src="/logo.png" 
               alt="Enfinito Logo" 
               fill 
               className="object-contain" 
               quality={100}
               priority
             />
          </div>
        </div>

        {/* CENTER: God-Level Search */}
        <div className="flex-1 max-w-xl mx-6 relative" ref={searchRef}>
          <div className="relative group">
            <Search 
              className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors duration-200 ${isSearching ? "text-[#10a37f]" : "text-slate-400 group-focus-within:text-[#10a37f]"}`} 
            />
            <input
              type="text"
              placeholder="Jump to..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if(e.target.value) setShowResults(true);
              }}
              onFocus={() => { if(query && results.length > 0) setShowResults(true); }}
              className="w-full pl-10 pr-12 py-2 bg-slate-50 border border-slate-200/50 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10a37f]/20 focus:border-[#10a37f] transition-all shadow-sm"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
               {isSearching ? (
                 <Loader2 className="h-4 w-4 text-[#10a37f] animate-spin" />
               ) : (
                 <div className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded border border-slate-200 bg-white">
                   <Command size={10} className="text-slate-400" /> 
                   <span className="text-[10px] font-medium text-slate-400">K</span>
                 </div>
               )}
            </div>
          </div>

          {/* Search Dropdown Results */}
          <AnimatePresence>
            {showResults && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.1, ease: "easeOut" }}
                className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden ring-1 ring-black/5 max-h-[70vh] overflow-y-auto custom-scrollbar z-50"
              >
                {results.length > 0 ? (
                  <div className="py-2">
                    <div className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Search Results
                    </div>
                    {results.map((item) => {
                      const Icon = ICONS[item.type] || ICONS.Default;
                      return (
                        <Link 
                          key={`${item.type}-${item.id}`} 
                          href={item.url}
                          onClick={() => { setShowResults(false); setQuery(""); }}
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors group border-l-2 border-transparent hover:border-[#10a37f]"
                        >
                          <div className={`p-2 rounded-md bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-[#10a37f] group-hover:shadow-sm transition-all`}>
                            <Icon size={16} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-slate-700 group-hover:text-slate-900 truncate">{item.title}</p>
                              <span className="text-[10px] font-medium text-slate-400 border border-slate-200 px-1.5 rounded-sm">
                                {item.type}
                              </span>
                            </div>
                            {item.subtitle && (
                              <p className="text-xs text-slate-400 truncate mt-0.5">{item.subtitle}</p>
                            )}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <Search className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">No results found for "{query}"</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT: User Profile */}
        <div className="flex items-center gap-4">
          {status === "authenticated" && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className={`flex items-center gap-2 p-1 pl-2 rounded-full border transition-all duration-200 ${dropdownOpen ? "bg-slate-50 border-slate-200 ring-2 ring-slate-100" : "bg-white border-transparent hover:bg-slate-50 hover:border-slate-200"}`}
              >
                <div className="text-right hidden sm:block leading-tight mr-1">
                   <div className="text-xs font-semibold text-slate-700">{userName.split(' ')[0]}</div>
                </div>
                {userImage ? (
                  <div className="relative h-8 w-8 rounded-full overflow-hidden border border-slate-200 shadow-sm">
                     <Image src={userImage} alt={userName} fill className="object-cover" />
                  </div>
                ) : (
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#10a37f] to-emerald-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                    {initials}
                  </div>
                )}
                <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 mr-1 ${dropdownOpen ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.1, ease: "easeOut" }}
                    className="absolute right-0 mt-2 w-64 bg-white border border-slate-100 rounded-xl shadow-xl shadow-slate-200/40 z-50 overflow-hidden origin-top-right p-1.5"
                  >
                    <div className="px-3 py-3 mb-1 bg-slate-50 rounded-lg border border-slate-100/50">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {userName || "User"}
                      </p>
                      <p className="text-xs text-slate-500 truncate font-mono mt-0.5">
                        {userEmail}
                      </p>
                    </div>
                    
                    <button className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors text-left group">
                      <Settings size={14} className="text-slate-400 group-hover:text-[#10a37f]" />
                      Account Settings
                    </button>
                    
                    <div className="h-px bg-slate-100 my-1.5" />
                    
                    <button
                      onClick={() => signOut()}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors text-left group"
                    >
                      <LogOut size={14} className="text-slate-400 group-hover:text-red-500" />
                      Log out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};