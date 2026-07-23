"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

export interface EmployeePerformanceItem {
  name: string;
  leads: number;
  won: number;
  rev: number;
}

export default function EmployeePerformanceChart({ data }: { data: EmployeePerformanceItem[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
        <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
        <YAxis stroke="#64748b" fontSize={11} />
        <Tooltip contentStyle={{ background: "#0f172a", border: "none", borderRadius: "12px", color: "#fff", fontSize: "12px" }} />
        <Legend verticalAlign="top" height={36} iconType="circle" />
        <Bar dataKey="leads" name="Leads Handled" fill="#6366f1" radius={[8, 8, 0, 0]} />
        <Bar dataKey="won" name="Deals Closed" fill="#10b981" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
