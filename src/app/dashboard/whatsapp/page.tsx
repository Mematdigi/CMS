"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import type { Lead, WhatsappMessage } from "@prisma/client";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Search, CheckCheck, AlertCircle, FileText, Image as ImageIcon, Check, MessageSquare } from "lucide-react";
import { Button, Input, PageHeader, EmptyState } from "@/components/ui";

const WHATSAPP_TEMPLATES = [
  { name: "welcome_template", body: "Hello {{name}}, welcome to Enterprise CRM! Let us know how we can support you." },
  { name: "followup_pricing", body: "Dear {{name}}, just following up regarding the pricing proposal contract details we synced on." },
  { name: "sla_signature", body: "Hello {{name}}, could you please review and sign the SLA contract copy sent to your portal?" }
];

export default function WhatsappPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [messages, setMessages] = useState<WhatsappMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modals / Templates dropdown
  const [showTemplates, setShowTemplates] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const loadLeads = useCallback(() => {
    fetch("/api/leads?limit=100")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setLeads(json.data);
          if (json.data.length > 0 && !selectedLead) {
            setSelectedLead(json.data[0]);
          }
        }
      })
      .catch(() => {});
  }, [selectedLead]);

  const loadMessages = useCallback(() => {
    if (!selectedLead) return;
    fetch(`/api/whatsapp?leadId=${selectedLead.id}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setMessages(json.data);
      })
      .catch(() => {});
  }, [selectedLead]);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle auto replies refresh
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (selectedLead) {
      timer = setInterval(() => {
        loadMessages();
      }, 3000); // refresh every 3s
    }
    return () => clearInterval(timer);
  }, [selectedLead, loadMessages]);

  const handleSendMessage = async (textToSend = inputText, templateName?: string) => {
    if (!textToSend.trim() || !selectedLead) return;

    try {
      const res = await fetch("/api/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: selectedLead.id,
          userId: "user-current",
          messageBody: textToSend,
          templateName,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setInputText("");
        setShowTemplates(false);
        loadMessages();
      }
    } catch {}
  };

  const applyTemplate = (template: typeof WHATSAPP_TEMPLATES[0]) => {
    if (!selectedLead) return;
    const compiled = template.body.replace("{{name}}", selectedLead.name);
    handleSendMessage(compiled, template.name);
  };

  const handleSendSamplePdf = async () => {
    if (!selectedLead) return;
    try {
      await fetch("/api/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: selectedLead.id,
          userId: "user-current",
          messageBody: "Sharing invoice document proposal layout.",
          mediaUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        }),
      });
      loadMessages();
    } catch {}
  };

  const handleSendSampleImage = async () => {
    if (!selectedLead) return;
    try {
      await fetch("/api/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: selectedLead.id,
          userId: "user-current",
          messageBody: "Here is the product layout specification dashboard screenshot.",
          mediaUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400",
        }),
      });
      loadMessages();
    } catch {}
  };

  const filteredLeads = leads.filter((l) =>
    l.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Meta WhatsApp Workspace"
        description="WhatsApp Business API templates management and customer conversations timeline."
        border
      />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col md:grid md:grid-cols-3 bg-card border border-border rounded-2xl shadow-sm overflow-hidden h-auto md:h-[600px]"
      >
        {/* Left Column - Chats list */}
        <div className="border-b md:border-b-0 border-r border-border flex flex-col h-72 md:h-full bg-secondary/10">
          <div className="p-4 border-b border-border bg-card">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-border/60">
            {filteredLeads.map((lead, idx) => {
              const isActive = selectedLead?.id === lead.id;
              return (
                <motion.div
                  key={lead.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(idx * 0.03, 0.3) }}
                  onClick={() => setSelectedLead(lead)}
                  className={`p-4 flex items-center gap-3 cursor-pointer transition-colors ${
                    isActive ? "bg-indigo-500/5 text-indigo-500" : "hover:bg-secondary/40 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center font-bold text-white shadow-inner shrink-0">
                    {lead.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1 text-xs">
                    <div className="font-bold text-foreground truncate">{lead.name}</div>
                    <div className="text-slate-500 font-semibold truncate mt-0.5">{lead.company}</div>
                    <div className="text-[10px] text-indigo-400 font-medium truncate mt-1">{lead.phone}</div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Right Column - Chat Window */}
        <div className="md:col-span-2 flex flex-col h-[480px] md:h-full bg-secondary/5">
          {selectedLead ? (
            <div className="flex-1 flex flex-col min-h-0">
              {/* Chat Header */}
              <div className="p-4 border-b border-border bg-card flex justify-between items-center z-10 shrink-0 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center font-bold text-white shadow-inner">
                    {selectedLead.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-foreground leading-snug">{selectedLead.name}</h3>
                    <p className="text-[10px] font-semibold text-indigo-500 mt-0.5">{selectedLead.company} • {selectedLead.phone}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={handleSendSamplePdf}
                    className="p-2 hover:bg-secondary rounded-xl text-muted-foreground hover:text-indigo-500 transition-colors border border-border bg-card"
                    title="Send proposal PDF copy"
                  >
                    <FileText className="w-4 h-4" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={handleSendSampleImage}
                    className="p-2 hover:bg-secondary rounded-xl text-muted-foreground hover:text-indigo-500 transition-colors border border-border bg-card"
                    title="Send spec screenshot image"
                  >
                    <ImageIcon className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>

              {/* Chat Area bubble list */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-secondary/10">
                {messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <EmptyState
                      icon={AlertCircle}
                      title="No messages yet"
                      description="No WhatsApp messages logged for this contact. Use templates dropdown to send first message."
                    />
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const isOut = msg.direction === "OUTBOUND";
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ delay: Math.min(idx * 0.03, 0.3), duration: 0.25 }}
                        className={`flex ${isOut ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-xs shadow-xs relative leading-relaxed ${
                            isOut
                              ? "bg-indigo-600 text-white rounded-tr-none"
                              : "bg-card border border-border text-foreground rounded-tl-none"
                          }`}
                        >
                          {/* Template badge */}
                          {msg.templateName && (
                            <span className="block text-[8px] uppercase tracking-wider font-extrabold text-indigo-200 mb-1">
                              Meta Template: {msg.templateName}
                            </span>
                          )}

                          {/* PDF/Attachment download */}
                          {msg.mediaUrl && msg.mediaUrl.endsWith(".pdf") && (
                            <div className="p-2 bg-indigo-950/20 dark:bg-slate-900/50 rounded-xl mb-2 border border-white/10 flex items-center gap-3">
                              <FileText className="w-8 h-8 text-indigo-400" />
                              <div className="min-w-0">
                                <a
                                  href={msg.mediaUrl}
                                  target="_blank"
                                  className="font-bold underline text-indigo-300 block truncate"
                                >
                                  proposal_specs.pdf
                                </a>
                                <span className="text-[9px] text-slate-400">PDF Document</span>
                              </div>
                            </div>
                          )}

                          {/* Image visual attachment */}
                          {msg.mediaUrl && !msg.mediaUrl.endsWith(".pdf") && (
                            <div className="mb-2 rounded-lg overflow-hidden border border-white/10">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={msg.mediaUrl} alt="whatsapp shared content" className="max-w-full h-auto object-cover max-h-40" />
                            </div>
                          )}

                          <p>{msg.messageBody}</p>

                          <div className="flex justify-end items-center gap-1 mt-1 text-[9px] opacity-75 font-mono">
                            <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                            {isOut && (
                              msg.status === "READ" ? (
                                <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Check className="w-3.5 h-3.5 text-white/50" />
                              )
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input controls */}
              <div className="p-4 border-t border-border bg-card relative shrink-0">
                {/* Templates Selector box */}
                <AnimatePresence>
                  {showTemplates && (
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 15 }}
                      className="absolute bottom-full left-4 right-4 mb-2 bg-card border border-border shadow-xl rounded-2xl p-4 space-y-3 z-30"
                    >
                      <h4 className="font-extrabold text-xs text-muted-foreground uppercase tracking-wider">
                        Meta Approved Templates
                      </h4>
                      <div className="space-y-2">
                        {WHATSAPP_TEMPLATES.map((tpl) => (
                          <div
                            key={tpl.name}
                            onClick={() => applyTemplate(tpl)}
                            className="p-3 bg-secondary/40 border border-border hover:border-indigo-500 rounded-xl cursor-pointer transition-all hover:bg-secondary/70 text-xs"
                          >
                            <span className="font-bold text-indigo-500 block mb-1">{tpl.name}</span>
                            <p className="text-muted-foreground italic leading-relaxed">
                              {tpl.body.replace("{{name}}", selectedLead.name)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex items-center gap-3">
                  <Button variant="secondary" className="text-indigo-500 whitespace-nowrap" onClick={() => setShowTemplates(!showTemplates)}>
                    Use Template
                  </Button>
                  <Input
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Type WhatsApp chat message..."
                    className="flex-1 px-4 py-2"
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  />
                  <Button size="icon" onClick={() => handleSendMessage()} className="shrink-0">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState
                icon={MessageSquare}
                title="No conversation selected"
                description="Select any contact lead from sidebar layout to load WhatsApp business timeline logs."
              />
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
