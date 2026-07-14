"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, CheckSquare, Clock, AlertCircle, MessageSquare, Paperclip, CheckCircle, User } from "lucide-react";
// Define client interfaces matching the database models
export interface Task {
  id: string;
  leadId?: string | null;
  leadName?: string;
  title: string;
  description?: string | null;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "TODO" | "IN_PROGRESS" | "DONE";
  dueDate: string;
  assignedToId: string;
  lead?: {
    id: string;
    name: string;
    company?: string | null;
  } | null;
}

export interface Lead {
  id: string;
  name: string;
  company?: string | null;
}

import { getEmployeesAction } from "@/lib/actions/crm.actions";

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  
  // New task form states
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Task["priority"]>("MEDIUM");
  const [dueDate, setDueDate] = useState("");
  const [selectedLeadId, setSelectedLeadId] = useState("");
  const [assignedToId, setAssignedToId] = useState("");

  // Comments / active task drawer
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [taskComments, setTaskComments] = useState<{ id: string; user: string; text: string; date: string }[]>([]);
  const [newComment, setNewComment] = useState("");

  const loadData = () => {
    fetch("/api/tasks")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          const mapped = json.data.map((t: any) => ({
            ...t,
            leadName: t.lead?.name || undefined,
          }));
          setTasks(mapped);
        }
      })
      .catch(() => {});

    fetch("/api/leads?limit=1000")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setLeads(json.data);
      })
      .catch(() => {});

    getEmployeesAction().then(setEmployees).catch(() => {});
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !dueDate || !assignedToId) return;

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: selectedLeadId || undefined,
          title,
          description,
          priority,
          dueDate: new Date(dueDate).toISOString(),
          assignedToId,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setShowAddModal(false);
        setTitle("");
        setDescription("");
        setPriority("MEDIUM");
        setDueDate("");
        setSelectedLeadId("");
        setAssignedToId("");
        loadData();
      }
    } catch (err) {}
  };

  const handleUpdateStatus = async (taskId: string, newStatus: Task["status"]) => {
    try {
      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: taskId, status: newStatus }),
      });
      const json = await res.json();
      if (json.success) {
        loadData();
        if (activeTask && activeTask.id === taskId) {
          setActiveTask((prev) => (prev ? { ...prev, status: newStatus } : null));
        }
      }
    } catch (err) {}
  };

  const handleAddComment = () => {
    if (!newComment.trim() || !activeTask) return;
    const comment = {
      id: `comm-${Date.now()}`,
      user: "Sarah Connor (Admin)",
      text: newComment,
      date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setTaskComments([...taskComments, comment]);
    setNewComment("");
  };

  // Retrieve comment logs on task select
  const selectTask = (task: Task) => {
    setActiveTask(task);
    setTaskComments([
      { id: "c-1", user: "John Sales", text: "I have started drafting the customized contract layout details.", date: "09:00 AM" },
      { id: "c-2", user: "Sarah Connor (Admin)", text: "Confirm standard SLA items are fully attached.", date: "10:15 AM" }
    ]);
  };

  const columns: Task["status"][] = ["TODO", "IN_PROGRESS", "DONE"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Tasks Board</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Delegate workspace tasks, coordinate deadlines, and verify logs outputs.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition-all shadow-md"
        >
          <Plus className="w-4 h-4" /> Create Task
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Kanban Task Columns */}
        <div className="xl:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
          {columns.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col);
            return (
              <div
                key={col}
                className="bg-card/45 border border-border rounded-2xl p-4 flex flex-col gap-3 min-h-[500px]"
              >
                <div className="flex justify-between items-center border-b border-border pb-2">
                  <span className="font-bold text-xs text-muted-foreground uppercase tracking-wider">
                    {col === "TODO" ? "To Do" : col === "IN_PROGRESS" ? "In Progress" : "Completed"}
                  </span>
                  <span className="bg-indigo-500/10 text-indigo-500 font-bold px-2 py-0.5 rounded-full text-[10px]">
                    {colTasks.length}
                  </span>
                </div>

                <div className="flex-1 flex flex-col gap-3 overflow-y-auto max-h-[600px] scrollbar-none">
                  {colTasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => selectTask(task)}
                      className={`bg-card border border-border p-4 rounded-xl shadow-xs cursor-pointer hover:shadow-md transition-all space-y-3 ${
                        activeTask?.id === task.id ? "ring-2 ring-indigo-500" : ""
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          task.priority === "CRITICAL"
                            ? "bg-red-500/10 text-red-500"
                            : task.priority === "HIGH"
                            ? "bg-amber-500/10 text-amber-500"
                            : "bg-indigo-500/10 text-indigo-500"
                        }`}>
                          {task.priority}
                        </span>
                        {task.dueDate && (
                          <span className="text-[9px] text-muted-foreground font-semibold flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-xs text-foreground leading-relaxed">{task.title}</div>
                        {task.leadName && (
                          <div className="text-[10px] text-indigo-400 font-bold mt-1">Lead: {task.leadName}</div>
                        )}
                      </div>
                      <div className="flex justify-between items-center border-t border-border/60 pt-2 text-[10px] text-slate-500">
                        <span className="flex items-center gap-1 font-semibold">
                          <User className="w-3.5 h-3.5 text-indigo-400" />
                          {(() => {
                            const emp = employees.find((e) => e.userId === task.assignedToId || e.id === task.assignedToId);
                            return emp ? emp.name : "Unassigned";
                          })()}
                        </span>
                        <div className="flex gap-1.5">
                          {col !== "DONE" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdateStatus(task.id, col === "TODO" ? "IN_PROGRESS" : "DONE");
                              }}
                              className="px-2 py-0.5 bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500 hover:text-white rounded transition-all font-bold text-[9px]"
                            >
                              Move »
                            </button>
                          )}
                          {col === "DONE" && (
                            <CheckCircle className="w-4 h-4 text-emerald-500" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Task details & Comments panel drawer */}
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-6 flex flex-col h-[550px]">
          {activeTask ? (
            <div className="flex-1 flex flex-col min-h-0 space-y-4">
              <div className="border-b border-border pb-3">
                <span className="text-2xs font-bold text-slate-400 uppercase tracking-wider">Active Workspace Task</span>
                <h3 className="font-bold text-sm text-foreground mt-1 leading-snug">{activeTask.title}</h3>
                <div className="flex items-center gap-1.5 mt-2 bg-secondary/40 border border-border/60 rounded-lg px-2 py-1 block w-max text-[10px] font-semibold text-slate-500">
                  <User className="w-3 h-3 text-indigo-400" />
                  <span>Assigned: {(() => {
                    const emp = employees.find((e) => e.userId === activeTask.assignedToId || e.id === activeTask.assignedToId);
                    return emp ? `${emp.name} (${emp.role})` : "Unassigned";
                  })()}</span>
                </div>
                <p className="text-xs text-slate-500 mt-3 font-medium">{activeTask.description || "No description provided."}</p>
              </div>

              {/* Status workflow */}
              <div className="flex gap-1.5 items-center justify-between">
                <span className="text-xs text-muted-foreground font-bold">Status Action:</span>
                <select
                  value={activeTask.status}
                  onChange={(e) => handleUpdateStatus(activeTask.id, e.target.value as Task["status"])}
                  className="bg-secondary border border-border text-xs rounded-xl p-1.5 font-semibold outline-none text-indigo-500"
                >
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="DONE">Completed</option>
                </select>
              </div>

              {/* Comments Scrollable log */}
              <div className="flex-1 flex flex-col min-h-0 space-y-3 pt-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Comments Feed</span>
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {taskComments.map((comm) => (
                    <div key={comm.id} className="p-2.5 bg-secondary/30 border border-border/80 rounded-xl text-xs space-y-1">
                      <div className="flex justify-between items-center font-bold text-[10px]">
                        <span className="text-indigo-400">{comm.user}</span>
                        <span className="text-slate-500 font-normal">{comm.date}</span>
                      </div>
                      <p className="text-muted-foreground leading-relaxed">{comm.text}</p>
                    </div>
                  ))}
                </div>

                {/* Comment writing form */}
                <div className="flex gap-2 border-t border-border pt-3">
                  <input
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a reply..."
                    className="flex-1 px-3 py-1.5 bg-secondary border border-border rounded-xl text-xs outline-none"
                    onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                  />
                  <button
                    onClick={handleAddComment}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition-all shadow-md"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground text-xs gap-3">
              <CheckSquare className="w-12 h-12 text-slate-400" />
              <span>Select any workspace task card to configure timelines, logs, and comments feed.</span>
            </div>
          )}
        </div>
      </div>

      {/* Create Task Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl p-6"
            >
              <h2 className="text-xl font-bold mb-4 border-b border-border pb-3">Create Workspace Task</h2>

              <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-400 uppercase mb-1.5">Task Title / Operation Name</label>
                  <input
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Review SLA contract terms..."
                    className="w-full p-2.5 bg-secondary border border-border rounded-xl outline-none text-foreground text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-400 uppercase mb-1.5">Detailed Task Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Read SLA and align discount specifications..."
                    className="w-full p-3 bg-secondary border border-border rounded-xl outline-none focus:border-indigo-500 min-h-20 resize-none text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-400 uppercase mb-1.5">Deadline Due Date</label>
                  <input
                    required
                    type="datetime-local"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full p-2.5 bg-secondary border border-border rounded-xl outline-none text-foreground text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-400 uppercase mb-1.5">Priority Classification</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full p-2.5 bg-secondary border border-border rounded-xl outline-none font-semibold text-indigo-500 text-xs"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-400 uppercase mb-1.5">Link opportunity contact (optional)</label>
                  <select
                    value={selectedLeadId}
                    onChange={(e) => setSelectedLeadId(e.target.value)}
                    className="w-full p-2.5 bg-secondary border border-border rounded-xl outline-none font-medium text-foreground text-xs"
                  >
                    <option value="">No Opportunity</option>
                    {leads.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name} ({l.company})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-400 uppercase mb-1.5">Assign to Agent / Representative</label>
                  <select
                    required
                    value={assignedToId}
                    onChange={(e) => setAssignedToId(e.target.value)}
                    className="w-full p-2.5 bg-secondary border border-border rounded-xl outline-none font-semibold text-indigo-500 text-xs"
                  >
                    <option value="">Select Agent</option>
                    {employees.map((emp) => (
                      <option key={emp.userId} value={emp.userId}>
                        {emp.name} ({emp.role})
                      </option>
                    ))}
                  </select>
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
                    Delegate Task
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
