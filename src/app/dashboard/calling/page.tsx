"use client";

import React, { useState, useEffect } from "react";
import { useCRMStore } from "@/lib/store/useCRMStore";
export interface CallLog {
  id: string;
  leadId: string;
  leadName: string;
  userId: string;
  durationSec: number;
  recordingUrl?: string;
  callType: string;
  notes: string;
  createdAt: string;
}

import { PhoneCall, Volume2, Play, Pause, ArrowUpRight, ArrowDownLeft, PhoneMissed, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button, Card, Input, PageHeader, EmptyState } from "@/components/ui";

export default function CallingPage() {
  const { startCall } = useCRMStore();
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [typedNumber, setTypedNumber] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Audio recording player simulation
  const [playingId, setPlayingId] = useState<string | null>(null);

  const loadLogs = () => {
    fetch("/api/calls")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setCallLogs(json.data);
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadLogs();
  }, []);

  // Simulate audio playback progress
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (playingId) {
      timer = setTimeout(() => {
        setPlayingId(null);
      }, 5000); // Simulated playback finishes in 5s
    }
    return () => clearTimeout(timer);
  }, [playingId]);

  const handleKeyPress = (num: string) => {
    setTypedNumber((prev) => prev + num);
  };

  const handleBackspace = () => {
    setTypedNumber((prev) => prev.slice(0, -1));
  };

  const handleManualDial = () => {
    if (!typedNumber) return;
    startCall("manual-call", "Outbound Call Session", typedNumber);
  };

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const filteredLogs = callLogs.filter(
    (log) =>
      (log.leadName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.notes && log.notes.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="VoIP Calling Center"
        description="Fortius Infocom cloud telephony routing integrations, recording backups, and softphone dialpad."
        border
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Softphone Dialer Keypad */}
        <Card className="p-6 flex flex-col items-center justify-between min-h-[420px]">
          <div className="w-full text-center space-y-2">
            <span className="text-2xs font-bold text-slate-400 uppercase tracking-wider block">Manual Keypad dialer</span>
            <Input
              type="text"
              value={typedNumber}
              onChange={(e) => setTypedNumber(e.target.value)}
              placeholder="Enter phone number..."
              className="text-center text-xl font-bold bg-transparent border-none py-2 text-indigo-500 placeholder-slate-600 focus:ring-0"
            />
          </div>

          {/* Numbers Grid */}
          <div className="grid grid-cols-3 gap-3 w-full max-w-[240px] my-6">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"].map((btn, idx) => (
              <motion.button
                key={btn}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.02 }}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => handleKeyPress(btn)}
                className="w-14 h-14 bg-secondary hover:bg-indigo-600/10 border border-border hover:border-indigo-500/30 text-foreground font-bold text-lg rounded-full flex items-center justify-center transition-colors"
              >
                {btn}
              </motion.button>
            ))}
          </div>

          <div className="flex gap-3 w-full max-w-[240px]">
            <Button variant="secondary" onClick={handleBackspace} className="flex-1">
              Clear
            </Button>
            <Button
              onClick={handleManualDial}
              className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-emerald-600/20"
            >
              <PhoneCall className="w-4 h-4" /> Dial
            </Button>
          </div>
        </Card>

        {/* Call Logs list */}
        <Card delay={0.1} className="xl:col-span-2 p-6 space-y-4 flex flex-col">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h2 className="font-bold text-sm text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Volume2 className="w-4.5 h-4.5 text-indigo-500" /> SIP Call Logs History
            </h2>
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 py-1.5"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 max-h-[400px]">
            {filteredLogs.length === 0 ? (
              <EmptyState icon={PhoneCall} title="No call history" description="No call history logs found." />
            ) : (
              <AnimatePresence>
              {filteredLogs.map((log, idx) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(idx * 0.04, 0.3) }}
                  className="p-4 bg-secondary/30 border border-border rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      log.callType === "INCOMING"
                        ? "bg-emerald-500/10 text-emerald-500"
                        : log.callType === "MISSED"
                        ? "bg-rose-500/10 text-rose-500"
                        : "bg-indigo-500/10 text-indigo-500"
                    }`}>
                      {log.callType === "INCOMING" ? (
                        <ArrowDownLeft className="w-4.5 h-4.5" />
                      ) : log.callType === "MISSED" ? (
                        <PhoneMissed className="w-4.5 h-4.5" />
                      ) : (
                        <ArrowUpRight className="w-4.5 h-4.5" />
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-foreground flex items-center gap-2">
                        <span>{log.leadName || "Unknown Lead"}</span>
                        <span className="text-[10px] text-slate-500 font-normal">
                          {new Date(log.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <p className="text-muted-foreground mt-0.5">{log.notes}</p>
                    </div>
                  </div>

                  {/* Call player control (simulation) */}
                  <div className="flex items-center gap-3 justify-between sm:justify-end shrink-0">
                    <span className="font-semibold text-slate-500">Duration: {formatDuration(log.durationSec)}</span>
                    {log.durationSec > 0 && (
                      <button
                        onClick={() => {
                          if (playingId === log.id) {
                            setPlayingId(null);
                          } else {
                            setPlayingId(log.id);
                          }
                        }}
                        className={`p-2 rounded-full border transition-all ${
                          playingId === log.id
                            ? "bg-indigo-500 border-indigo-500 text-white animate-pulse"
                            : "bg-secondary hover:bg-indigo-500/10 border-border hover:border-indigo-500/20 text-indigo-500"
                        }`}
                      >
                        {playingId === log.id ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
              </AnimatePresence>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
