"use client";

import React, { useState } from "react";
import Image from "next/image";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";
import { motion } from "framer-motion";
import { Eye, EyeOff, AlertCircle, ArrowRight, ChevronDown, Users, DollarSign, Target } from "lucide-react";

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
      
      {/* Left side: real photography with a branded indigo/slate scrim */}
      <div className="hidden md:flex md:col-span-6 lg:col-span-7 flex-col justify-between p-10 lg:p-12 min-h-screen relative overflow-hidden">
        {/* Background photo (Unsplash, free to use) */}
        <Image
          src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=1400&q=80"
          alt="Sales team celebrating a closed deal"
          fill
          priority
          sizes="(min-width: 768px) 60vw, 0px"
          className="object-cover"
        />
        {/* Branded scrim for text contrast + color cohesion */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-900/70 to-indigo-950/50" />
        <div className="absolute inset-0 bg-indigo-600/10 mix-blend-multiply" />

        {/* Brand Header */}
        <div className="text-xl font-black tracking-tight text-white flex items-center gap-1.5 relative z-10">
          <div className="w-7 h-7 bg-indigo-500 shadow-md shadow-indigo-500/40 rounded-lg flex items-center justify-center font-bold text-xs text-white">
            Ω
          </div>
          lms<span className="text-indigo-400">.</span>
        </div>

        {/* Headline + glass stat strip */}
        <div className="relative z-10 max-w-md my-auto space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-3"
          >
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-indigo-300 uppercase tracking-widest bg-indigo-500/10 border border-indigo-400/20 px-2.5 py-1 rounded-full">
              <span className="relative flex w-1.5 h-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
              </span>
              Trusted by growing sales teams
            </span>
            <h1 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Every lead, every call,<br />one connected pipeline.
            </h1>
            <p className="text-sm text-slate-300 font-medium leading-relaxed">
              Manage leads, calls, WhatsApp, and your whole revenue team from a single enterprise workspace.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="grid grid-cols-3 gap-3"
          >
            {[
              { icon: Users, label: "Leads Tracked", value: "2,840" },
              { icon: DollarSign, label: "Revenue Synced", value: "$184k" },
              { icon: Target, label: "Conversion", value: "74.8%" },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/10 backdrop-blur-md border border-white/15 rounded-xl p-3 space-y-1.5">
                <stat.icon className="w-4 h-4 text-indigo-300" />
                <div className="text-base font-extrabold text-white leading-none">{stat.value}</div>
                <div className="text-[8px] font-bold text-slate-300 uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>

        <div className="text-[10px] text-slate-400 font-bold relative z-10">
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

            <motion.button
              whileHover={{ scale: loading ? 1 : 1.01 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-slate-900 hover:bg-slate-950 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 mt-1"
            >
              {loading ? "Authorizing Token..." : "Log In"}
              {loading ? (
                <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <ArrowRight className="w-3.5 h-3.5" />
              )}
            </motion.button>
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
