"use client";

import React, { useState, useEffect } from "react";
export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  ipAddress: string;
  details: string;
  createdAt: string;
}
import { getAuditLogsAction } from "@/lib/actions/crm.actions";
import { Search, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { Input, PageHeader, EmptyState, Badge } from "@/components/ui";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [search, setSearch] = useState("");

  const loadLogs = () => {
    getAuditLogsAction().then(setLogs).catch(() => {});
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = logs.filter(
    (l) =>
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.details.toLowerCase().includes(search.toLowerCase()) ||
      l.userName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Security Audit Logs"
        description="Real-time operations tracking compliance, logins, assignments, and data exports."
        border
        actions={
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search security audits..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        }
      />

      {/* Audits timeline list */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-secondary/40 font-semibold text-muted-foreground border-b border-border">
                <th className="p-4">Timestamp</th>
                <th className="p-4">Operator</th>
                <th className="p-4">Action Event</th>
                <th className="p-4">IP Address</th>
                <th className="p-4">Details Description</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-2">
                    <EmptyState icon={ShieldCheck} title="No audit logs found" description="No security audit logs match query search rules." />
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log, idx) => (
                  <motion.tr
                    key={log.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(idx * 0.03, 0.3) }}
                    className="border-b border-border hover:bg-secondary/10 transition-colors font-mono text-[11px]"
                  >
                    <td className="p-4 text-slate-500">{new Date(log.createdAt).toLocaleString()}</td>
                    <td className="p-4 font-bold text-foreground">{log.userName}</td>
                    <td className="p-4">
                      <Badge tone="indigo" className="text-[10px]">{log.action}</Badge>
                    </td>
                    <td className="p-4 text-slate-500">{log.ipAddress}</td>
                    <td className="p-4 text-muted-foreground max-w-sm truncate" title={log.details}>
                      {log.details}
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
