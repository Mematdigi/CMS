"use client";

import React, { useState, useEffect } from "react";
export interface Employee {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  department: string;
  targetMonthly: number;
  currentSalesMonthly: number;
  conversionRate: number;
  attendanceCount: number;
  leaveBalance: number;
  avatarUrl: string;
}
import { getEmployeesAction, createEmployeeAction } from "@/lib/actions/crm.actions";
import { UserCheck, Plus, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";

export default function EmployeesPage() {
  const { data: session } = useSession();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("SALES_EXECUTIVE");

  const loadEmployees = () => {
    getEmployeesAction()
      .then(setEmployees)
      .catch(() => {});
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const isAdmin =
    session?.user &&
    ((session.user as { role: string }).role === "ADMIN" || (session.user as { role: string }).role === "SUPER_ADMIN");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError("Please fill out all fields.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await createEmployeeAction({
        name,
        email,
        passwordHash: password,
        role,
      });

      if (res.success) {
        setShowAddModal(false);
        setName("");
        setEmail("");
        setPassword("");
        setRole("SALES_EXECUTIVE");
        loadEmployees();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-border pb-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Employee Performance</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Coordinate department targets, track monthly sales progress, leave balances, and logs.
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition-all shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Agent / Admin
          </button>
        )}
      </div>

      {/* Grid listing */}
      {employees.length === 0 ? (
        <div className="bg-card border border-border p-12 rounded-2xl text-center space-y-4 max-w-lg mx-auto shadow-sm">
          <UserCheck className="w-12 h-12 text-indigo-500 mx-auto opacity-75 animate-pulse" />
          <div className="space-y-1.5">
            <h3 className="text-sm font-bold text-foreground">No employees registered yet</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              There are no employee target profiles in this tenant. Click the &quot;Add Agent / Admin&quot; button at the top right to register your first workspace member.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {employees.map((emp) => {
            const targetProgress = Math.min((emp.currentSalesMonthly / emp.targetMonthly) * 100, 100);
            return (
              <div
                key={emp.id}
                className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-6 hover-lift"
              >
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={emp.avatarUrl}
                    alt={emp.name}
                    className="w-12 h-12 rounded-full border border-border object-cover"
                  />
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm text-foreground truncate">{emp.name}</h3>
                    <span className="text-[10px] bg-indigo-500/10 text-indigo-400 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider block w-max mt-1">
                      {emp.role} • {emp.department}
                    </span>
                  </div>
                </div>

                {/* Progress metrics */}
                <div className="space-y-3 border-t border-border pt-4 text-xs">
                  <div className="space-y-1.5">
                    <div className="flex justify-between font-semibold text-slate-500">
                      <span>Monthly Sales Target</span>
                      <span className="text-foreground">
                        ${emp.currentSalesMonthly.toLocaleString()} / ${emp.targetMonthly.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full bg-secondary h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-550 h-full rounded-full transition-all duration-500"
                        style={{ width: `${targetProgress}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center pt-2">
                    <div className="p-2 bg-secondary/30 rounded-xl">
                      <span className="block font-bold text-indigo-500 text-sm">{emp.conversionRate}%</span>
                      <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">Conversion</span>
                    </div>
                    <div className="p-2 bg-secondary/30 rounded-xl">
                      <span className="block font-bold text-indigo-550 text-sm">{emp.attendanceCount}/22</span>
                      <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">Attendance</span>
                    </div>
                    <div className="p-2 bg-secondary/30 rounded-xl">
                      <span className="block font-bold text-indigo-550 text-sm">{emp.leaveBalance} Days</span>
                      <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">Leave Balance</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Employee Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border w-full max-w-md rounded-2xl shadow-2xl p-6 relative overflow-hidden"
            >
              <button
                onClick={() => setShowAddModal(false)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-secondary transition-all"
              >
                <X className="w-4.5 h-4.5" />
              </button>

              <h2 className="text-lg font-bold text-foreground mb-1">Create User Credentials</h2>
              <p className="text-xs text-muted-foreground mb-4">
                Register a new workspace agent or administrator to manage incoming leads and tasks.
              </p>

              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/25 text-rose-500 text-xs rounded-xl mb-4 font-medium">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="E.g., Johnathan Doe"
                    className="w-full bg-secondary border border-border focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs outline-none transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@enterprise.com"
                    className="w-full bg-secondary border border-border focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs outline-none transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-secondary border border-border focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs outline-none transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">System Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-secondary border border-border focus:border-indigo-500 rounded-xl px-3 py-2 text-xs outline-none transition-all text-foreground"
                  >
                    <option value="SALES_EXECUTIVE">Sales Executive (Agent)</option>
                    <option value="TEAM_LEADER">Team Leader</option>
                    <option value="MANAGER">Manager</option>
                    <option value="ADMIN">System Administrator</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-2.5 bg-secondary hover:bg-secondary/80 border border-border text-foreground text-xs font-semibold rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-all shadow-md flex items-center justify-center"
                  >
                    {loading ? "Registering..." : "Create Account"}
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
