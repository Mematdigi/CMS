"use client";

import React, { useState } from "react";
import { FileText, Download, Printer, BarChart3, AlertCircle } from "lucide-react";
import { exportToCSV, exportToExcel } from "@/lib/exports";
import { getAuditLogsAction } from "@/lib/actions/crm.actions";

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
      let data: any[] = [];
      if (reportId === "leads") {
        const res = await fetch("/api/leads?limit=1000");
        const json = await res.json();
        if (json.success) data = json.data;
      } else if (reportId === "calls") {
        const res = await fetch("/api/calls");
        const json = await res.json();
        if (json.success) data = json.data;
      } else if (reportId === "audits") {
        data = await getAuditLogsAction();
      }

      if (type === "csv") {
        exportToCSV(data, `${reportId}_Report`);
      } else {
        exportToExcel(data, `${reportId}_Report`);
      }
    } catch (err) {}
    setLoading(null);
  };

  const handlePrint = (reportId: string) => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-border pb-4">
        <h1 className="text-3xl font-extrabold tracking-tight">Reports Center</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Generate corporate compliance records, pipeline forecasts, and export files.
        </p>
      </div>

      {/* Reports Card grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {reportsList.map((rep) => (
          <div
            key={rep.id}
            className="bg-card border border-border p-6 rounded-2xl shadow-sm flex flex-col justify-between gap-6 hover-lift"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 bg-indigo-500/10 text-indigo-500 rounded-xl flex items-center justify-center">
                <FileText className="w-5.5 h-5.5" />
              </div>
              <h3 className="font-bold text-sm text-foreground">{rep.name}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{rep.desc}</p>
            </div>

            <div className="flex gap-2 border-t border-border pt-4 text-xs font-bold">
              <button
                disabled={loading === rep.id}
                onClick={() => handleExport("csv", rep.id)}
                className="flex-1 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg border border-border flex items-center justify-center gap-1.5 transition-all"
              >
                <Download className="w-3.5 h-3.5" /> CSV
              </button>
              <button
                disabled={loading === rep.id}
                onClick={() => handleExport("excel", rep.id)}
                className="flex-1 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg border border-border flex items-center justify-center gap-1.5 transition-all"
              >
                <Download className="w-3.5 h-3.5" /> Excel
              </button>
              <button
                onClick={() => handlePrint(rep.id)}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-md"
              >
                <Printer className="w-3.5 h-3.5" /> Print PDF
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
