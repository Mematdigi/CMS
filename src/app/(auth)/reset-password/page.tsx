"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Lock, ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";

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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 relative overflow-hidden">
      {/* Subtle grid background, matching login page */}
      <div
        className="absolute inset-0 opacity-20 z-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(15, 23, 42, 0.04) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(15, 23, 42, 0.04) 1px, transparent 1px)
          `,
          backgroundSize: "28px 28px",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-white border border-slate-100/50 shadow-[0_20px_50px_rgba(0,0,0,0.03)] rounded-[24px] p-8 md:p-9 relative z-10"
      >
        <div className="text-center mb-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
            className="inline-flex items-center justify-center w-14 h-14 bg-indigo-50 border border-indigo-100 rounded-full mb-4 text-indigo-600 shadow-sm"
          >
            <Shield className="w-6 h-6" />
          </motion.div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Create New Password</h2>
          <p className="text-xs text-slate-400 mt-1.5 font-semibold">
            {!success ? "Set your new security credentials" : "Security password successfully changed"}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {!success ? (
            <motion.form
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onSubmit={handleSubmit}
              className="space-y-3.5"
            >
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    required
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-3.5 py-2 bg-slate-50/50 border border-slate-200/80 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 rounded-xl text-xs text-slate-900 placeholder-slate-400 transition-all outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    required
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-3.5 py-2 bg-slate-50/50 border border-slate-200/80 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 rounded-xl text-xs text-slate-900 placeholder-slate-400 transition-all outline-none"
                  />
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="w-full py-2 bg-slate-900 hover:bg-slate-950 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer mt-1"
              >
                Update Password
                <ArrowRight className="w-3.5 h-3.5" />
              </motion.button>
            </motion.form>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-3.5"
            >
              <div className="flex items-start gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 p-3 rounded-xl text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Your password has been reset successfully.</span>
              </div>
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push("/login")}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                Proceed to Sign In
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => router.push("/login")}
          className="mt-4 w-full py-2 bg-white hover:bg-slate-50 text-slate-600 font-bold rounded-xl text-xs border border-slate-200/80 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Login
        </button>
      </motion.div>
    </div>
  );
}
