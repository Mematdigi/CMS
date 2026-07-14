"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Phone,
  Mail,
  Building2,
  Globe,
  Tag,
  DollarSign,
  Calendar,
  User,
  Plus,
  Activity,
  FileText,
  PhoneCall,
  Save,
  PenSquare,
} from "lucide-react";
import { LeadActivity } from "@prisma/client";

export interface FormattedEmployee {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  department: string;
  targetMonthly: number;
  currentSalesMonthly: number;
  conversionRate: number;
  attendanceCount: number;
  leaveBalance: number;
  avatarUrl: string;
}

export interface ClientCallLog {
  id: string;
  leadId: string;
  userId: string;
  callType: string;
  durationSec: number;
  notes?: string | null;
  createdAt: string | Date;
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
  assignedTo?: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
  product?: {
    id: string;
    name: string;
    price: number;
  } | null;
  campaign?: {
    id: string;
    name: string;
    source: string;
  } | null;
}
import { useCRMStore } from "@/lib/store/useCRMStore";
import { getEmployeesAction } from "@/lib/actions/crm.actions";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function LeadDetailPage({ params }: PageProps) {
  const router = useRouter();
  const { startCall, user } = useCRMStore();
  const { id } = use(params);

  const [lead, setLead] = useState<Lead | null>(null);
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [newNote, setNewNote] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  // Form states
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editCompany, setEditCompany] = useState("");
  const [editBudget, setEditBudget] = useState(0);
  const [editStatus, setEditStatus] = useState<Lead["status"]>("NEW");
  const [employees, setEmployees] = useState<FormattedEmployee[]>([]);
  const [editAssignedToId, setEditAssignedToId] = useState("");

  const loadData = useCallback(async () => {
    try {
      const res = await fetch(`/api/leads/${id}`);
      const json = await res.json();
      if (!json.success) {
        router.push("/dashboard/leads");
        return;
      }
      const data = json.data;
      setLead(data);
      setEditName(data.name);
      setEditEmail(data.email);
      setEditPhone(data.phone);
      setEditCompany(data.company || "");
      setEditBudget(data.budget || 0);
      setEditStatus(data.status);
      setEditAssignedToId(data.assignedToId || "");

      // Fetch calls logs
      const callRes = await fetch("/api/calls");
      const callJson = await callRes.json();
      const logs: LeadActivity[] = [
        { id: "act-init", leadId: id, userId: "user-system", action: "STATUS_CHANGE", details: `Lead created and categorized at ${data.createdAt}`, createdAt: data.createdAt },
      ];

      if (callJson.success) {
        (callJson.data as ClientCallLog[]).filter((c) => c.leadId === id).forEach((call) => {
          logs.push({
            id: call.id,
            leadId: id,
            userId: call.userId,
            action: "CALL_LOGGED",
            details: `${call.callType} Call logged: Duration: ${call.durationSec}s. Notes: ${call.notes || "None"}`,
            createdAt: call.createdAt,
          });
        });
      }

      if (data.notes) {
        logs.push({
          id: "act-note",
          leadId: id,
          userId: "user-current",
          action: "NOTE_ADDED",
          details: `Note: ${data.notes}`,
          createdAt: data.updatedAt || data.createdAt,
        });
      }

      logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setActivities(logs);
    } catch {}
  }, [id, router]);

  useEffect(() => {
    loadData();
    getEmployeesAction().then(setEmployees).catch(() => {});
  }, [id, loadData]);

  const handleUpdateStatus = async (newStage: Lead["status"]) => {
    if (!lead) return;
    try {
      await fetch(`/api/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStage }),
      });
      loadData();
    } catch {}
  };

  const handleSaveDetails = async () => {
    if (!lead) return;
    try {
      await fetch(`/api/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          email: editEmail,
          phone: editPhone,
          company: editCompany,
          budget: editBudget,
          status: editStatus,
          assignedToId: editAssignedToId || null,
        }),
      });
      setIsEditing(false);
      loadData();
    } catch {}
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !lead) return;
    const combinedNotes = lead.notes ? `${lead.notes}\n\n${newNote}` : newNote;
    try {
      await fetch(`/api/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: combinedNotes }),
      });
      setNewNote("");
      loadData();
    } catch {}
  };

  if (!lead) return null;

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <Link
          href="/dashboard/leads"
          className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Back to pipeline
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => startCall(lead.id, lead.name, lead.phone)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition-all shadow-md"
          >
            <PhoneCall className="w-4 h-4" /> Start Call
          </button>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold rounded-xl border border-border flex items-center gap-2 transition-all"
          >
            <PenSquare className="w-4 h-4" /> {isEditing ? "View Details" : "Edit details"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Core contact card */}
        <div className="lg:col-span-2 space-y-6">
          <AnimatePresence mode="wait">
            {!isEditing ? (
              <motion.div
                key="view"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.12, ease: "easeInOut" }}
                className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-6"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex gap-4 items-center">
                    <div className="w-14 h-14 bg-indigo-500/10 text-indigo-500 rounded-xl flex items-center justify-center font-bold text-xl border border-indigo-500/20 shadow-inner">
                      {lead.name.charAt(0)}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-foreground">{lead.name}</h2>
                      <p className="text-xs text-muted-foreground mt-0.5">{lead.company}</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5">
                    <span className="text-2xs font-bold text-slate-400 uppercase tracking-wider">Pipeline Stage</span>
                    <select
                      value={lead.status}
                      onChange={(e) => handleUpdateStatus(e.target.value as Lead["status"])}
                      className="bg-secondary border border-border text-xs rounded-xl p-2 font-semibold outline-none text-indigo-500"
                    >
                      {["NEW", "CONTACTED", "INTERESTED", "QUALIFIED", "PROPOSAL_SENT", "NEGOTIATION", "WON", "LOST", "CLOSED"].map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-border pt-6 text-xs">
                  <div className="flex items-center gap-3 text-muted-foreground p-3 bg-secondary/30 rounded-xl">
                    <Phone className="w-4.5 h-4.5 text-indigo-400" />
                    <div>
                      <span className="font-semibold text-[10px] uppercase text-slate-400">Direct Line</span>
                      <p className="text-foreground font-medium mt-0.5">{lead.phone}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-muted-foreground p-3 bg-secondary/30 rounded-xl">
                    <Mail className="w-4.5 h-4.5 text-indigo-400" />
                    <div>
                      <span className="font-semibold text-[10px] uppercase text-slate-400">Email Address</span>
                      <p className="text-foreground font-medium mt-0.5">{lead.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-muted-foreground p-3 bg-secondary/30 rounded-xl">
                    <Building2 className="w-4.5 h-4.5 text-indigo-400" />
                    <div>
                      <span className="font-semibold text-[10px] uppercase text-slate-400">Corporate Industry</span>
                      <p className="text-foreground font-medium mt-0.5">{lead.industry}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-muted-foreground p-3 bg-secondary/30 rounded-xl">
                    <DollarSign className="w-4.5 h-4.5 text-indigo-400" />
                    <div>
                      <span className="font-semibold text-[10px] uppercase text-slate-400">Allocated Budget</span>
                      <p className="text-foreground font-medium mt-0.5">${lead.budget ? lead.budget.toLocaleString() : "0"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-muted-foreground p-3 bg-secondary/30 rounded-xl">
                    <Globe className="w-4.5 h-4.5 text-indigo-400" />
                    <div>
                      <span className="font-semibold text-[10px] uppercase text-slate-400">Location Rules</span>
                      <p className="text-foreground font-medium mt-0.5">{lead.city}, {lead.state}, {lead.country}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-muted-foreground p-3 bg-secondary/30 rounded-xl">
                    <Tag className="w-4.5 h-4.5 text-indigo-400" />
                    <div>
                      <span className="font-semibold text-[10px] uppercase text-slate-400">Marketing Campaign</span>
                      <p className="text-foreground font-medium mt-0.5">{lead.campaign?.name || "None"}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="edit"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.12, ease: "easeInOut" }}
                className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4 text-xs"
              >
                <h3 className="font-bold text-sm">Modify Opportunity Parameters</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-400 uppercase mb-1">Full Name</label>
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full p-2 bg-secondary border border-border rounded-xl outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-400 uppercase mb-1">Email Address</label>
                    <input
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      disabled={user?.role === "SALES_EXECUTIVE" || user?.role === "VIEWER"}
                      className="w-full p-2 bg-secondary border border-border rounded-xl outline-none disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-400 uppercase mb-1">Phone Number</label>
                    <input
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      disabled={user?.role === "SALES_EXECUTIVE" || user?.role === "VIEWER"}
                      className="w-full p-2 bg-secondary border border-border rounded-xl outline-none disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-400 uppercase mb-1">Company</label>
                    <input
                      value={editCompany}
                      onChange={(e) => setEditCompany(e.target.value)}
                      className="w-full p-2 bg-secondary border border-border rounded-xl outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-400 uppercase mb-1">Allocated Budget ($)</label>
                    <input
                      type="number"
                      value={editBudget}
                      onChange={(e) => setEditBudget(Number(e.target.value))}
                      className="w-full p-2 bg-secondary border border-border rounded-xl outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-400 uppercase mb-1">Priority Ticket</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as Lead["status"])}
                      className="w-full p-2 bg-secondary border border-border rounded-xl outline-none font-semibold text-indigo-500"
                    >
                      {["NEW", "CONTACTED", "INTERESTED", "QUALIFIED", "PROPOSAL_SENT", "NEGOTIATION", "WON", "LOST", "CLOSED"].map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  {user && (user.role === "ADMIN" || user.role === "SUPER_ADMIN") && (
                    <div className="sm:col-span-2 border-t border-border pt-4 mt-2">
                      <label className="block font-bold text-slate-400 uppercase mb-1 text-2xs tracking-wider">Representative Owner (Assignment)</label>
                      <select
                        value={editAssignedToId}
                        onChange={(e) => setEditAssignedToId(e.target.value)}
                        className="w-full p-2 bg-secondary border border-border rounded-xl outline-none font-semibold text-indigo-500"
                      >
                        <option value="">Unassigned</option>
                        {employees.map((emp) => (
                          <option key={emp.userId} value={emp.userId}>
                            {emp.name} ({emp.role})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
                <div className="flex justify-end gap-2 border-t border-border pt-4 mt-4">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground font-semibold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveDetails}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl flex items-center gap-2 shadow-md"
                  >
                    <Save className="w-4 h-4" /> Save Details
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Activity Logs timeline */}
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4.5 h-4.5 text-indigo-500" /> Customer Activity History
            </h3>
            <div className="relative border-l-2 border-border pl-6 ml-2 space-y-6">
              {activities.map((act) => (
                <div key={act.id} className="relative">
                  {/* Timeline icon indicator */}
                  <div className="absolute -left-10 top-0.5 w-8 h-8 rounded-full bg-secondary border-2 border-border flex items-center justify-center text-slate-500">
                    {act.action === "CALL_LOGGED" ? (
                      <PhoneCall className="w-3.5 h-3.5 text-emerald-500" />
                    ) : act.action === "NOTE_ADDED" ? (
                      <FileText className="w-3.5 h-3.5 text-amber-500" />
                    ) : (
                      <Activity className="w-3.5 h-3.5 text-indigo-500" />
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground font-bold">
                      {new Date(act.createdAt).toLocaleString()}
                    </span>
                    <p className="text-xs font-semibold text-foreground mt-1">{act.details}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar notes & operations info */}
        <div className="space-y-6">
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4">
            <h3 className="font-bold text-xs text-muted-foreground uppercase tracking-wider">Opportunity Notes</h3>
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Record follow-up notes, phone calls summaries, objections..."
              className="w-full p-3 bg-secondary border border-border rounded-xl text-xs outline-none focus:border-indigo-500 min-h-24 resize-none"
            />
            <button
              onClick={handleAddNote}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-md"
            >
              <Plus className="w-4 h-4" /> Save Note Entry
            </button>
          </div>

          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4">
            <h3 className="font-bold text-xs text-muted-foreground uppercase tracking-wider">Representative Owner</h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center font-bold text-white shadow-inner">
                {lead.assignedToName?.charAt(0) || "U"}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-foreground truncate">{lead.assignedToName}</div>
                <div className="text-[10px] text-muted-foreground truncate">Primary Contact Executive</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
