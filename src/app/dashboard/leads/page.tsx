"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Plus,
  Download,
  Upload,
  Activity,
  Grid,
  List as ListIcon,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  FileSpreadsheet,
  FolderOpen,
  Phone,
  Radio,
} from "lucide-react";

interface Employee {
  id: string;
  userId: string;
  name: string;
  role: string;
}
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
import { Button, Card, Badge, Input, Select, Textarea, Modal, PageHeader, EmptyState } from "@/components/ui";

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
  const [employees, setEmployees] = useState<Employee[]>([]);
  
  // Filter / Search states
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Debounce search input to avoid hitting database on every keystroke
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearch(searchInput);
      setPage(1); // Reset page to 1 when search changes
    }, 300);
    return () => clearTimeout(handler);
  }, [searchInput]);

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
  const fetchLeads = useCallback(() => {
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
  }, [search, statusFilter, page]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

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
      } catch {}
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
    } catch {}
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
      } catch {}
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
        } catch {}
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
    } catch {}
  };

  const handleExportExcel = async () => {
    try {
      const res = await fetch("/api/leads?limit=1000");
      const json = await res.json();
      if (json.success) {
        exportToExcel(json.data, "Enterprise_CRM_Leads_Report");
      }
    } catch {}
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
      <PageHeader
        title="Leads & Pipelines"
        description="Qualify opportunities, route contacts, and drive conversions."
        border
        actions={
          <>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4" /> Create Lead
            </Button>
            <Button variant="secondary" onClick={() => setShowImportModal(true)}>
              <Upload className="w-4 h-4" /> Import CSV
            </Button>
            <div className="relative group">
              <Button variant="secondary">
                <Download className="w-4 h-4" /> Export Report
              </Button>
              <div className="absolute right-0 mt-1 hidden group-hover:block bg-card border border-border shadow-xl rounded-xl p-1 z-50 w-36 animate-scale-in">
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
          </>
        }
      />

      {/* Grid search and filtering bar */}
      <Card className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4">
        <div className="flex items-center gap-3 w-full sm:max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by name, email, company, or phone..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-auto shrink-0"
          >
            <option value="ALL">All Stages</option>
            {leadStatuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
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
      </Card>

      {/* Bulk Actions Panel */}
      <AnimatePresence>
        {selectedLeads.length > 0 && (
          <motion.div
            initial={{ scale: 0.95, opacity: 0, height: 0 }}
            animate={{ scale: 1, opacity: 1, height: "auto" }}
            exit={{ scale: 0.95, opacity: 0, height: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 32 }}
            className="bg-indigo-500/5 border border-indigo-500/20 p-3 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-semibold text-indigo-400 overflow-hidden"
          >
            <span>Selected {selectedLeads.length} leads matching filter</span>
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={bulkAction}
                onChange={(e) => {
                  setBulkAction(e.target.value);
                  if (e.target.value !== "ASSIGN_AGENT") {
                    setBulkAssigneeId("");
                  }
                }}
                className="w-auto bg-card"
              >
                <option value="">Choose Bulk Action</option>
                <option value="STATUS_WON">Mark Converted (WON)</option>
                <option value="ASSIGN_AGENT">Assign to Agent</option>
                <option value="DELETE">Bulk Delete Leads</option>
              </Select>

              {bulkAction === "ASSIGN_AGENT" && (
                <Select
                  value={bulkAssigneeId}
                  onChange={(e) => setBulkAssigneeId(e.target.value)}
                  className="w-auto bg-card text-indigo-500 font-semibold"
                >
                  <option value="">Select Agent</option>
                  {employees.map((emp) => (
                    <option key={emp.userId} value={emp.userId}>
                      {emp.name} ({emp.role})
                    </option>
                  ))}
                </Select>
              )}

              <Button size="sm" onClick={executeBulkAction}>
                Apply Action
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
                  <th className="p-4">Source</th>
                  <th className="p-4">Stage Status</th>
                  <th className="p-4">Representative</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-2">
                      <EmptyState
                        icon={FolderOpen}
                        title="No pipeline leads found"
                        description="Try adjusting your search or filter rules."
                      />
                    </td>
                  </tr>
                ) : (
                  leads.map((lead, idx) => (
                    <motion.tr
                      key={lead.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(idx * 0.04, 0.4), duration: 0.3 }}
                      className="border-b border-border text-sm hover:bg-secondary/10 transition-colors"
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
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
                          <Radio className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          <span className="truncate">{lead.leadSource || "Unknown"}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge tone={lead.status === "WON" ? "emerald" : lead.status === "LOST" ? "red" : "indigo"}>
                          {lead.status}
                        </Badge>
                      </td>
                      <td className="p-4 font-medium text-slate-700 dark:text-slate-300">{lead.assignedToName}</td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center gap-2">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => startCall(lead.id, lead.name, lead.phone)}
                            className="p-1.5 hover:bg-indigo-500/10 text-indigo-500 hover:text-indigo-600 rounded-lg border border-transparent hover:border-indigo-500/20 transition-colors"
                            title="Click-to-Call Softphone"
                          >
                            <Phone className="w-4 h-4" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => (window.location.href = `/dashboard/leads/${lead.id}`)}
                            className="p-1.5 hover:bg-slate-500/10 text-slate-500 hover:text-slate-600 rounded-lg border border-transparent hover:border-slate-500/20 transition-colors"
                            title="Activity Log Timeline"
                          >
                            <Activity className="w-4 h-4" />
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
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
                <motion.button
                  whileHover={{ scale: page === 1 ? 1 : 1.08 }}
                  whileTap={{ scale: page === 1 ? 1 : 0.92 }}
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  className="p-1.5 hover:bg-secondary rounded-lg border border-border disabled:opacity-50 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: page === totalPages ? 1 : 1.08 }}
                  whileTap={{ scale: page === totalPages ? 1 : 0.92 }}
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                  className="p-1.5 hover:bg-secondary rounded-lg border border-border disabled:opacity-50 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </motion.button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Kanban Board view */
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4 overflow-x-auto pb-4">
          {["NEW", "CONTACTED", "INTERESTED", "QUALIFIED", "WON"].map((stage, colIdx) => {
            const stageLeads = leads.filter((l) => l.status === stage);
            return (
              <motion.div
                key={stage}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: colIdx * 0.06 }}
                className="bg-card/40 border border-border/80 rounded-2xl p-4 w-full md:w-72 shrink-0 flex flex-col gap-3 min-h-[400px] md:min-h-[500px]"
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
                  {stageLeads.map((lead, rowIdx) => (
                    <motion.div
                      key={lead.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: colIdx * 0.06 + rowIdx * 0.04 }}
                      whileHover={{ y: -3 }}
                      onClick={() => (window.location.href = `/dashboard/leads/${lead.id}`)}
                      className="bg-card border border-border hover:border-indigo-500 p-4 rounded-xl shadow-xs cursor-pointer hover:shadow-md transition-shadow space-y-3"
                    >
                      <div className="flex justify-between items-start">
                        <Badge tone={lead.priority === "CRITICAL" ? "red" : lead.priority === "HIGH" ? "amber" : "indigo"} className="text-[9px]">
                          {lead.priority}
                        </Badge>
                      </div>
                      <div>
                        <div className="font-bold text-xs text-foreground truncate">{lead.name}</div>
                        <div className="text-[10px] text-muted-foreground truncate">{lead.company}</div>
                      </div>
                      <div className="flex items-center gap-1 text-[9px] font-semibold text-indigo-400 truncate">
                        <Radio className="w-3 h-3 shrink-0" />
                        <span className="truncate">{lead.leadSource || "Unknown"}</span>
                      </div>
                      <div className="text-[10px] font-bold text-slate-500 flex justify-between border-t border-border/60 pt-2">
                        <span>Budget: ${lead.budget ? lead.budget.toLocaleString() : "0"}</span>
                        <span>{lead.assignedToName}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Create Lead Modal */}
      <Modal
        open={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setDuplicateWarning(null);
        }}
        title="Create Pipeline Lead"
      >
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
            <Input {...register("name")} placeholder="Full name" />
            {errors.name && <p className="text-2xs text-red-400 mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-2xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <Input {...register("email")} type="email" placeholder="email@company.com" />
            {errors.email && <p className="text-2xs text-red-400 mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-2xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Phone Number
            </label>
            <Input {...register("phone")} placeholder="+1 (555) 000-0000" />
            {errors.phone && <p className="text-2xs text-red-400 mt-1">{errors.phone.message}</p>}
          </div>

          <div>
            <label className="block text-2xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Company Name
            </label>
            <Input {...register("company")} placeholder="Corporate Entity" />
            {errors.company && <p className="text-2xs text-red-400 mt-1">{errors.company.message}</p>}
          </div>

          <div>
            <label className="block text-2xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Product Interest
            </label>
            <Input {...register("productName")} placeholder="Software Suite Name" />
          </div>

          <div>
            <label className="block text-2xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Allocated Budget ($)
            </label>
            <Input {...register("budget", { valueAsNumber: true })} type="number" placeholder="25000" />
          </div>

          <div>
            <label className="block text-2xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Priority Ticket
            </label>
            <Select {...register("priority")}>
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
              <option value="CRITICAL">CRITICAL</option>
            </Select>
          </div>

          <div>
            <label className="block text-2xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Spoken Language
            </label>
            <Input {...register("language")} placeholder="English" />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-2xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Notes
            </label>
            <Textarea {...register("notes")} placeholder="Additional context observations..." />
          </div>

          {user && (user.role === "ADMIN" || user.role === "SUPER_ADMIN") && (
            <div className="sm:col-span-2">
              <label className="block text-2xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Representative Owner (Assignment)
              </label>
              <Select {...register("assignedToId")} className="font-semibold">
                <option value="">Unassigned (Fallback to Smart Assignment)</option>
                {employees.map((emp) => (
                  <option key={emp.userId} value={emp.userId}>
                    {emp.name} ({emp.role})
                  </option>
                ))}
              </Select>
            </div>
          )}

          <div className="sm:col-span-2 flex justify-end gap-2 border-t border-border pt-4 mt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowCreateModal(false);
                setDuplicateWarning(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit">Register Opportunity</Button>
          </div>
        </form>
      </Modal>

      {/* CSV Import Modal */}
      <Modal open={showImportModal} onClose={() => setShowImportModal(false)} maxWidth="max-w-lg">
        <h2 className="text-xl font-bold mb-2">Import Wizard Parser</h2>
        <p className="text-xs text-muted-foreground mb-4">
          Paste raw comma-separated values matching format layout headers: <code className="bg-secondary px-1.5 py-0.5 rounded text-indigo-400 font-bold">name, phone, email, company</code>
        </p>

        <Textarea
          value={csvInput}
          onChange={(e) => setCsvInput(e.target.value)}
          placeholder="name, phone, email, company&#10;Alice, +15551234, alice@example.com, Tesla Corp&#10;Bob, +15555678, bob@example.com, SpaceY"
          className="min-h-40 font-mono p-3"
        />

        <div className="flex justify-end gap-2 border-t border-border pt-4 mt-4">
          <Button variant="secondary" onClick={() => setShowImportModal(false)}>
            Cancel
          </Button>
          <Button onClick={handleCSVImport}>Parse & Insert</Button>
        </div>
      </Modal>
    </div>
  );
}
