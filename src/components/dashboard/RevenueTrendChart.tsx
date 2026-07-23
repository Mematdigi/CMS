"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

export interface RevenueTrendPoint {
  name: string;
  Target: number;
  Actual: number;
}

export default function RevenueTrendChart({ data }: { data: RevenueTrendPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorTarget" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
        <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
        <YAxis stroke="#64748b" fontSize={11} />
        <Tooltip contentStyle={{ background: "#0f172a", border: "none", borderRadius: "12px", color: "#fff", fontSize: "12px" }} />
        <Legend verticalAlign="top" height={36} iconType="circle" />
        <Area type="monotone" dataKey="Target" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorTarget)" />
        <Area type="monotone" dataKey="Actual" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorActual)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
