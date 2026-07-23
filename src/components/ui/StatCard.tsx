"use client";

import React from "react";
import { motion } from "framer-motion";
import { TrendingUp, type LucideIcon } from "lucide-react";
import { CountUp } from "./CountUp";

export type StatTone = "indigo" | "violet" | "sky" | "emerald" | "amber" | "rose";

const TONE_MAP: Record<StatTone, { text: string; iconBg: string; ring: string; hex: string }> = {
  indigo: { text: "text-indigo-500", iconBg: "from-indigo-500/25 to-indigo-500/5", ring: "ring-indigo-500/10", hex: "#6366f1" },
  violet: { text: "text-violet-500", iconBg: "from-violet-500/25 to-violet-500/5", ring: "ring-violet-500/10", hex: "#8b5cf6" },
  sky: { text: "text-sky-500", iconBg: "from-sky-500/25 to-sky-500/5", ring: "ring-sky-500/10", hex: "#0ea5e9" },
  emerald: { text: "text-emerald-500", iconBg: "from-emerald-500/25 to-emerald-500/5", ring: "ring-emerald-500/10", hex: "#10b981" },
  amber: { text: "text-amber-500", iconBg: "from-amber-500/25 to-amber-500/5", ring: "ring-amber-500/10", hex: "#f59e0b" },
  rose: { text: "text-rose-500", iconBg: "from-rose-500/25 to-rose-500/5", ring: "ring-rose-500/10", hex: "#f43f5e" },
};

export interface StatCardProps {
  title: string;
  value: number | string;
  desc?: string;
  icon: LucideIcon;
  tone?: StatTone;
  delay?: number;
  prefix?: string;
  suffix?: string;
}

export function StatCard({ title, value, desc, icon: Icon, tone = "indigo", delay = 0, prefix = "", suffix = "" }: StatCardProps) {
  const numericValue = typeof value === "string" ? parseFloat(value.replace(/[^0-9.-]/g, "")) : value;
  const isNumeric = !Number.isNaN(numericValue) && typeof value !== "string";
  const t = TONE_MAP[tone];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -3 }}
      style={{ "--glow-color": t.hex } as React.CSSProperties}
      className="relative bg-card border border-border p-6 rounded-2xl flex items-center justify-between shadow-sm card-glow transition-shadow overflow-hidden"
    >
      {/* Tone accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1" style={{ background: t.hex, opacity: 0.7 }} />

      <div className="space-y-2 min-w-0">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block truncate">
          {title}
        </span>
        <div className="text-3xl font-extrabold tabular-nums">
          {isNumeric ? <CountUp value={numericValue} prefix={prefix} suffix={suffix} /> : value}
        </div>
        {desc && (
          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            {desc}
          </span>
        )}
      </div>
      <motion.div
        whileHover={{ rotate: 6, scale: 1.05 }}
        transition={{ type: "spring", stiffness: 300, damping: 15 }}
        className={`w-12 h-12 bg-gradient-to-br ${t.iconBg} ${t.text} ring-1 ${t.ring} rounded-xl flex items-center justify-center shrink-0`}
      >
        <Icon className="w-6 h-6" />
      </motion.div>
    </motion.div>
  );
}
