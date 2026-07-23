import React from "react";
import { cn } from "@/lib/cn";

type Tone = "indigo" | "emerald" | "red" | "amber" | "slate" | "violet" | "sky";

const toneClasses: Record<Tone, string> = {
  indigo: "bg-indigo-500/10 text-indigo-500",
  emerald: "bg-emerald-500/10 text-emerald-500",
  red: "bg-red-500/10 text-red-500",
  amber: "bg-amber-500/10 text-amber-500",
  slate: "bg-slate-500/10 text-slate-500",
  violet: "bg-violet-500/10 text-violet-500",
  sky: "bg-sky-500/10 text-sky-500",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

export function Badge({ className, tone = "indigo", children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wide inline-block",
        toneClasses[tone],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
