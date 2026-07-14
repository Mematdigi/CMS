"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Shield, Mail, ArrowLeft, ArrowRight } from "lucide-react";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSent(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-indigo-950 to-slate-900 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-slate-950/70 border border-slate-800 rounded-2xl p-8 backdrop-blur-md shadow-2xl"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-500/10 border border-indigo-500/20 rounded-xl mb-4 text-indigo-400">
            <Shield className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Reset Password</h2>
          <p className="text-sm text-slate-400 mt-2">
            {!sent
              ? "Enter your corporate email address to retrieve access links"
              : "An authorization link has been forwarded to your email"}
          </p>
        </div>

        {!sent ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Corporate Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-sm text-white placeholder-slate-500 transition-all outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-medium rounded-xl text-sm transition-all flex items-center justify-center gap-2"
            >
              Send Instructions
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-sm text-center">
              Recovery link has been sent to <strong>{email}</strong>. Please check your inbox.
            </div>
            <button
              onClick={() => router.push("/reset-password?token=demo-reset-token")}
              className="w-full py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-medium rounded-xl text-sm transition-all flex items-center justify-center gap-2"
            >
              Demo: Proceed to Reset Screen
            </button>
          </div>
        )}

        <button
          onClick={() => router.push("/login")}
          className="mt-6 w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl text-sm border border-slate-800 transition-all flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Login
        </button>
      </motion.div>
    </div>
  );
}
