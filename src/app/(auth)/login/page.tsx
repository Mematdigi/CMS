"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";
import { motion } from "framer-motion";
import { Eye, EyeOff, AlertCircle, ArrowRight, TrendingUp, ChevronDown } from "lucide-react";

const loginSchema = zod.object({
  email: zod.string().email("Please enter a valid email address"),
  password: zod.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = zod.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setLoading(true);
    setError(null);
    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: data.email,
        password: data.password,
      });

      if (res?.error) {
        setError("Invalid email credentials or password.");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = (email: string) => {
    setValue("email", email);
    setValue("password", "admin123");
  };

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

        {/* Centered Telemetry Mockup Console (Removed slogan, expanded graphic elements) */}
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
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
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

      {/* Right side: Sleek White Login Form (Strict h-fit, compact UI) */}
      <div className="flex-1 md:col-span-6 lg:col-span-5 flex flex-col justify-center items-center p-6 md:p-12 lg:p-16 min-h-screen bg-slate-50 relative">
        {/* Mobile Logo */}
        <div className="md:hidden text-2xl font-black text-slate-900 mb-8 self-start flex items-center gap-1.5">
          <div className="w-6 h-6 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-xs text-white">
            Ω
          </div>
          lms.
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md bg-white border border-slate-100/50 shadow-[0_20px_50px_rgba(0,0,0,0.03)] rounded-[24px] p-7 md:p-9 relative z-10"
        >
          <div className="mb-5">
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Log in</h2>
            <p className="text-xs text-slate-400 mt-0.5 font-semibold">Please authenticate your account below</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-600 p-2.5 rounded-xl text-xs mb-3 font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Email address
              </label>
              <input
                {...register("email")}
                type="email"
                placeholder="email@company.com"
                className="w-full px-3.5 py-2 bg-slate-50/50 border border-slate-200/80 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 rounded-xl text-xs text-slate-900 placeholder-slate-400 transition-all outline-none"
              />
              {errors.email && <p className="text-[10px] text-rose-500 mt-0.5 font-semibold">{errors.email.message}</p>}
            </div>

            <div>
              <div className="relative">
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Password
                  </label>
                  <a href="/forgot-password" className="text-2xs text-indigo-600 hover:underline font-bold">
                    Forgot password?
                  </a>
                </div>
                <input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••••"
                  className="w-full pl-3.5 pr-9 py-2 bg-slate-50/50 border border-slate-200/80 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 rounded-xl text-xs text-slate-900 placeholder-slate-400 transition-all outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-[24px] text-slate-400 hover:text-slate-655 p-1"
                >
                  {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
              {errors.password && <p className="text-[10px] text-rose-500 mt-0.5 font-semibold">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-slate-900 hover:bg-slate-950 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 mt-1"
            >
              {loading ? "Authorizing Token..." : "Log In"}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Collapsible Sandbox Accounts Panel */}
          <details className="mt-4 text-left border-t border-slate-100 pt-4 group">
            <summary className="text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-2 flex items-center justify-between cursor-pointer list-none hover:text-slate-600 transition-colors">
              <span>Quick Sandbox Roles (Demo)</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-open:rotate-180 transition-transform duration-200" />
            </summary>
            
            <div className="grid grid-cols-2 gap-1.5 mt-2 transition-all">
              {[
                { role: "Super Admin", email: "super@enterprise.com" },
                { role: "Admin Rep", email: "admin@enterprise.com" },
                { role: "Sales Exec 1", email: "sales1@enterprise.com" },
                { role: "Sales Exec 2", email: "sales2@enterprise.com" },
                { role: "Team Leader", email: "leader@enterprise.com" },
                { role: "Viewer Mode", email: "viewer@enterprise.com" },
              ].map((acc) => (
                <button
                  type="button"
                  key={acc.email}
                  onClick={() => fillDemoCredentials(acc.email)}
                  className="text-left text-2xs bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-200 text-slate-600 p-1.5 rounded-lg transition-all cursor-pointer truncate"
                  title={`Click to fill ${acc.email}`}
                >
                  <div className="font-extrabold text-slate-800 text-[9px] truncate">{acc.role}</div>
                  <div className="text-[8px] text-slate-400 truncate">{acc.email}</div>
                </button>
              ))}
            </div>
          </details>

          {/* Sign Up Link */}
          <div className="mt-4 text-center text-2xs font-semibold text-slate-500">
            Need to create an account?{" "}
            <a href="/register" className="text-indigo-600 hover:underline font-bold">
              Sign Up
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
