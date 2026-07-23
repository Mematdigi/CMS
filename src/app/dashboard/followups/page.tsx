"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar as CalendarIcon, Clock, Plus, AlertCircle, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
export interface Followup {
  id: string;
  leadId: string;
  leadName: string;
  userId: string;
  dateTime: string;
  isRecurring: boolean;
  recurrence?: "DAILY" | "WEEKLY" | "MONTHLY" | null;
  status: string;
  notes?: string | null;
}

export interface Lead {
  id: string;
  name: string;
  company?: string | null;
}

import { getFollowupsAction, createFollowupAction } from "@/lib/actions/crm.actions";
import { Button, Card, Input, Select, Textarea, Modal, PageHeader } from "@/components/ui";

export default function FollowupsPage() {
  const [followups, setFollowups] = useState<Followup[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  
  // New followup form states
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState("");
  const [dateTime, setDateTime] = useState("");
  const [notes, setNotes] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrence, setRecurrence] = useState<"DAILY" | "WEEKLY" | "MONTHLY">("WEEKLY");

  // Calendar navigation
  const [currentDate, setCurrentDate] = useState(new Date(2026, 6, 10)); // July 2026 matching system timestamp
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const startDayIndex = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const loadData = () => {
    getFollowupsAction().then(setFollowups).catch(() => {});
    fetch("/api/leads?limit=1000")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setLeads(json.data);
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddFollowup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeadId || !dateTime) return;

    const lead = leads.find((l) => l.id === selectedLeadId);
    if (!lead) return;

    try {
      await createFollowupAction({
        leadId: selectedLeadId,
        dateTime,
        isRecurring,
        recurrence: isRecurring ? recurrence : undefined,
        notes,
      });

      setShowAddModal(false);
      setSelectedLeadId("");
      setDateTime("");
      setNotes("");
      setIsRecurring(false);
      loadData();
    } catch {}
  };

  // Generate calendar days grid
  const renderCalendarDays = () => {
    const cells = [];
    
    // Empty cells for shift
    for (let i = 0; i < startDayIndex; i++) {
      cells.push(<div key={`empty-${i}`} className="h-20 bg-secondary/10 border border-border/40" />);
    }

    // Days numbers
    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
      
      // Filter followups for this day
      const dayFollowups = followups.filter((f) => f.dateTime.startsWith(dateString));

      cells.push(
        <motion.div
          key={`day-${day}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: Math.min(day * 0.008, 0.3) }}
          whileHover={{ backgroundColor: "var(--secondary)" }}
          className="h-20 bg-card border border-border p-2 flex flex-col justify-between transition-colors cursor-pointer relative"
        >
          <span className="text-xs font-bold text-slate-500">{day}</span>
          <div className="space-y-1 overflow-hidden">
            {dayFollowups.map((f) => (
              <div
                key={f.id}
                className="text-[9px] font-semibold bg-indigo-500/10 text-indigo-500 px-1 py-0.5 rounded truncate"
                title={f.notes || undefined}
              >
                {f.leadName}
              </div>
            ))}
          </div>
        </motion.div>
      );
    }

    return cells;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Follow-ups Scheduler"
        description="Manage synchronization agendas, calendar entries, and recurrent alerts."
        border
        actions={
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4" /> Book Follow-up
          </Button>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Calendar visual layout */}
        <Card className="xl:col-span-2 p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-bold text-sm text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <CalendarIcon className="w-4.5 h-4.5 text-indigo-500" /> Interactive Work Agenda
            </h2>
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold">
                {currentDate.toLocaleString("default", { month: "long" })} {currentDate.getFullYear()}
              </span>
              <div className="flex gap-1.5">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
                  className="p-1 hover:bg-secondary rounded-lg border border-border"
                >
                  <ChevronLeft className="w-4 h-4" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
                  className="p-1 hover:bg-secondary rounded-lg border border-border"
                >
                  <ChevronRight className="w-4 h-4" />
                </motion.button>
              </div>
            </div>
          </div>

          {/* Calendar week header + days grid (horizontally scrollable on narrow screens) */}
          <div className="overflow-x-auto">
            <div className="min-w-[420px]">
              <div className="grid grid-cols-7 gap-1 text-center font-bold text-2xs text-slate-400 uppercase tracking-wider">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div key={day} className="py-1">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1 bg-secondary/30 rounded-xl overflow-hidden border border-border/80">
                {renderCalendarDays()}
              </div>
            </div>
          </div>
        </Card>

        {/* Sync lists of tasks upcoming & overdue */}
        <div className="space-y-6">
          <Card delay={0.1} className="p-6 space-y-4">
            <h3 className="font-bold text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <AlertCircle className="w-4.5 h-4.5 text-red-500" /> Overdue Notifications
            </h3>
            <div className="space-y-3">
              {followups.filter((f) => f.status === "OVERDUE").length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4 bg-secondary/10 rounded-xl">
                  Excellent, you have no overdue client follow-ups!
                </p>
              ) : (
                followups
                  .filter((f) => f.status === "OVERDUE")
                  .map((f, idx) => (
                    <motion.div
                      key={f.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="p-3 bg-secondary/30 border border-border rounded-xl flex flex-col gap-2 text-xs"
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-slate-800 dark:text-slate-200">{f.leadName}</span>
                        <span className="text-[9px] bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full font-bold">
                          OVERDUE
                        </span>
                      </div>
                      <p className="text-muted-foreground text-[11px] leading-relaxed">{f.notes}</p>
                    </motion.div>
                  ))
              )}
            </div>
          </Card>

          <Card delay={0.15} className="p-6 space-y-4">
            <h3 className="font-bold text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4.5 h-4.5 text-amber-500" /> Upcoming Reminders
            </h3>
            <div className="space-y-3">
              {followups.filter((f) => f.status === "PENDING").map((f, idx) => (
                <motion.div
                  key={f.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="p-3 bg-secondary/30 border border-border rounded-xl flex flex-col gap-2.5 text-xs"
                >
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-slate-800 dark:text-slate-200">{f.leadName}</span>
                    <span className="text-[9px] bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full font-bold">
                      PENDING
                    </span>
                  </div>
                  {f.isRecurring && (
                    <span className="text-[9px] text-indigo-500 font-semibold flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin-slow" /> Recurrent {f.recurrence}
                    </span>
                  )}
                  <p className="text-muted-foreground text-[11px] leading-relaxed">{f.notes}</p>
                  <div className="text-[10px] text-slate-500 font-bold border-t border-border/60 pt-2 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> {new Date(f.dateTime).toLocaleString()}
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Add Followup Modal */}
      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="Book Opportunity Follow-up" maxWidth="max-w-md">
        <form onSubmit={handleAddFollowup} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-400 uppercase mb-1.5">Select Contact Lead</label>
            <Select
              required
              value={selectedLeadId}
              onChange={(e) => setSelectedLeadId(e.target.value)}
              className="p-2.5 font-medium"
            >
              <option value="">Choose Opportunity</option>
              {leads.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} ({l.company})
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block font-bold text-slate-400 uppercase mb-1.5">Scheduled Date & Time</label>
            <Input
              required
              type="datetime-local"
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
              className="p-2.5"
            />
          </div>

          <div className="flex items-center gap-2 py-2">
            <input
              type="checkbox"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="rounded accent-indigo-500 border-border"
              id="isRecurring"
            />
            <label htmlFor="isRecurring" className="font-semibold text-slate-600 dark:text-slate-400 cursor-pointer">
              Enable Recurrent Synchronization
            </label>
          </div>

          {isRecurring && (
            <div>
              <label className="block font-bold text-slate-400 uppercase mb-1.5">Recurrence Schedule</label>
              <Select
                value={recurrence}
                onChange={(e) => setRecurrence(e.target.value as "DAILY" | "WEEKLY" | "MONTHLY")}
                className="p-2.5 font-medium"
              >
                <option value="DAILY">DAILY</option>
                <option value="WEEKLY">WEEKLY</option>
                <option value="MONTHLY">MONTHLY</option>
              </Select>
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-400 uppercase mb-1.5">Follow-up Notes / Objectives</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="SLA contract negotiations, detail pricing updates, sync calls..."
              className="p-3 min-h-20 resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-border pt-4 mt-4">
            <Button type="button" variant="secondary" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button type="submit">Confirm Booking</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
