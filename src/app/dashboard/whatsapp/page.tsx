"use client";

import React, { useState, useEffect, useRef } from "react";
import { Lead, WhatsappMessage } from "@prisma/client";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Search, CheckCheck, Paperclip, Smile, Mic, AlertCircle, FileText, Image as ImageIcon, Check, MessageSquare } from "lucide-react";

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

  const loadLeads = () => {
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
  };

  const loadMessages = () => {
    if (!selectedLead) return;
    fetch(`/api/whatsapp?leadId=${selectedLead.id}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setMessages(json.data);
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadLeads();
  }, []);

  useEffect(() => {
    loadMessages();
  }, [selectedLead]);

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
  }, [selectedLead]);

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
    } catch (err) {}
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
    } catch (err) {}
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
    } catch (err) {}
  };

  const filteredLeads = leads.filter((l) =>
    l.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-border pb-4">
        <h1 className="text-3xl font-extrabold tracking-tight font-sans">Meta WhatsApp Workspace</h1>
        <p className="text-muted-foreground text-sm mt-1">
          WhatsApp Business API templates management and customer conversations timeline.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 bg-card border border-border rounded-2xl shadow-sm overflow-hidden h-[600px]">
        {/* Left Column - Chats list */}
        <div className="border-r border-border flex flex-col h-full bg-secondary/10">
          <div className="p-4 border-b border-border bg-card">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-secondary border border-border focus:border-indigo-500 rounded-xl text-xs outline-none transition-all"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-border/60">
            {filteredLeads.map((lead) => {
              const isActive = selectedLead?.id === lead.id;
              return (
                <div
                  key={lead.id}
                  onClick={() => setSelectedLead(lead)}
                  className={`p-4 flex items-center gap-3 cursor-pointer transition-all ${
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
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column - Chat Window */}
        <div className="md:col-span-2 flex flex-col h-full bg-slate-900/5 dark:bg-transparent">
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
                  <button
                    onClick={handleSendSamplePdf}
                    className="p-2 hover:bg-secondary rounded-xl text-muted-foreground hover:text-indigo-500 transition-all border border-border bg-card"
                    title="Send proposal PDF copy"
                  >
                    <FileText className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleSendSampleImage}
                    className="p-2 hover:bg-secondary rounded-xl text-muted-foreground hover:text-indigo-500 transition-all border border-border bg-card"
                    title="Send spec screenshot image"
                  >
                    <ImageIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Chat Area bubble list */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-950/20">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3 text-xs">
                    <AlertCircle className="w-10 h-10 text-slate-500" />
                    <span>No WhatsApp messages logged for this contact. Use templates dropdown to send first message.</span>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isOut = msg.direction === "OUTBOUND";
                    return (
                      <div
                        key={msg.id}
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
                      </div>
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
                  <button
                    onClick={() => setShowTemplates(!showTemplates)}
                    className="px-3 py-2 bg-secondary hover:bg-indigo-600/10 text-indigo-500 font-bold text-xs rounded-xl border border-border hover:border-indigo-500/20 transition-all whitespace-nowrap"
                  >
                    Use Template
                  </button>
                  <input
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Type WhatsApp chat message..."
                    className="flex-1 px-4 py-2 bg-secondary border border-border focus:border-indigo-500 rounded-xl text-xs outline-none"
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  />
                  <button
                    onClick={() => handleSendMessage()}
                    className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md transition-all shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground text-xs gap-3">
              <MessageSquare className="w-12 h-12 text-slate-400" />
              <span>Select any contact lead from sidebar layout to load WhatsApp business timeline logs.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
