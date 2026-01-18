"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Loader2, ChevronRight, KeyRound } from "lucide-react";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adminSecret, setAdminSecret] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // UI State: Password visibility
  const [isLoading, setIsLoading] = useState(false); // UI State: Loading feedback
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSignup = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await axios.post("/api/auth/signup", {
        name,
        email,
        password,
        adminSecret,
      });
      // Optional: Add a success toast here
      router.push("/login");
    } catch (err) {
      setError(err.response?.data?.message || "Signup failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f9fafb] text-slate-900 flex flex-col justify-center items-center p-4 sm:p-6 font-sans">
      
      {/* Brand / Logo Placeholder - mimicking OpenAI's simple header */}
      <div className="mb-8">
        <div className="h-8 w-8 bg-black rounded-full mx-auto mb-6 flex items-center justify-center">
            {/* Abstract Logo */}
            <div className="w-4 h-4 bg-white rounded-sm transform rotate-45" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-center tracking-tight text-slate-900">
          Create your account
        </h1>
        <p className="text-slate-500 text-center mt-2 text-sm">
          Start building with our API today
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-[400px]"
      >
        <div className="bg-white p-6 sm:p-8 rounded-lg border border-slate-200 shadow-sm">
          
          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: "auto", marginBottom: 16 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                className="bg-red-50 text-red-600 px-3 py-2 rounded-md text-sm border border-red-100 flex items-center gap-2 overflow-hidden"
              >
                <div className="w-1 h-4 bg-red-500 rounded-full" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSignup} className="flex flex-col gap-4">
            
            {/* Name Input */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="name" className="text-sm font-medium text-slate-700">
                Full name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#10a37f] focus:border-transparent transition-all duration-200 placeholder:text-slate-400 text-sm"
              />
            </div>

            {/* Email Input */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-medium text-slate-700">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#10a37f] focus:border-transparent transition-all duration-200 placeholder:text-slate-400 text-sm"
              />
            </div>

            {/* Password Input */}
            <div className="flex flex-col gap-1.5 relative">
              <label htmlFor="password" className="text-sm font-medium text-slate-700">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#10a37f] focus:border-transparent transition-all duration-200 placeholder:text-slate-400 text-sm pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Admin Secret Toggle (Technical Style) */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-[#10a37f] transition-colors group"
              >
                <ChevronRight 
                    size={14} 
                    className={`transition-transform duration-200 ${showSecret ? "rotate-90" : ""}`}
                />
                Provide Admin API Key
              </button>

              <AnimatePresence>
                {showSecret && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 relative">
                      <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input
                        type="text"
                        placeholder="sk-admin-..."
                        value={adminSecret}
                        onChange={(e) => setAdminSecret(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-all duration-200 placeholder:text-slate-400 text-sm font-mono text-slate-700"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 bg-[#10a37f] hover:bg-[#0d8a6a] text-white font-medium py-2.5 rounded-md shadow-sm disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 text-sm"
            >
              {isLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                "Continue"
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center text-sm text-slate-600">
            Already have an account?{" "}
            <a href="/login" className="text-[#10a37f] hover:underline font-medium">
              Log in
            </a>
          </div>
        </div>
        
        {/* Optional simple footer links often seen on auth pages */}
        <div className="flex justify-center gap-4 mt-6 text-xs text-slate-400">
            <a href="#" className="hover:text-slate-600">Terms</a>
            <a href="#" className="hover:text-slate-600">Privacy</a>
        </div>
      </motion.div>
    </div>
  );
}