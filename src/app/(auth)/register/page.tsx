"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Shield, ArrowLeft, TrendingUp } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen overflow-y-auto bg-[#fafafa] text-slate-900 flex flex-col md:grid md:grid-cols-12 font-sans select-none">
      
      {/* Left side: Soft Aurora & Beautiful SaaS Dashboard Mockup */}
      <div className="hidden md:flex md:col-span-6 lg:col-span-7 flex-col justify-between p-10 lg:p-12 min-h-screen relative overflow-hidden bg-gradient-to-tr from-[#FFF7ED] via-[#F3E8FF] to-[#E0F2FE]">
        {/* Subtle grid background */}
        <div 
          className="absolute inset-0 opacity-20 z-0 pointer-events-none" 
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(15, 23, 42, 0.04) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(15, 23, 42, 0.04) 1px, transparent 1px)
            `,
            backgroundSize: "28px 28px"
          }}
        />

        {/* Brand Header */}
        <div className="text-xl font-black tracking-tight text-slate-900 flex items-center gap-1.5 relative z-10">
          <div className="w-7 h-7 bg-white shadow-sm border border-slate-200/50 rounded-lg flex items-center justify-center font-bold text-xs text-indigo-650">
            Ω
          </div>
          lms<span className="text-indigo-600">.</span>
        </div>

        {/* Centered Telemetry Mockup Console */}
        <div className="relative w-full max-w-sm mx-auto my-auto z-10 space-y-4">
          
          {/* Main Card: Analytics Telemetry Console */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white/75 backdrop-blur-xl border border-white/70 rounded-2xl p-6 shadow-[0_10px_35px_rgba(0,0,0,0.03)] space-y-4"
          >
            {/* Header info */}
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Active Analytics Feed</span>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[9px] text-emerald-650 font-extrabold uppercase bg-emerald-50 px-1.5 py-0.5 rounded">node_active</span>
              </div>
            </div>

            {/* Performance Stats List */}
            <div className="grid grid-cols-3 gap-2 border-b border-slate-100 pb-3">
              <div className="space-y-0.5">
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Estimated Rev.</span>
                <div className="text-sm font-extrabold text-slate-900">$184.3k</div>
              </div>
              <div className="space-y-0.5">
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Conversion</span>
                <div className="text-sm font-extrabold text-slate-900">74.8%</div>
              </div>
              <div className="space-y-0.5">
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Inbound Leads</span>
                <div className="text-sm font-extrabold text-slate-900">2,840</div>
              </div>
            </div>

            {/* High-Fidelity SVG Line Graph */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[9px] font-bold text-slate-400">
                <span>Monthly Growth Curve</span>
                <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                  <TrendingUp className="w-3 h-3 text-emerald-500" /> +18.4%
                </span>
              </div>
              <div className="h-28 flex items-end">
                <svg width="100%" height="100%" viewBox="0 0 240 100" fill="none" className="overflow-visible">
                  <defs>
                    <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366F1" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#6366F1" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  
                  {/* Grid lines */}
                  <line x1="0" y1="20" x2="240" y2="20" stroke="#F8FAFC" strokeWidth="1.5" />
                  <line x1="0" y1="50" x2="240" y2="50" stroke="#F8FAFC" strokeWidth="1.5" />
                  <line x1="0" y1="80" x2="240" y2="80" stroke="#F8FAFC" strokeWidth="1.5" />
                  
                  {/* Chart Line Path */}
                  <path
                    d="M 0 85 C 30 70, 60 20, 90 45 C 120 70, 150 15, 180 30 C 210 45, 240 10, 240 10"
                    fill="none"
                    stroke="#6366F1"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 0 85 C 30 70, 60 20, 90 45 C 120 70, 150 15, 180 30 C 210 45, 240 10, 240 10 L 240 100 L 0 100 Z"
                    fill="url(#chartGlow)"
                  />
                  
                  {/* Glowing Marker circle */}
                  <circle cx="180" cy="30" r="4.5" fill="#6366F1" stroke="#FFFFFF" strokeWidth="2" />
                </svg>
              </div>
            </div>
          </motion.div>

          {/* Secondary Card: Collaborative Team Status */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.12 }}
            className="bg-white/75 backdrop-blur-xl border border-white/70 rounded-2xl p-4 shadow-[0_10px_35px_rgba(0,0,0,0.03)] space-y-2.5"
          >
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Active Representatives</div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center justify-center text-[10px] font-bold text-indigo-650 font-mono">
                    SU
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">Yuvraj Singh</div>
                    <div className="text-[9px] text-slate-400 font-medium">Super Admin Console</div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-[9px] text-slate-500 font-bold">Online</span>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-sky-50 border border-sky-100 rounded-lg flex items-center justify-center text-[10px] font-bold text-sky-655 font-mono">
                    SL
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">Sarah Connor</div>
                    <div className="text-[9px] text-slate-400 font-medium">Sales Rep 1</div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-[9px] text-slate-500 font-bold">On Call</span>
                </div>
              </div>
            </div>
          </motion.div>

        </div>

        <div className="text-[10px] text-slate-450 font-bold relative z-10">
          © {new Date().getFullYear()} LMS CRM Suite. All Rights Reserved.
        </div>
      </div>

      {/* Right side: Sleek Warning Registration Card */}
      <div className="flex-1 md:col-span-6 lg:col-span-5 flex flex-col justify-center items-center p-6 md:p-12 lg:p-16 min-h-screen bg-slate-50 relative">
        {/* Mobile Logo */}
        <div className="md:hidden text-2xl font-black text-slate-900 mb-6 self-start flex items-center gap-1.5">
          <div className="w-6 h-6 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-xs text-white">
            Ω
          </div>
          lms.
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md bg-white border border-slate-100/50 shadow-[0_20px_50px_rgba(0,0,0,0.03)] rounded-[24px] p-8 md:p-10 text-center relative z-10"
        >
          <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-50 border border-indigo-100 rounded-full mb-4 text-indigo-600 shadow-sm">
            <Shield className="w-6 h-6" />
          </div>

          <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">Create your account</h2>
          <p className="text-xs text-slate-500 font-semibold leading-relaxed mb-6">
            New organization registration is currently closed in this demo sandbox environment. Please use the pre-configured role-testing credentials on the login screen.
          </p>

          <button
            onClick={() => router.push("/login")}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-950 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Log In
          </button>
        </motion.div>
      </div>
    </div>
  );
}
