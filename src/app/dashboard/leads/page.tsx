"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Plus,
  SlidersHorizontal,
  Download,
  Upload,
  UserPlus,
  Trash2,
  Bookmark,
  Activity,
  Grid,
  List as ListIcon,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  FileSpreadsheet,
  CheckSquare,
  HelpCircle,
  FolderOpen,
  Phone,
} from "lucide-react";
export interface Lead {
  id: string;
  tenantId: string;
  workspaceId: string;
  name: string;
  phone: string;
  altPhone?: string | null;
  email: string;
  company?: string | null;
  industry?: string | null;
  productId?: string | null;
  budget?: number | null;
  leadSource?: string | null;
  campaignId?: string | null;
  status: "NEW" | "CONTACTED" | "INTERESTED" | "QUALIFIED" | "PROPOSAL_SENT" | "NEGOTIATION" | "WON" | "LOST" | "CLOSED" | string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | string;
  createdById: string;
  assignedToId?: string | null;
  state?: string | null;
  city?: string | null;
  country?: string | null;
  language: string;
  notes?: string | null;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
  assignedToName?: string;
  score: number;
}
import { exportToCSV, exportToExcel } from "@/lib/exports";
import { useCRMStore } from "@/lib/store/useCRMStore";
import { getEmployeesAction } from "@/lib/actions/crm.actions";

const leadFormSchema = zod.object({
  name: zod.string().min(2, "Name must be at least 2 characters"),
  phone: zod.string().min(6, "Valid phone number is required"),
  altPhone: zod.string(),
  email: zod.string().email("Valid email address is required"),
  company: zod.string().min(1, "Company is required"),
  industry: zod.string(),
  productName: zod.string(),
  budget: zod.number().min(0),
  leadSource: zod.string(),
  campaign: zod.string(),
  priority: zod.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  state: zod.string(),
  city: zod.string(),
  country: zod.string(),
  language: zod.string(),
  notes: zod.string(),
  assignedToId: zod.string(),
});

type LeadFormValues = zod.infer<typeof leadFormSchema>;

export default function LeadsPage() {
  const { startCall, user } = useCRMStore();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [employees, setEmployees] = useState<any[]>([]);
  
  // Filter / Search states
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Bulk Actions
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState("");
  const [bulkAssigneeId, setBulkAssigneeId] = useState("");

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [csvInput, setCsvInput] = useState("");

  useEffect(() => {
    getEmployeesAction().then(setEmployees).catch(() => {});
  }, []);
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      name: "",
      phone: "",
      altPhone: "",
      email: "",
      company: "",
      industry: "Technology",
      productName: "Enterprise Cloud Hosting",
      budget: 10000,
      leadSource: "Google Search",
      campaign: "",
      priority: "MEDIUM",
      state: "",
      city: "",
      country: "",
      language: "English",
      notes: "",
      assignedToId: "",
    },
  });

  // Fetch leads on mount / query state change
  const fetchLeads = () => {
    const params = new URLSearchParams({
      search,
      status: statusFilter,
      sortBy: "createdAt",
      sortOrder: "desc",
      page: String(page),
      limit: "8",
    });
    fetch(`/api/leads?${params.toString()}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setLeads(json.data);
          setTotalPages(json.meta.pagination.totalPages);
          setTotalCount(json.meta.pagination.totalCount);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchLeads();
  }, [search, statusFilter, page]);

  // Lead Submission & Duplicate detection
  const onCreateLeadSubmit = async (data: LeadFormValues) => {
    if (!duplicateWarning) {
      try {
        const res = await fetch(`/api/leads?search=${encodeURIComponent(data.email)}`);
        const json = await res.json();
        if (json.success && json.data.length > 0) {
          const exists = json.data[0];
          setDuplicateWarning(
            `Lead already exists matching values. Name: ${exists.name} (${exists.email}). Click submit again to force save duplicate.`
          );
          return;
        }
      } catch (err) {}
    }

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.success) {
        setDuplicateWarning(null);
        setShowCreateModal(false);
        reset();
        fetchLeads();
      }
    } catch (err) {}
  };

  // Bulk execution
  const executeBulkAction = async () => {
    if (selectedLeads.length === 0 || !bulkAction) return;
    if (bulkAction === "ASSIGN_AGENT" && !bulkAssigneeId) return;

    for (const id of selectedLeads) {
      try {
        if (bulkAction === "DELETE") {
          await fetch(`/api/leads/${id}`, { method: "DELETE" });
        } else if (bulkAction === "STATUS_WON") {
          await fetch(`/api/leads/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "WON" }),
          });
        } else if (bulkAction === "ASSIGN_AGENT") {
          await fetch(`/api/leads/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ assignedToId: bulkAssigneeId }),
          });
        }
      } catch (err) {}
    }

    setSelectedLeads([]);
    setBulkAction("");
    setBulkAssigneeId("");
    fetchLeads();
  };

  // CSV Import parser
  const handleCSVImport = async () => {
    if (!csvInput.trim()) return;

    const lines = csvInput.split("\n");
    for (const line of lines) {
      const parts = line.split(",").map((p) => p.trim());
      if (parts.length >= 4 && parts[0] !== "name") {
        try {
          await fetch("/api/leads", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: parts[0],
              phone: parts[1],
              email: parts[2],
              company: parts[3],
              industry: "Technology",
              productName: "Enterprise Cloud Hosting",
              budget: 25000,
              leadSource: "CSV Bulk Import",
              campaign: "Import Sync",
              priority: "MEDIUM",
              language: "English",
              notes: "Imported via CSV template.",
            }),
          });
        } catch (err) {}
      }
    }

    setShowImportModal(false);
    setCsvInput("");
    fetchLeads();
  };

  // Exports trigger
  const handleExportCSV = async () => {
    try {
      const res = await fetch("/api/leads?limit=1000");
      const json = await res.json();
      if (json.success) {
        exportToCSV(json.data, "Enterprise_CRM_Leads_Report");
      }
    } catch (err) {}
  };

  const handleExportExcel = async () => {
    try {
      const res = await fetch("/api/leads?limit=1000");
      const json = await res.json();
      if (json.success) {
        exportToExcel(json.data, "Enterprise_CRM_Leads_Report");
      }
    } catch (err) {}
  };

  const leadStatuses: Lead["status"][] = [
    "NEW",
    "CONTACTED",
    "INTERESTED",
    "QUALIFIED",
    "PROPOSAL_SENT",
    "NEGOTIATION",
    "WON",
    "LOST",
    "CLOSED",
  ];

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Leads & Pipelines</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Qualify opportunities, route contacts, and drive conversions.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-all shadow-md flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Create Lead
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold rounded-xl border border-border transition-all flex items-center gap-2"
          >
            <Upload className="w-4 h-4" /> Import CSV
          </button>
          <div className="relative group">
            <button className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold rounded-xl border border-border transition-all flex items-center gap-2">
              <Download className="w-4 h-4" /> Export Report
            </button>
            <div className="absolute right-0 mt-1 hidden group-hover:block bg-card border border-border shadow-xl rounded-xl p-1 z-50 w-36">
              <button
                onClick={handleExportCSV}
                className="w-full text-left text-xs p-2 hover:bg-secondary rounded-lg font-medium flex items-center gap-2"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" /> Export CSV
              </button>
              <button
                onClick={handleExportExcel}
                className="w-full text-left text-xs p-2 hover:bg-secondary rounded-lg font-medium flex items-center gap-2"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" /> Export Excel
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Grid search and filtering bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-card border border-border p-4 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3 w-full sm:max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name, email, company, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-secondary border border-border focus:border-indigo-500 rounded-xl text-xs outline-none transition-all"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-secondary border border-border text-xs rounded-xl p-2 font-medium outline-none"
          >
            <option value="ALL">All Stages</option>
            {leadStatuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Layout Mode Switcher */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 rounded-xl border transition-all ${
              viewMode === "list"
                ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-500"
                : "bg-transparent border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            <ListIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("kanban")}
            className={`p-2 rounded-xl border transition-all ${
              viewMode === "kanban"
                ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-500"
                : "bg-transparent border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            <Grid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bulk Actions Panel */}
      {selectedLeads.length > 0 && (
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-indigo-500/5 border border-indigo-500/20 p-3 rounded-2xl flex items-center justify-between gap-4 text-xs font-semibold text-indigo-400"
        >
          <span>Selected {selectedLeads.length} leads matching filter</span>
          <div className="flex items-center gap-2">
            <select
              value={bulkAction}
              onChange={(e) => {
                setBulkAction(e.target.value);
                if (e.target.value !== "ASSIGN_AGENT") {
                  setBulkAssigneeId("");
                }
              }}
              className="bg-card border border-border text-xs rounded-xl p-1.5 outline-none font-medium text-foreground"
            >
              <option value="">Choose Bulk Action</option>
              <option value="STATUS_WON">Mark Converted (WON)</option>
              <option value="ASSIGN_AGENT">Assign to Agent</option>
              <option value="DELETE">Bulk Delete Leads</option>
            </select>

            {bulkAction === "ASSIGN_AGENT" && (
              <select
                value={bulkAssigneeId}
                onChange={(e) => setBulkAssigneeId(e.target.value)}
                className="bg-card border border-border text-xs rounded-xl p-1.5 outline-none font-semibold text-indigo-500"
              >
                <option value="">Select Agent</option>
                {employees.map((emp) => (
                  <option key={emp.userId} value={emp.userId}>
                    {emp.name} ({emp.role})
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={executeBulkAction}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-md"
            >
              Apply Action
            </button>
          </div>
        </motion.div>
      )}

      {/* Main Layout Display */}
      {viewMode === "list" ? (
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-secondary/40 text-xs font-semibold text-muted-foreground border-b border-border">
                  <th className="p-4 w-12 text-center">
                    <input
                      type="checkbox"
                      checked={selectedLeads.length === leads.length && leads.length > 0}
                      onChange={(e) =>
                        setSelectedLeads(e.target.checked ? leads.map((l) => l.id) : [])
                      }
                      className="rounded accent-indigo-500 border-border"
                    />
                  </th>
                  <th className="p-4">Contact Detail</th>
                  <th className="p-4">Corporate Info</th>
                  <th className="p-4">Stage Status</th>
                  <th className="p-4">Lead Score</th>
                  <th className="p-4">Representative</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      <div className="flex flex-col items-center gap-3">
                        <FolderOpen className="w-12 h-12 text-slate-400" />
                        <span>No pipeline leads found matching filter rules.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  leads.map((lead) => (
                    <tr
                      key={lead.id}
                      className="border-b border-border text-sm hover:bg-secondary/10 transition-all"
                    >
                      <td className="p-4 text-center">
                        <input
                          type="checkbox"
                          checked={selectedLeads.includes(lead.id)}
                          onChange={(e) =>
                            setSelectedLeads(
                              e.target.checked
                                ? [...selectedLeads, lead.id]
                                : selectedLeads.filter((id) => id !== lead.id)
                            )
                          }
                          className="rounded accent-indigo-500 border-border"
                        />
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-foreground hover:underline cursor-pointer"
                             onClick={() => (window.location.href = `/dashboard/leads/${lead.id}`)}>
                          {lead.name}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">{lead.email}</div>
                        <div className="text-[10px] text-indigo-400 mt-1 font-semibold">{lead.phone}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-slate-700 dark:text-slate-300">{lead.company}</div>
                        <div className="text-xs text-muted-foreground">{lead.industry}</div>
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-bold text-2xs uppercase tracking-wide inline-block ${
                            lead.status === "WON"
                              ? "bg-emerald-500/10 text-emerald-500"
                              : lead.status === "LOST"
                              ? "bg-red-500/10 text-red-500"
                              : "bg-indigo-500/10 text-indigo-500"
                          }`}
                        >
                          {lead.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold text-xs border border-indigo-500/20">
                            {lead.score}
                          </div>
                          <span className="text-2xs text-muted-foreground font-medium">AI Match</span>
                        </div>
                      </td>
                      <td className="p-4 font-medium text-slate-700 dark:text-slate-300">{lead.assignedToName}</td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => startCall(lead.id, lead.name, lead.phone)}
                            className="p-1.5 hover:bg-indigo-500/10 text-indigo-500 hover:text-indigo-600 rounded-lg border border-transparent hover:border-indigo-500/20 transition-all"
                            title="Click-to-Call Softphone"
                          >
                            <Phone className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => (window.location.href = `/dashboard/leads/${lead.id}`)}
                            className="p-1.5 hover:bg-slate-500/10 text-slate-500 hover:text-slate-600 rounded-lg border border-transparent hover:border-slate-500/20 transition-all"
                            title="Activity Log Timeline"
                          >
                            <Activity className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-border flex justify-between items-center text-xs font-semibold text-muted-foreground">
              <span>Showing page {page} of {totalPages} ({totalCount} total leads)</span>
              <div className="flex items-center gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  className="p-1.5 hover:bg-secondary rounded-lg border border-border disabled:opacity-50 transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                  className="p-1.5 hover:bg-secondary rounded-lg border border-border disabled:opacity-50 transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Kanban Board view */
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4 overflow-x-auto pb-4">
          {["NEW", "CONTACTED", "INTERESTED", "QUALIFIED", "WON"].map((stage) => {
            const stageLeads = leads.filter((l) => l.status === stage);
            return (
              <div
                key={stage}
                className="bg-card/40 border border-border/80 rounded-2xl p-4 w-72 shrink-0 flex flex-col gap-3 min-h-[500px]"
              >
                <div className="flex justify-between items-center border-b border-border pb-2">
                  <span className="font-bold text-xs text-muted-foreground uppercase tracking-wider">
                    {stage}
                  </span>
                  <span className="bg-indigo-500/10 text-indigo-500 font-bold px-2 py-0.5 rounded-full text-[10px]">
                    {stageLeads.length}
                  </span>
                </div>
                <div className="flex-1 flex flex-col gap-3 overflow-y-auto max-h-[600px] scrollbar-none">
                  {stageLeads.map((lead) => (
                    <div
                      key={lead.id}
                      onClick={() => (window.location.href = `/dashboard/leads/${lead.id}`)}
                      className="bg-card border border-border hover:border-indigo-500 p-4 rounded-xl shadow-xs cursor-pointer hover:shadow-md transition-all space-y-3"
                    >
                      <div className="flex justify-between items-start">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          lead.priority === "CRITICAL"
                            ? "bg-red-500/10 text-red-500"
                            : lead.priority === "HIGH"
                            ? "bg-amber-500/10 text-amber-500"
                            : "bg-indigo-500/10 text-indigo-500"
                        }`}>
                          {lead.priority}
                        </span>
                        <div className="w-6 h-6 rounded bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold text-[10px]">
                          {lead.score}
                        </div>
                      </div>
                      <div>
                        <div className="font-bold text-xs text-foreground truncate">{lead.name}</div>
                        <div className="text-[10px] text-muted-foreground truncate">{lead.company}</div>
                      </div>
                      <div className="text-[10px] font-bold text-slate-500 flex justify-between border-t border-border/60 pt-2">
                        <span>Budget: ${lead.budget ? lead.budget.toLocaleString() : "0"}</span>
                        <span>{lead.assignedToName}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Lead Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border rounded-2xl w-full max-w-2xl shadow-2xl p-6 overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <h2 className="text-xl font-bold mb-4 border-b border-border pb-3">Create Pipeline Lead</h2>

              {duplicateWarning && (
                <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-3 rounded-xl text-xs flex items-start gap-2.5 mb-4">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{duplicateWarning}</span>
                </div>
              )}

              <form onSubmit={handleSubmit(onCreateLeadSubmit)} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-2xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Lead Name
                  </label>
                  <input
                    {...register("name")}
                    placeholder="Full name"
                    className="w-full p-2 bg-secondary border border-border rounded-xl text-xs outline-none focus:border-indigo-500"
                  />
                  {errors.name && <p className="text-2xs text-red-400 mt-1">{errors.name.message}</p>}
                </div>

                <div>
                  <label className="block text-2xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <input
                    {...register("email")}
                    type="email"
                    placeholder="email@company.com"
                    className="w-full p-2 bg-secondary border border-border rounded-xl text-xs outline-none focus:border-indigo-500"
                  />
                  {errors.email && <p className="text-2xs text-red-400 mt-1">{errors.email.message}</p>}
                </div>

                <div>
                  <label className="block text-2xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Phone Number
                  </label>
                  <input
                    {...register("phone")}
                    placeholder="+1 (555) 000-0000"
                    className="w-full p-2 bg-secondary border border-border rounded-xl text-xs outline-none focus:border-indigo-500"
                  />
                  {errors.phone && <p className="text-2xs text-red-400 mt-1">{errors.phone.message}</p>}
                </div>

                <div>
                  <label className="block text-2xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Company Name
                  </label>
                  <input
                    {...register("company")}
                    placeholder="Corporate Entity"
                    className="w-full p-2 bg-secondary border border-border rounded-xl text-xs outline-none focus:border-indigo-500"
                  />
                  {errors.company && <p className="text-2xs text-red-400 mt-1">{errors.company.message}</p>}
                </div>

                <div>
                  <label className="block text-2xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Product Interest
                  </label>
                  <input
                    {...register("productName")}
                    placeholder="Software Suite Name"
                    className="w-full p-2 bg-secondary border border-border rounded-xl text-xs outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-2xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Allocated Budget ($)
                  </label>
                  <input
                    {...register("budget", { valueAsNumber: true })}
                    type="number"
                    placeholder="25000"
                    className="w-full p-2 bg-secondary border border-border rounded-xl text-xs outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-2xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Priority Ticket
                  </label>
                  <select
                    {...register("priority")}
                    className="w-full p-2 bg-secondary border border-border rounded-xl text-xs outline-none focus:border-indigo-500"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>

                <div>
                  <label className="block text-2xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Spoken Language
                  </label>
                  <input
                    {...register("language")}
                    placeholder="English"
                    className="w-full p-2 bg-secondary border border-border rounded-xl text-xs outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-2xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Notes
                  </label>
                  <textarea
                    {...register("notes")}
                    placeholder="Additional context observations..."
                    className="w-full p-2 bg-secondary border border-border rounded-xl text-xs outline-none focus:border-indigo-500 min-h-20"
                  />
                </div>

                {user && (user.role === "ADMIN" || user.role === "SUPER_ADMIN") && (
                  <div className="sm:col-span-2">
                    <label className="block text-2xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Representative Owner (Assignment)
                    </label>
                    <select
                      {...register("assignedToId")}
                      className="w-full p-2 bg-secondary border border-border rounded-xl text-xs outline-none focus:border-indigo-500 text-foreground font-semibold"
                    >
                      <option value="">Unassigned (Fallback to Smart Assignment)</option>
                      {employees.map((emp) => (
                        <option key={emp.userId} value={emp.userId}>
                          {emp.name} ({emp.role})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="sm:col-span-2 flex justify-end gap-2 border-t border-border pt-4 mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setDuplicateWarning(null);
                    }}
                    className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md"
                  >
                    Register Opportunity
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CSV Import Modal */}
      <AnimatePresence>
        {showImportModal && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl p-6"
            >
              <h2 className="text-xl font-bold mb-2">Import Wizard Parser</h2>
              <p className="text-xs text-muted-foreground mb-4">
                Paste raw comma-separated values matching format layout headers: <code className="bg-secondary px-1.5 py-0.5 rounded text-indigo-400 font-bold">name, phone, email, company</code>
              </p>

              <textarea
                value={csvInput}
                onChange={(e) => setCsvInput(e.target.value)}
                placeholder="name, phone, email, company&#10;Alice, +15551234, alice@example.com, Tesla Corp&#10;Bob, +15555678, bob@example.com, SpaceY"
                className="w-full p-3 bg-secondary border border-border rounded-xl text-xs outline-none focus:border-indigo-500 min-h-40 font-mono"
              />

              <div className="flex justify-end gap-2 border-t border-border pt-4 mt-4">
                <button
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCSVImport}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md"
                >
                  Parse & Insert
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
