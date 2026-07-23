"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

const COLORS = ["#6366f1", "#8b5cf6", "#0ea5e9", "#10b981", "#f59e0b", "#f43f5e"];

export interface FunnelPoint {
  stage: string;
  count: number;
}

export default function ConversionFunnelChart({ data }: { data: FunnelPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart layout="vertical" data={data} margin={{ left: 20 }}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
        <XAxis type="number" stroke="#64748b" fontSize={11} />
        <YAxis dataKey="stage" type="category" stroke="#64748b" fontSize={11} />
        <Tooltip contentStyle={{ background: "#0f172a", border: "none", borderRadius: "12px", color: "#fff", fontSize: "12px" }} />
        <Bar dataKey="count" fill="#6366f1" radius={[0, 8, 8, 0]}>
          {data.map((entry, index: number) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
