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
import { Search } from "lucide-react";

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
      <div className="border-b border-border pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Security Audit Logs</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Real-time operations tracking compliance, logins, assignments, and data exports.
          </p>
        </div>
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search security audits..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-secondary border border-border focus:border-indigo-500 rounded-xl text-xs outline-none transition-all"
          />
        </div>
      </div>

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
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    No security audit logs match query search rules.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-border hover:bg-secondary/10 transition-all font-mono text-[11px]"
                  >
                    <td className="p-4 text-slate-500">{new Date(log.createdAt).toLocaleString()}</td>
                    <td className="p-4 font-bold text-foreground">{log.userName}</td>
                    <td className="p-4">
                      <span className="bg-indigo-500/10 text-indigo-500 font-bold px-2 py-0.5 rounded-full text-[10px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500">{log.ipAddress}</td>
                    <td className="p-4 text-muted-foreground max-w-sm truncate" title={log.details}>
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
