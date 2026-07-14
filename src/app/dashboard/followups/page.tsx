"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
        <div
          key={`day-${day}`}
          className="h-20 bg-card border border-border p-2 flex flex-col justify-between hover:bg-secondary/20 transition-all cursor-pointer relative"
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
        </div>
      );
    }

    return cells;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Follow-ups Scheduler</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage synchronization agendas, calendar entries, and recurrent alerts.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition-all shadow-md"
        >
          <Plus className="w-4 h-4" /> Book Follow-up
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Calendar visual layout */}
        <div className="xl:col-span-2 bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-bold text-sm text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <CalendarIcon className="w-4.5 h-4.5 text-indigo-500" /> Interactive Work Agenda
            </h2>
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold">
                {currentDate.toLocaleString("default", { month: "long" })} {currentDate.getFullYear()}
              </span>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
                  className="p-1 hover:bg-secondary rounded-lg border border-border"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
                  className="p-1 hover:bg-secondary rounded-lg border border-border"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Calendar week header */}
          <div className="grid grid-cols-7 gap-1 text-center font-bold text-2xs text-slate-400 uppercase tracking-wider">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-1 bg-secondary/30 rounded-xl overflow-hidden border border-border/80">
            {renderCalendarDays()}
          </div>
        </div>

        {/* Sync lists of tasks upcoming & overdue */}
        <div className="space-y-6">
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4">
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
                  .map((f) => (
                    <div
                      key={f.id}
                      className="p-3 bg-secondary/30 border border-border rounded-xl flex flex-col gap-2 text-xs"
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-slate-800 dark:text-slate-200">{f.leadName}</span>
                        <span className="text-[9px] bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full font-bold">
                          OVERDUE
                        </span>
                      </div>
                      <p className="text-muted-foreground text-[11px] leading-relaxed">{f.notes}</p>
                    </div>
                  ))
              )}
            </div>
          </div>

          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4">
            <h3 className="font-bold text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4.5 h-4.5 text-amber-500" /> Upcoming Reminders
            </h3>
            <div className="space-y-3">
              {followups.filter((f) => f.status === "PENDING").map((f) => (
                <div
                  key={f.id}
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
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Add Followup Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl p-6"
            >
              <h2 className="text-xl font-bold mb-4 border-b border-border pb-3">Book Opportunity Follow-up</h2>

              <form onSubmit={handleAddFollowup} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-400 uppercase mb-1.5">Select Contact Lead</label>
                  <select
                    required
                    value={selectedLeadId}
                    onChange={(e) => setSelectedLeadId(e.target.value)}
                    className="w-full p-2.5 bg-secondary border border-border rounded-xl outline-none font-medium text-foreground"
                  >
                    <option value="">Choose Opportunity</option>
                    {leads.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name} ({l.company})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-400 uppercase mb-1.5">Scheduled Date & Time</label>
                  <input
                    required
                    type="datetime-local"
                    value={dateTime}
                    onChange={(e) => setDateTime(e.target.value)}
                    className="w-full p-2.5 bg-secondary border border-border rounded-xl outline-none text-foreground"
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
                    <select
                      value={recurrence}
                      onChange={(e) => setRecurrence(e.target.value as "DAILY" | "WEEKLY" | "MONTHLY")}
                      className="w-full p-2.5 bg-secondary border border-border rounded-xl outline-none font-medium text-foreground"
                    >
                      <option value="DAILY">DAILY</option>
                      <option value="WEEKLY">WEEKLY</option>
                      <option value="MONTHLY">MONTHLY</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block font-bold text-slate-400 uppercase mb-1.5">Follow-up Notes / Objectives</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="SLA contract negotiations, detail pricing updates, sync calls..."
                    className="w-full p-3 bg-secondary border border-border rounded-xl outline-none focus:border-indigo-500 min-h-20 resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2 border-t border-border pt-4 mt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground font-semibold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md"
                  >
                    Confirm Booking
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
