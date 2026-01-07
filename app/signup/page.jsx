"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { motion } from "framer-motion";
import { User, Mail, Lock, ShieldAlert } from "lucide-react";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adminSecret, setAdminSecret] = useState(""); // State for secret key
  const [showSecret, setShowSecret] = useState(false); // Toggle visibility of secret field
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      await axios.post("/api/auth/signup", { 
        name, 
        email, 
        password,
        adminSecret // Send the secret
      });
      router.push("/login");
    } catch (err) {
      setError(err.response?.data?.message || "Signup failed");
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gradient-to-br from-indigo-50 via-gray-50 to-purple-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md p-10 bg-white/70 backdrop-blur-lg rounded-3xl shadow-2xl border border-gray-100"
      >
        <div className="flex flex-col items-center mb-8">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="p-3 bg-indigo-500 rounded-full text-white shadow-lg"
          >
            <User size={24} />
          </motion.div>
          <h2 className="text-3xl font-extrabold text-gray-900 mt-4">
              Create an Account
          </h2>
          <p className="text-center text-gray-500 mt-2">
            Enter your details below
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm font-medium border border-red-200"
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSignup} className="space-y-6">
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300 placeholder-gray-400 text-gray-800"
            />
          </div>

          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300 placeholder-gray-400 text-gray-800"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300 placeholder-gray-400 text-gray-800"
            />
          </div>

          {/* Admin Secret Toggle */}
          <div className="text-right">
            <button 
              type="button" 
              onClick={() => setShowSecret(!showSecret)}
              className="text-xs text-indigo-500 hover:text-indigo-700 font-medium"
            >
              {showSecret ? "Hide Admin Option" : "I have an Admin Key"}
            </button>
          </div>

          {/* Admin Secret Input */}
          {showSecret && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="relative"
            >
              <ShieldAlert className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500" size={20} />
              <input
                type="text"
                placeholder="Admin Secret Key"
                value={adminSecret}
                onChange={(e) => setAdminSecret(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-indigo-50 border border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300 placeholder-indigo-300 text-indigo-900"
              />
            </motion.div>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold shadow-lg hover:bg-indigo-700 transition-colors duration-200"
          >
            {showSecret && adminSecret ? "Create Admin Account" : "Sign Up"}
          </motion.button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-8">
          Already have an account?{" "}
          <a href="/login" className="text-indigo-600 font-medium hover:underline">
            Log In
          </a>
        </p>
      </motion.div>
    </div>
  );
}