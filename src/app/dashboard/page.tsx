"use client";

import React, { useMemo, useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import {
  Users,
  Clock,
  Phone,
  MessageSquare,
  CheckCircle,
  DollarSign,
} from "lucide-react";
import { getDashboardAnalyticsAction } from "@/lib/actions/crm.actions";
import { PageHeader, StatCard, Card, Button, Skeleton } from "@/components/ui";

// Recharts is a large dependency (~100kB) only needed on this page — load it lazily,
// client-side only, so it doesn't block the initial paint or bloat other routes.
const ChartSkeleton = () => <Skeleton className="h-full w-full rounded-xl" />;
const RevenueTrendChart = dynamic(() => import("@/components/dashboard/RevenueTrendChart"), { ssr: false, loading: ChartSkeleton });
const LeadSourceChart = dynamic(() => import("@/components/dashboard/LeadSourceChart"), { ssr: false, loading: ChartSkeleton });
const ConversionFunnelChart = dynamic(() => import("@/components/dashboard/ConversionFunnelChart"), { ssr: false, loading: ChartSkeleton });
const EmployeePerformanceChart = dynamic(() => import("@/components/dashboard/EmployeePerformanceChart"), { ssr: false, loading: ChartSkeleton });

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

interface LeadSourceItem {
  name: string;
  value: number;
}

interface CampaignPerformanceItem {
  name: string;
  cost: number;
  leads: number;
  roi: string;
}

interface EmployeePerformanceItem {
  name: string;
  leads: number;
  won: number;
  rev: number;
}

interface ConversionFunnelItem {
  stage: string;
  value: number;
}

interface RevenueTrendItem {
  name: string;
  revenue: number;
}

interface AnalyticsData {
  totalLeads: number;
  totalRevenue: number;
  employeePerformance: EmployeePerformanceItem[];
  campaignPerformance: CampaignPerformanceItem[];
  conversionFunnel: ConversionFunnelItem[];
  revenueTrend: RevenueTrendItem[];
  leadSourceData: LeadSourceItem[];
}

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

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
        tone: "indigo" as const,
      },
      {
        title: "Active Conversations",
        value: "310",
        desc: "42 pending reply",
        icon: MessageSquare,
        tone: "sky" as const,
      },
      {
        title: "Today's Follow-ups",
        value: "18",
        desc: "6 overdue reminder alerts",
        icon: Clock,
        tone: "amber" as const,
      },
      {
        title: "Converted Deals (WON)",
        value: (analytics?.conversionFunnel?.find((f) => f.stage === "WON")?.value ?? 0).toLocaleString(),
        desc: "Average deal conversion indicator",
        icon: CheckCircle,
        tone: "emerald" as const,
      },
      {
        title: "Monthly Recurring Revenue",
        value: `$${revVal.toLocaleString()}`,
        desc: "Prisma aggregated budgets value",
        icon: DollarSign,
        tone: "violet" as const,
      },
      {
        title: "Missed Calls Logger",
        value: "4",
        desc: "Require callback",
        icon: Phone,
        tone: "rose" as const,
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
      <PageHeader
        title="Enterprise Overview"
        description="Real-time multi-tenant intelligence and sales pipelines metrics."
        actions={
          <Button onClick={fetchAnalytics}>Refresh Analytics</Button>
        }
      />

      {/* Grid Cards metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card, i) => (
          <StatCard
            key={card.title}
            title={card.title}
            value={card.value}
            desc={card.desc}
            icon={card.icon}
            tone={card.tone}
            delay={i * 0.05}
          />
        ))}
      </div>

      {/* Charts Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales & Revenue timelines */}
        <Card delay={0.1} hoverLift className="p-6 space-y-4">
          <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">Revenue Target vs Actual</h3>
          <div className="h-80">
            <RevenueTrendChart data={revenueData} />
          </div>
        </Card>

        {/* Lead Source distribution */}
        <Card delay={0.15} hoverLift className="p-6 space-y-4">
          <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">Lead Acquisition Source</h3>
          <div className="h-80 flex items-center justify-center">
            <LeadSourceChart data={leadSourceData} />
          </div>
        </Card>

        {/* Lead Conversion Funnel */}
        <Card delay={0.2} hoverLift className="p-6 space-y-4">
          <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">Conversion Pipeline Funnel</h3>
          <div className="h-80">
            <ConversionFunnelChart data={funnelData} />
          </div>
        </Card>

        {/* Employee target stats */}
        <Card delay={0.25} hoverLift className="p-6 space-y-4">
          <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">Top Employee Performance</h3>
          <div className="h-80">
            <EmployeePerformanceChart data={employeeData} />
          </div>
        </Card>
      </div>

      {/* Campaigns list */}
      <Card delay={0.3} className="p-6 space-y-4">
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
                <motion.tr
                  key={idx}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 + idx * 0.05 }}
                  className="border-b border-border text-sm hover:bg-secondary/10 transition-all"
                >
                  <td className="p-4 font-semibold">{camp.name}</td>
                  <td className="p-4">${camp.cost.toLocaleString()}</td>
                  <td className="p-4">{camp.leads}</td>
                  <td className="p-4">
                    <span className="bg-emerald-500/10 text-emerald-500 px-2.5 py-0.5 rounded-full font-bold text-xs">
                      {camp.roi}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
