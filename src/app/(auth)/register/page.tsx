"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Shield, ArrowLeft } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-indigo-950 to-slate-900 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-slate-950/70 border border-slate-800 rounded-2xl p-8 backdrop-blur-md shadow-2xl text-center"
      >
        <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-500/10 border border-indigo-500/20 rounded-xl mb-4 text-indigo-400">
          <Shield className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Enterprise CRM Registration</h2>
        <p className="text-sm text-slate-400 mt-2">
          New tenant registration is closed in the demo sandbox environment. Please use the pre-configured role accounts.
        </p>

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
