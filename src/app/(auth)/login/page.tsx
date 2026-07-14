"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";
import { motion } from "framer-motion";
import { Shield, Lock, Mail, AlertCircle, ArrowRight } from "lucide-react";

const loginSchema = zod.object({
  email: zod.string().email("Please enter a valid email address"),
  password: zod.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = zod.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
    <div className="min-h-screen flex items-center justify-center bg-slate-900 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-indigo-950 to-slate-900 px-4">
      {/* Dynamic particles background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[20%] left-[10%] w-72 h-72 bg-indigo-500 rounded-full blur-[100px]" />
        <div className="absolute bottom-[30%] right-[10%] w-96 h-96 bg-violet-600 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md bg-slate-950/70 border border-slate-800 rounded-2xl p-8 backdrop-blur-md shadow-2xl relative z-10"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-500/10 border border-indigo-500/20 rounded-xl mb-4 text-indigo-400">
            <Shield className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Enterprise CRM Access</h2>
          <p className="text-sm text-slate-400 mt-2">Log in using authorization credentials</p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm mb-6"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Corporate Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                {...register("email")}
                type="email"
                placeholder="name@company.com"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-sm text-white placeholder-slate-500 transition-all outline-none"
              />
            </div>
            {errors.email && (
              <p className="text-xs text-red-400 mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Password
              </label>
              <a href="/forgot-password" className="text-xs text-indigo-400 hover:underline">
                Forgot password?
              </a>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                {...register("password")}
                type="password"
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-sm text-white placeholder-slate-500 transition-all outline-none"
              />
            </div>
            {errors.password && (
              <p className="text-xs text-red-400 mt-1">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-medium rounded-xl text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? "Authorizing Token..." : "Sign In to Workspace"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-8 border-t border-slate-800 pt-6">
          <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 text-center">
            Quick-role login test accounts (Password: admin123)
          </span>
          <div className="grid grid-cols-2 gap-2">
            {[
              { role: "Super Admin", email: "super@enterprise.com" },
              { role: "Admin", email: "admin@enterprise.com" },
              { role: "Sales Exec 1", email: "sales1@enterprise.com" },
              { role: "Sales Exec 2", email: "sales2@enterprise.com" },
              { role: "Team Leader", email: "leader@enterprise.com" },
              { role: "Viewer Account", email: "viewer@enterprise.com" },
            ].map((acc) => (
              <button
                key={acc.email}
                onClick={() => fillDemoCredentials(acc.email)}
                className="text-left text-xs bg-slate-900 hover:bg-indigo-950 border border-slate-800 hover:border-indigo-800 text-slate-300 p-2 rounded-lg transition-all"
              >
                <div className="font-semibold text-indigo-400">{acc.role}</div>
                <div className="text-[10px] text-slate-500 truncate">{acc.email}</div>
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
