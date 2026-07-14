"use client";

import React, { useMemo, useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Users,
  TrendingUp,
  Clock,
  Phone,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  FileText,
  DollarSign,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { getDashboardAnalyticsAction } from "@/lib/actions/crm.actions";

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

const DEFAULT_EMPLOYEE_DATA = [
  { name: "John Sales", leads: 45, won: 12, rev: 48000 },
  { name: "Elena Rostova", leads: 52, won: 15, rev: 54000 },
  { name: "Marcus Vance", leads: 38, won: 10, rev: 38000 },
  { name: "Sarah Connor", leads: 60, won: 22, rev: 95000 },
];

const DEFAULT_CAMPAIGN_DATA = [
  { name: "Q3 Tech Summit", cost: 15000, leads: 220, roi: "2.4x" },
  { name: "AI Automations", cost: 8000, leads: 145, roi: "3.1x" },
  { name: "Direct Marketing", cost: 5000, leads: 90, roi: "1.8x" },
];

interface DashboardAnalytics {
  totalLeads: number;
  totalRevenue: number;
  conversionFunnel: { stage: string; value: number }[];
  leadSourceData: { name: string; value: number }[];
  revenueTrend: { name: string; revenue: number }[];
  employeePerformance: { name: string; leads: number; won: number; rev: number }[];
  campaignPerformance: { name: string; cost: number; leads: number; roi: string }[];
}

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);

  const fetchAnalytics = useCallback(() => {
    getDashboardAnalyticsAction()
      .then(setAnalytics)
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const employeeData = useMemo(() => {
    return analytics?.employeePerformance || DEFAULT_EMPLOYEE_DATA;
  }, [analytics]);

  const campaignData = useMemo(() => {
    return analytics?.campaignPerformance || DEFAULT_CAMPAIGN_DATA;
  }, [analytics]);

  const cards = useMemo(() => {
    const totalLeadsVal = analytics?.totalLeads ?? 0;
    const revVal = analytics?.totalRevenue ?? 0;

    return [
      {
        title: "Total Pipeline Leads",
        value: totalLeadsVal.toLocaleString(),
        desc: "Updated in real-time from Postgres",
        icon: Users,
        color: "text-indigo-500",
        bg: "bg-indigo-500/10",
      },
      {
        title: "Active Conversations",
        value: "310",
        desc: "42 pending reply",
        icon: MessageSquare,
        color: "text-emerald-500",
        bg: "bg-emerald-500/10",
      },
      {
        title: "Today's Follow-ups",
        value: "18",
        desc: "6 overdue reminder alerts",
        icon: Clock,
        color: "text-amber-500",
        bg: "bg-amber-500/10",
      },
      {
        title: "Converted Deals (WON)",
        value: (analytics?.conversionFunnel?.find((f) => f.stage === "WON")?.value ?? 0).toLocaleString(),
        desc: "Average deal conversion indicator",
        icon: CheckCircle,
        color: "text-teal-500",
        bg: "bg-teal-500/10",
      },
      {
        title: "Monthly Recurring Revenue",
        value: `$${revVal.toLocaleString()}`,
        desc: "Prisma aggregated budgets value",
        icon: DollarSign,
        color: "text-violet-500",
        bg: "bg-violet-500/10",
      },
      {
        title: "Missed Calls Logger",
        value: "4",
        desc: "Require callback",
        icon: Phone,
        color: "text-rose-500",
        bg: "bg-rose-500/10",
      },
    ];
  }, [analytics]);

  const revenueData = useMemo(() => {
    if (!analytics?.revenueTrend) return [];
    return analytics.revenueTrend.map((item) => ({
      name: item.name,
      Target: Math.round(item.revenue * 0.9),
      Actual: item.revenue,
    }));
  }, [analytics]);

  const leadSourceData = useMemo(() => {
    return analytics?.leadSourceData || [];
  }, [analytics]);

  const funnelData = useMemo(() => {
    if (!analytics?.conversionFunnel) return [];
    return analytics.conversionFunnel.map((item) => ({
      stage: item.stage,
      count: item.value,
    }));
  }, [analytics]);

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Enterprise Overview</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Real-time multi-tenant intelligence and sales pipelines metrics.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchAnalytics}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-all shadow-md"
          >
            Refresh Analytics
          </button>
        </div>
      </div>

      {/* Grid Cards metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-card border border-border p-6 rounded-2xl flex items-center justify-between hover-lift shadow-sm"
            >
              <div className="space-y-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                  {card.title}
                </span>
                <div className="text-3xl font-extrabold">{card.value}</div>
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  {card.desc}
                </span>
              </div>
              <div className={`w-12 h-12 ${card.bg} ${card.color} rounded-xl flex items-center justify-center`}>
                <Icon className="w-6 h-6" />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Charts Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales & Revenue timelines */}
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">Revenue Target vs Actual</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
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
          </div>
        </div>

        {/* Lead Source distribution */}
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">Lead Acquisition Source</h3>
          <div className="h-80 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={leadSourceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {leadSourceData.map((entry, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "#0f172a", border: "none", borderRadius: "12px", color: "#fff", fontSize: "12px" }} />
                <Legend verticalAlign="bottom" height={36} layout="horizontal" iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lead Conversion Funnel */}
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">Conversion Pipeline Funnel</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={funnelData} margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis type="number" stroke="#64748b" fontSize={11} />
                <YAxis dataKey="stage" type="category" stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ background: "#0f172a", border: "none", borderRadius: "12px", color: "#fff", fontSize: "12px" }} />
                <Bar dataKey="count" fill="#6366f1" radius={[0, 8, 8, 0]}>
                  {funnelData.map((entry, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Employee target stats */}
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">Top Employee Performance</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={employeeData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ background: "#0f172a", border: "none", borderRadius: "12px", color: "#fff", fontSize: "12px" }} />
                <Legend verticalAlign="top" height={36} iconType="circle" />
                <Bar dataKey="leads" name="Leads Handled" fill="#6366f1" radius={[8, 8, 0, 0]} />
                <Bar dataKey="won" name="Deals Closed" fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Campaigns list */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">Campaign Performance Metrics</h3>
        <div className="overflow-x-auto border border-border rounded-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-secondary/40 text-xs font-semibold text-muted-foreground border-b border-border">
                <th className="p-4">Campaign Name</th>
                <th className="p-4">Allocated Budget</th>
                <th className="p-4">Total Leads Captured</th>
                <th className="p-4">ROI Multiplier</th>
              </tr>
            </thead>
            <tbody>
              {campaignData.map((camp, idx: number) => (
                <tr key={idx} className="border-b border-border text-sm hover:bg-secondary/10 transition-all">
                  <td className="p-4 font-semibold">{camp.name}</td>
                  <td className="p-4">${camp.cost.toLocaleString()}</td>
                  <td className="p-4">{camp.leads}</td>
                  <td className="p-4">
                    <span className="bg-emerald-500/10 text-emerald-500 px-2.5 py-0.5 rounded-full font-bold text-xs">
                      {camp.roi}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
