"use client";

import React, { useState } from "react";
import { Settings as SettingsIcon, Mail, MessageSquare, Key, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { saveTenantSettingsAction } from "@/lib/actions/crm.actions";
import { Button, Input, Select, PageHeader } from "@/components/ui";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"company" | "permissions" | "templates">("company");
  
  // Settings configurations
  const [companyName, setCompanyName] = useState("Enterprise Corporate Holdings");
  const [subdomain, setSubdomain] = useState("enterprise");
  const [assignmentMode, setAssignmentMode] = useState("ROUND_ROBIN");
  const [saved, setSaved] = useState(false);

  // Role permissions matrix configuration state
  const [permissions, setPermissions] = useState([
    { role: "SUPER_ADMIN", view: true, create: true, edit: true, delete: true, export: true },
    { role: "ADMIN", view: true, create: true, edit: true, delete: true, export: true },
    { role: "MANAGER", view: true, create: true, edit: true, delete: false, export: true },
    { role: "TEAM_LEADER", view: true, create: true, edit: true, delete: false, export: false },
    { role: "SALES_EXECUTIVE", view: true, create: true, edit: true, delete: false, export: false },
    { role: "VIEWER", view: true, create: false, edit: false, delete: false, export: false },
  ]);

  const togglePermission = (roleName: string, field: "view" | "create" | "edit" | "delete" | "export") => {
    setPermissions((prev) =>
      prev.map((p) => (p.role === roleName ? { ...p, [field]: !p[field] } : p))
    );
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await saveTenantSettingsAction({
        companyName,
        subdomain,
        assignmentMode,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {}
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Settings Portal"
        description="Configure multi-tenant branding, role permissions matrix, templates, and smart rules."
        border
      />

      {/* Tabs bar */}
      <div className="flex gap-2 border-b border-border text-xs font-bold text-muted-foreground relative overflow-x-auto whitespace-nowrap">
        {[
          { id: "company", label: "Company Profile & Rules", icon: SettingsIcon },
          { id: "permissions", label: "RBAC Permissions Matrix", icon: Key },
          { id: "templates", label: "Messaging Templates", icon: Mail },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as "company" | "permissions" | "templates")}
              className={`relative flex items-center gap-2 px-4 py-3 transition-colors outline-none ${
                isActive ? "text-indigo-500" : "hover:text-foreground"
              }`}
            >
              <Icon className="w-4 h-4" /> {tab.label}
              {isActive && (
                <motion.div
                  layoutId="settingsTabIndicator"
                  className="absolute left-0 right-0 -bottom-px h-0.5 bg-indigo-500"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {/* Tab 1: Company Profile */}
        {activeTab === "company" && (
          <motion.form
            key="company"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.12, ease: "easeInOut" }}
            onSubmit={handleSaveSettings}
            className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-6 max-w-2xl text-xs"
          >
            {saved && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 p-3 rounded-xl flex items-center gap-2 font-semibold">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>Tenant configurations successfully synchronized.</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-400 uppercase mb-1.5">Tenant Organization Name</label>
                <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="p-2.5" />
              </div>

              <div>
                <label className="block font-bold text-slate-400 uppercase mb-1.5">Subdomain Partition</label>
                <Input value={subdomain} onChange={(e) => setSubdomain(e.target.value)} className="p-2.5" />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-400 uppercase mb-1.5">Lead Smart Assignment Mode</label>
                <Select
                  value={assignmentMode}
                  onChange={(e) => setAssignmentMode(e.target.value)}
                  className="p-2.5 font-semibold text-indigo-500"
                >
                  <option value="ROUND_ROBIN">Round Robin Sequential Distribution</option>
                  <option value="RULES">Rule Matrix Evaluation (States / Products)</option>
                  <option value="MANUAL">Manual Ownership Delegation</option>
                </Select>
              </div>
            </div>

            <div className="border-t border-border pt-4 mt-4 flex justify-end">
              <Button type="submit" size="lg">Save General Settings</Button>
            </div>
          </motion.form>
        )}

        {/* Tab 2: RBAC Matrix */}
        {activeTab === "permissions" && (
          <motion.div
            key="permissions"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.12, ease: "easeInOut" }}
            className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden text-xs"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-secondary/40 font-semibold text-muted-foreground border-b border-border">
                    <th className="p-4">Workspace Role</th>
                    <th className="p-4 text-center">View Leads</th>
                    <th className="p-4 text-center">Create Leads</th>
                    <th className="p-4 text-center">Edit Leads</th>
                    <th className="p-4 text-center">Delete Leads</th>
                    <th className="p-4 text-center">Export Reports</th>
                  </tr>
                </thead>
                <tbody>
                  {permissions.map((p, idx) => (
                    <motion.tr
                      key={p.role}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="border-b border-border hover:bg-secondary/10 transition-colors font-mono text-[11px]"
                    >
                      <td className="p-4 font-bold text-foreground">{p.role}</td>
                      <td className="p-4 text-center">
                        <input
                          type="checkbox"
                          checked={p.view}
                          onChange={() => togglePermission(p.role, "view")}
                          className="rounded accent-indigo-500 border-border"
                        />
                      </td>
                      <td className="p-4 text-center">
                        <input
                          type="checkbox"
                          checked={p.create}
                          onChange={() => togglePermission(p.role, "create")}
                          className="rounded accent-indigo-500 border-border"
                        />
                      </td>
                      <td className="p-4 text-center">
                        <input
                          type="checkbox"
                          checked={p.edit}
                          onChange={() => togglePermission(p.role, "edit")}
                          className="rounded accent-indigo-500 border-border"
                        />
                      </td>
                      <td className="p-4 text-center">
                        <input
                          type="checkbox"
                          checked={p.delete}
                          onChange={() => togglePermission(p.role, "delete")}
                          className="rounded accent-indigo-500 border-border"
                        />
                      </td>
                      <td className="p-4 text-center">
                        <input
                          type="checkbox"
                          checked={p.export}
                          onChange={() => togglePermission(p.role, "export")}
                          className="rounded accent-indigo-500 border-border"
                        />
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Tab 3: Templates */}
        {activeTab === "templates" && (
          <motion.div
            key="templates"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.12, ease: "easeInOut" }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs"
          >
            {/* Email Templates card */}
            <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4 hover-lift">
              <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Mail className="w-4.5 h-4.5 text-indigo-500" /> Default Email Templates
              </h3>
              <div className="p-4 bg-secondary/40 border border-border rounded-xl">
                <span className="font-bold text-indigo-500 text-xs block mb-1">new_opportunity_intro</span>
                <div className="text-slate-500 font-semibold mb-2">Subject: Welcome to Enterprise CRM platform</div>
                <p className="text-muted-foreground italic leading-relaxed">
                  Hi {"{name}"}, we received your query for {"{product}"}. One of our representatives will contact you shortly.
                </p>
              </div>
            </div>

            {/* WhatsApp Templates card */}
            <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4 hover-lift">
              <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <MessageSquare className="w-4.5 h-4.5 text-indigo-500" /> Meta WhatsApp Business Templates
              </h3>
              <div className="p-4 bg-secondary/40 border border-border rounded-xl">
                <span className="font-bold text-indigo-500 text-xs block mb-1">welcome_template</span>
                <p className="text-muted-foreground italic leading-relaxed">
                  Hello {"{name}"}, welcome to Enterprise CRM! Let us know how we can support you.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
