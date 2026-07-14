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

import { motion } from "framer-motion";
import { Phone, PhoneCall, Volume2, Play, Pause, ArrowUpRight, ArrowDownLeft, PhoneMissed, Search, MessageSquare } from "lucide-react";

export default function CallingPage() {
  const { startCall } = useCRMStore();
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [typedNumber, setTypedNumber] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Audio recording player simulation
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audioProgress, setAudioProgress] = useState(0);

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
      timer = setInterval(() => {
        setAudioProgress((prev) => {
          if (prev >= 100) {
            setPlayingId(null);
            return 0;
          }
          return prev + 10;
        });
      }, 500);
    } else {
      setAudioProgress(0);
    }
    return () => clearInterval(timer);
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">VoIP Calling Center</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Fortius Infocom cloud telephony routing integrations, recording backups, and softphone dialpad.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Softphone Dialer Keypad */}
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm flex flex-col items-center justify-between min-h-[420px]">
          <div className="w-full text-center space-y-2">
            <span className="text-2xs font-bold text-slate-400 uppercase tracking-wider block">Manual Keypad dialer</span>
            <input
              type="text"
              value={typedNumber}
              onChange={(e) => setTypedNumber(e.target.value)}
              placeholder="Enter phone number..."
              className="w-full text-center text-xl font-bold bg-transparent outline-none py-2 text-indigo-500 placeholder-slate-600"
            />
          </div>

          {/* Numbers Grid */}
          <div className="grid grid-cols-3 gap-3 w-full max-w-[240px] my-6">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"].map((btn) => (
              <button
                key={btn}
                onClick={() => handleKeyPress(btn)}
                className="w-14 h-14 bg-secondary hover:bg-indigo-600/10 border border-border hover:border-indigo-500/30 text-foreground font-bold text-lg rounded-full flex items-center justify-center transition-all"
              >
                {btn}
              </button>
            ))}
          </div>

          <div className="flex gap-3 w-full max-w-[240px]">
            <button
              onClick={handleBackspace}
              className="flex-1 py-3.5 bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold rounded-xl border border-border transition-all"
            >
              Clear
            </button>
            <button
              onClick={handleManualDial}
              className="flex-1 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-750 text-white text-xs font-semibold rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
            >
              <PhoneCall className="w-4 h-4" /> Dial
            </button>
          </div>
        </div>

        {/* Call Logs list */}
        <div className="xl:col-span-2 bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4 flex flex-col">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h2 className="font-bold text-sm text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Volume2 className="w-4.5 h-4.5 text-indigo-500" /> SIP Call Logs History
            </h2>
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-1.5 bg-secondary border border-border focus:border-indigo-500 rounded-xl text-xs outline-none transition-all"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 max-h-[400px]">
            {filteredLogs.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">No call history logs found.</p>
            ) : (
              filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 bg-secondary/30 border border-border rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs hover:bg-secondary/50 transition-all"
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
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
