"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, CheckSquare, Clock, CheckCircle, User } from "lucide-react";
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

interface Employee {
  id: string;
  userId: string;
  name: string;
  role: string;
}

export interface Lead {
  id: string;
  name: string;
  company?: string | null;
}

import { getEmployeesAction } from "@/lib/actions/crm.actions";
import { Button, Card, Badge, Input, Select, Textarea, Modal, PageHeader } from "@/components/ui";

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  
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
          const mapped = json.data.map((t: Task) => ({
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
    } catch {}
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
    } catch {}
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
      <PageHeader
        title="Tasks Board"
        description="Delegate workspace tasks, coordinate deadlines, and verify logs outputs."
        border
        actions={
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4" /> Create Task
          </Button>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Kanban Task Columns */}
        <div className="xl:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
          {columns.map((col, colIdx) => {
            const colTasks = tasks.filter((t) => t.status === col);
            return (
              <motion.div
                key={col}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: colIdx * 0.06 }}
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
                  {colTasks.map((task, rowIdx) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: colIdx * 0.06 + rowIdx * 0.04 }}
                      whileHover={{ y: -3 }}
                      onClick={() => selectTask(task)}
                      className={`bg-card border border-border p-4 rounded-xl shadow-xs cursor-pointer hover:shadow-md transition-shadow space-y-3 ${
                        activeTask?.id === task.id ? "ring-2 ring-indigo-500" : ""
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <Badge tone={task.priority === "CRITICAL" ? "red" : task.priority === "HIGH" ? "amber" : "indigo"} className="text-[9px]">
                          {task.priority}
                        </Badge>
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
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Task details & Comments panel drawer */}
        <Card delay={0.2} className="p-6 space-y-6 flex flex-col h-[550px]">
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
                <Select
                  value={activeTask.status}
                  onChange={(e) => handleUpdateStatus(activeTask.id, e.target.value as Task["status"])}
                  className="w-auto p-1.5 font-semibold text-indigo-500"
                >
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="DONE">Completed</option>
                </Select>
              </div>

              {/* Comments Scrollable log */}
              <div className="flex-1 flex flex-col min-h-0 space-y-3 pt-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Comments Feed</span>
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {taskComments.map((comm, idx) => (
                    <motion.div
                      key={comm.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="p-2.5 bg-secondary/30 border border-border/80 rounded-xl text-xs space-y-1"
                    >
                      <div className="flex justify-between items-center font-bold text-[10px]">
                        <span className="text-indigo-400">{comm.user}</span>
                        <span className="text-slate-500 font-normal">{comm.date}</span>
                      </div>
                      <p className="text-muted-foreground leading-relaxed">{comm.text}</p>
                    </motion.div>
                  ))}
                </div>

                {/* Comment writing form */}
                <div className="flex gap-2 border-t border-border pt-3">
                  <Input
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a reply..."
                    className="flex-1 px-3 py-1.5"
                    onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                  />
                  <Button size="sm" onClick={handleAddComment}>
                    Send
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground text-xs gap-3">
              <CheckSquare className="w-12 h-12 text-slate-400" />
              <span>Select any workspace task card to configure timelines, logs, and comments feed.</span>
            </div>
          )}
        </Card>
      </div>

      {/* Create Task Modal */}
      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="Create Workspace Task" maxWidth="max-w-md">
        <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-400 uppercase mb-1.5">Task Title / Operation Name</label>
            <Input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Review SLA contract terms..."
              className="p-2.5"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-400 uppercase mb-1.5">Detailed Task Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Read SLA and align discount specifications..."
              className="p-3 min-h-20 resize-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-400 uppercase mb-1.5">Deadline Due Date</label>
            <Input
              required
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="p-2.5"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-400 uppercase mb-1.5">Priority Classification</label>
            <Select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Task["priority"])}
              className="p-2.5 font-semibold text-indigo-500"
            >
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
              <option value="CRITICAL">CRITICAL</option>
            </Select>
          </div>

          <div>
            <label className="block font-bold text-slate-400 uppercase mb-1.5">Link opportunity contact (optional)</label>
            <Select
              value={selectedLeadId}
              onChange={(e) => setSelectedLeadId(e.target.value)}
              className="p-2.5 font-medium"
            >
              <option value="">No Opportunity</option>
              {leads.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} ({l.company})
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block font-bold text-slate-400 uppercase mb-1.5">Assign to Agent / Representative</label>
            <Select
              required
              value={assignedToId}
              onChange={(e) => setAssignedToId(e.target.value)}
              className="p-2.5 font-semibold text-indigo-500"
            >
              <option value="">Select Agent</option>
              {employees.map((emp) => (
                <option key={emp.userId} value={emp.userId}>
                  {emp.name} ({emp.role})
                </option>
              ))}
            </Select>
          </div>

          <div className="flex justify-end gap-2 border-t border-border pt-4 mt-4">
            <Button type="button" variant="secondary" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button type="submit">Delegate Task</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
