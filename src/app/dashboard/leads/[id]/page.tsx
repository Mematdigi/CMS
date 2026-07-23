"use client";

import React, { useState, useEffect, use, useCallback } from "react";
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
  Radio,
  DollarSign,
  Plus,
  Activity,
  FileText,
  PhoneCall,
  Save,
  PenSquare,
  MessageSquare,
  ShoppingBag,
  ExternalLink,
} from "lucide-react";
import type { LeadActivity, WhatsappMessage } from "@prisma/client";

function parseShopifyNote(details: string) {
  if (!details.includes("Product URL:") && !details.includes("Variant ID:")) {
    return null;
  }

  // Extract URL
  const urlMatch = details.match(/Product\s*URL\s*:\s*(https?:\/\/[^\s]+)/i);
  const url = urlMatch ? urlMatch[1] : null;

  // Extract Variant ID
  const variantMatch = details.match(/Variant\s*ID\s*:\s*([^\s]+)/i);
  const variantId = variantMatch ? variantMatch[1] : null;

  // Extract Quantity
  const qtyMatch = details.match(/Quantity\s*:\s*([^\s]+)/i);
  const quantity = qtyMatch ? qtyMatch[1] : null;

  // Extract Customizations
  let customizations = "";
  const marker = "--- Customizations ---";
  if (details.includes(marker)) {
    customizations = details.split(marker)[1]?.trim() || "";
  }

  // Decode product title from URL slug
  let productTitle = "Shopify Product";
  if (url) {
    try {
      const parsedUrl = new URL(url);
      const pathSegments = parsedUrl.pathname.split("/").filter(Boolean);
      const slug = pathSegments[pathSegments.length - 1];
      if (slug) {
        productTitle = decodeURIComponent(slug)
          .split("-")
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
      }
    } catch (e) {
      console.error("Failed to parse product URL slug:", e);
    }
  }

  return {
    url,
    variantId,
    quantity,
    customizations,
    productTitle,
  };
}

interface Employee {
  id: string;
  userId: string;
  name: string;
  role: string;
}

interface CallLogData {
  id: string;
  leadId: string;
  userId: string;
  callType: string;
  durationSec: number;
  notes?: string;
  createdAt: string;
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
import { Button, Badge, Modal, Select, Textarea } from "@/components/ui";

interface PageProps {
  params: Promise<{ id: string }>;
}

const WHATSAPP_TEMPLATES = [
  { id: "welcome", name: "Welcome Opportunity", body: "Hello {{name}}, welcome to our CRM service! We are excited to help you grow your business." },
  { id: "follow_up", name: "Follow-up", body: "Hi {{name}}, just following up on our previous conversation. Let me know if you have any questions!" },
  { id: "pricing", name: "Pricing Inquiry", body: "Hello {{name}}, here is the pricing proposal we discussed. Please let us know if this aligns with your budget." },
  { id: "appointment", name: "Appointment Reminder", body: "Hi {{name}}, this is a friendly reminder for our upcoming meeting scheduled for tomorrow. Looking forward to speaking with you!" },
  { id: "missed_call", name: "Missed Call Back", body: "Hi {{name}}, we just tried calling you but missed you. Please let us know when is a good time to connect." }
];

export default function LeadDetailPage({ params }: PageProps) {
  const router = useRouter();
  const { startCall, user } = useCRMStore();
  const { id } = use(params);

  const [lead, setLead] = useState<Lead | null>(null);
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [newNote, setNewNote] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  // WhatsApp modal states
  const [isWaModalOpen, setIsWaModalOpen] = useState(false);
  const [waMessage, setWaMessage] = useState("");
  const [waTemplate, setWaTemplate] = useState("");
  const [isSendingWa, setIsSendingWa] = useState(false);
  const [waSendError, setWaSendError] = useState("");
  const [whatsappHistory, setWhatsappHistory] = useState<(WhatsappMessage & { user?: { name: string }; error?: string | null })[]>([]);

  // Form states
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editCompany, setEditCompany] = useState("");
  const [editBudget, setEditBudget] = useState(0);
  const [editStatus, setEditStatus] = useState<Lead["status"]>("NEW");
  const [employees, setEmployees] = useState<Employee[]>([]);
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
        callJson.data.filter((c: CallLogData) => c.leadId === id).forEach((call: CallLogData) => {
          logs.push({
            id: call.id,
            leadId: id,
            userId: call.userId,
            action: "CALL_LOGGED",
            details: `${call.callType} Call logged: Duration: ${call.durationSec}s. Notes: ${call.notes || "None"}`,
            createdAt: new Date(call.createdAt),
          });
        });
      }

      if (data.notes) {
        const noteEntries = data.notes.split(/\n\n+/);
        noteEntries.forEach((noteText: string, index: number) => {
          if (!noteText.trim()) return;
          logs.push({
            id: `act-note-${index}`,
            leadId: id,
            userId: "user-current",
            action: "NOTE_ADDED",
            details: noteText.startsWith("Note:") ? noteText : `Note: ${noteText}`,
            createdAt: data.updatedAt || data.createdAt,
          });
        });
      }

      logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setActivities(logs);

      // Fetch WhatsApp history
      const waRes = await fetch(`/api/whatsapp?leadId=${id}`);
      const waJson = await waRes.json();
      if (waJson.success) {
        setWhatsappHistory(waJson.data);
      }
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
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4"
      >
        <Link
          href="/dashboard/leads"
          className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-all group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" /> Back to pipeline
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="primary"
            className="bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
            onClick={() => startCall(lead.id, lead.name, lead.phone)}
          >
            <PhoneCall className="w-4 h-4" /> Start Call
          </Button>
          <Button
            onClick={() => {
              setWaMessage("");
              setWaTemplate("");
              setWaSendError("");
              setIsWaModalOpen(true);
            }}
          >
            <MessageSquare className="w-4 h-4" /> Send WhatsApp
          </Button>
          <Button variant="secondary" onClick={() => setIsEditing(!isEditing)}>
            <PenSquare className="w-4 h-4" /> {isEditing ? "View Details" : "Edit details"}
          </Button>
        </div>
      </motion.div>

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

                  <div className="flex items-center gap-3 text-muted-foreground p-3 bg-secondary/30 rounded-xl">
                    <Radio className="w-4.5 h-4.5 text-indigo-400" />
                    <div>
                      <span className="font-semibold text-[10px] uppercase text-slate-400">Lead Source</span>
                      <p className="text-foreground font-medium mt-0.5">{lead.leadSource || "Unknown"}</p>
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
              {activities.map((act) => {
                const shopifyInfo = act.action === "NOTE_ADDED" ? parseShopifyNote(act.details) : null;
                
                if (shopifyInfo) {
                  return (
                    <motion.div 
                      key={act.id} 
                      className="relative"
                      initial={{ opacity: 0, y: 15, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.35, ease: "easeOut" }}
                    >
                      {/* Timeline icon indicator */}
                      <div className="absolute -left-10 top-0.5 w-8 h-8 rounded-full bg-indigo-500/10 border-2 border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-2xs">
                        <ShoppingBag className="w-3.5 h-3.5" />
                      </div>
                      <div className="space-y-2">
                        {/* Event Meta */}
                        <div className="flex items-center gap-2.5">
                          <span className="text-[10px] text-muted-foreground font-bold font-mono">
                            {new Date(act.createdAt).toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1.5 text-[9px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 uppercase tracking-widest">
                            <span className="relative flex h-1.5 w-1.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                            </span>
                            Shopify Order Intent
                          </span>
                        </div>

                        {/* Premium Card Container */}
                        <motion.div 
                          className="mt-1 bg-white dark:bg-slate-900/40 border border-slate-250 dark:border-slate-800/80 hover:border-indigo-500/30 dark:hover:border-indigo-400/30 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 space-y-4"
                          whileHover={{ y: -1.5, scale: 1.002 }}
                        >
                          {/* Product Info Block */}
                          <div className="flex justify-between items-start gap-4">
                            <div className="space-y-1">
                              <span className="text-[9px] font-extrabold uppercase tracking-wider text-indigo-500/90 dark:text-indigo-400/90">
                                Shopify Storefront Product
                              </span>
                              <h4 className="text-sm font-extrabold text-foreground leading-snug tracking-tight">
                                {shopifyInfo.productTitle}
                              </h4>
                            </div>
                          </div>

                          {/* Order Details Grid */}
                          <div className="grid grid-cols-2 gap-3 border-y border-slate-100 dark:border-slate-850 py-3.5">
                            <div className="space-y-1">
                              <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">
                                Variant Reference
                              </span>
                              <code className="inline-block text-[10px] font-bold font-mono text-slate-600 dark:text-slate-300 bg-slate-100/80 dark:bg-slate-800/85 px-2 py-0.5 rounded-md border border-slate-200/40 dark:border-slate-700/50">
                                {shopifyInfo.variantId || "N/A"}
                              </code>
                            </div>
                            <div className="space-y-1">
                              <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">
                                Requested Quantity
                              </span>
                              <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400">
                                {shopifyInfo.quantity || "1"} Unit(s)
                              </span>
                            </div>
                          </div>
                          
                          {/* Customizations Specification */}
                          {shopifyInfo.customizations && (
                            <div className="bg-slate-50/50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/60 rounded-xl p-3.5 space-y-2">
                              <span className="block font-extrabold text-[9px] uppercase tracking-wider text-slate-400">
                                Option Customizations
                              </span>
                              <p className="text-xs whitespace-pre-wrap font-medium text-slate-650 dark:text-slate-300 leading-relaxed border-l-2 border-indigo-500 pl-3">
                                {shopifyInfo.customizations}
                              </p>
                            </div>
                          )}

                          {/* Action Link Button */}
                          {shopifyInfo.url && (
                            <div className="pt-1 flex justify-end">
                              <a
                                href={shopifyInfo.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50/50 dark:bg-indigo-950/20 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-indigo-100/50 dark:border-indigo-900/30 hover:border-indigo-200 dark:hover:border-indigo-850 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400 transition-all duration-200 shadow-3xs hover:shadow-2xs active:scale-98"
                              >
                                View Product on Shopify <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          )}
                        </motion.div>
                      </div>
                    </motion.div>
                  );
                }

                return (
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
                      <p className="text-xs font-semibold text-foreground mt-1 whitespace-pre-wrap">{act.details}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* WhatsApp Messaging History */}
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <MessageSquare className="w-4.5 h-4.5 text-indigo-500" /> WhatsApp Communication Logs
              </h3>
              <span className="text-2xs text-muted-foreground font-semibold px-2 py-0.5 bg-secondary rounded-full">
                {whatsappHistory.length} messages
              </span>
            </div>

            {whatsappHistory.length === 0 ? (
              <div className="text-center py-6 text-xs text-muted-foreground">
                No WhatsApp messages logged for this contact.
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {whatsappHistory.map((msg, idx) => {
                  let tone: "slate" | "amber" | "sky" | "emerald" | "indigo" | "red" = "slate";
                  if (msg.status === "QUEUED") tone = "amber";
                  else if (msg.status === "SENT") tone = "sky";
                  else if (msg.status === "DELIVERED") tone = "emerald";
                  else if (msg.status === "READ") tone = "indigo";
                  else if (msg.status === "FAILED") tone = "red";

                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(idx * 0.04, 0.3) }}
                      className="p-3 bg-secondary/20 border border-border/60 rounded-xl space-y-2"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground font-bold">
                            {new Date(msg.createdAt).toLocaleString()}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">• Sent by {msg.user?.name || "System"}</span>
                        </div>
                        <Badge tone={tone} className="text-[9px]">{msg.status}</Badge>
                      </div>
                      <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">{msg.messageBody}</p>
                      {msg.error && (
                        <div className="text-[10px] text-rose-500 bg-rose-500/5 px-2.5 py-1 rounded-lg border border-rose-500/10">
                          <strong>Error Details:</strong> {msg.error}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
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

      {/* WhatsApp Modal Dialog overlay */}
      <Modal
        open={isWaModalOpen}
        onClose={() => setIsWaModalOpen(false)}
        maxWidth="max-w-lg"
        title={
          <div>
            <h3 className="text-base font-bold text-foreground">Send WhatsApp Message</h3>
            <p className="text-xs text-muted-foreground mt-0.5 font-normal">Recipient: {lead.name} ({lead.phone})</p>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Select Message Template</label>
            <Select
              value={waTemplate}
              onChange={(e) => {
                const tplId = e.target.value;
                setWaTemplate(tplId);
                const selected = WHATSAPP_TEMPLATES.find(t => t.id === tplId);
                if (selected) {
                  setWaMessage(selected.body.replace("{{name}}", lead.name));
                } else {
                  setWaMessage("");
                }
              }}
              className="p-2.5 text-indigo-500"
            >
              <option value="">-- Free Text Message --</option>
              {WHATSAPP_TEMPLATES.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 flex justify-between">
              <span>Message Body</span>
              <span className={`${waMessage.length > 1600 ? "text-rose-500" : "text-slate-400"}`}>
                {waMessage.length} characters
              </span>
            </label>
            <Textarea
              value={waMessage}
              onChange={(e) => setWaMessage(e.target.value)}
              placeholder="Type your WhatsApp message..."
              className="p-3 min-h-36 resize-none"
            />
          </div>

          {waSendError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs rounded-xl">
              {waSendError}
            </div>
          )}
        </div>

        <div className="-mx-6 -mb-6 mt-6 p-6 bg-secondary/30 border-t border-border flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setIsWaModalOpen(false)} disabled={isSendingWa}>
            Cancel
          </Button>
          <Button
            loading={isSendingWa}
            disabled={!waMessage.trim()}
            onClick={async () => {
              if (!waMessage.trim()) return;
              setIsSendingWa(true);
              setWaSendError("");
              try {
                const res = await fetch("/api/whatsapp/send", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    leadId: lead.id,
                    messageBody: waMessage,
                    templateName: waTemplate || undefined,
                  })
                });
                const json = await res.json();
                if (json.success) {
                  setIsWaModalOpen(false);
                  loadData();
                } else {
                  setWaSendError(json.error || "Failed to send message.");
                }
              } catch {
                setWaSendError("Network error sending message.");
              } finally {
                setIsSendingWa(false);
              }
            }}
          >
            {isSendingWa ? "Sending..." : "Send Message"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
