"use client";

import React, { useState } from "react";
import { FileText, Download, Printer } from "lucide-react";
import { exportToCSV, exportToExcel } from "@/lib/exports";
import { getAuditLogsAction } from "@/lib/actions/crm.actions";
import { Button, Card, PageHeader } from "@/components/ui";

export default function ReportsPage() {
  const [loading, setLoading] = useState<string | null>(null);

  const reportsList = [
    { id: "leads", name: "Leads Acquisition Pipeline Report", desc: "Detailed breakdown of all client profiles, stages status, priorities and AI score allocations." },
    { id: "calls", name: "Telephony Call Center Activity Logs", desc: "SIP call log files history, caller details, recording URLs and duration metrics." },
    { id: "audits", name: "Security Auditing Compliance Report", desc: "Trace user logs, login operations, exports rules, and system configurations updates." },
  ];

  const handleExport = async (type: "csv" | "excel", reportId: string) => {
    setLoading(reportId);
    try {
      let data: Record<string, unknown>[] = [];
      if (reportId === "leads") {
        const res = await fetch("/api/leads?limit=1000");
        const json = await res.json();
        if (json.success) data = json.data;
      } else if (reportId === "calls") {
        const res = await fetch("/api/calls");
        const json = await res.json();
        if (json.success) data = json.data;
      } else if (reportId === "audits") {
        data = (await getAuditLogsAction()) as unknown as Record<string, unknown>[];
      }

      if (type === "csv") {
        exportToCSV(data, `${reportId}_Report`);
      } else {
        exportToExcel(data, `${reportId}_Report`);
      }
    } catch {}
    setLoading(null);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Reports Center"
        description="Generate corporate compliance records, pipeline forecasts, and export files."
        border
      />

      {/* Reports Card grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {reportsList.map((rep, i) => (
          <Card key={rep.id} delay={i * 0.08} hoverLift glow className="p-6 flex flex-col justify-between gap-6">
            <div className="space-y-3">
              <div className="w-10 h-10 bg-indigo-500/10 text-indigo-500 rounded-xl flex items-center justify-center">
                <FileText className="w-5.5 h-5.5" />
              </div>
              <h3 className="font-bold text-sm text-foreground">{rep.name}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{rep.desc}</p>
            </div>

            <div className="flex gap-2 border-t border-border pt-4 text-xs font-bold">
              <Button
                variant="secondary"
                loading={loading === rep.id}
                onClick={() => handleExport("csv", rep.id)}
                className="flex-1"
              >
                <Download className="w-3.5 h-3.5" /> CSV
              </Button>
              <Button
                variant="secondary"
                loading={loading === rep.id}
                onClick={() => handleExport("excel", rep.id)}
                className="flex-1"
              >
                <Download className="w-3.5 h-3.5" /> Excel
              </Button>
              <Button onClick={handlePrint}>
                <Printer className="w-3.5 h-3.5" /> Print PDF
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
