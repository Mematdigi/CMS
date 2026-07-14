"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Shield, Lock, ArrowLeft, ArrowRight } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password && password === confirm) {
      setSuccess(true);
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
          <h2 className="text-2xl font-bold text-white tracking-tight">Create New Password</h2>
          <p className="text-sm text-slate-400 mt-2">
            {!success
              ? "Set your new security credentials"
              : "Security password successfully changed"}
          </p>
        </div>

        {!success ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  required
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-sm text-white placeholder-slate-500 transition-all outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  required
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-sm text-white placeholder-slate-500 transition-all outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-medium rounded-xl text-sm transition-all flex items-center justify-center gap-2"
            >
              Update Password
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-sm text-center">
              Your password has been reset successfully.
            </div>
            <button
              onClick={() => router.push("/login")}
              className="w-full py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-medium rounded-xl text-sm transition-all flex items-center justify-center gap-2"
            >
              Proceed to Sign In
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
