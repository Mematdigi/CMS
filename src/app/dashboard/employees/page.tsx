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
import { UserCheck, Plus } from "lucide-react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { Button, Card, Input, Select, Modal, PageHeader, EmptyState } from "@/components/ui";

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
      <PageHeader
        title="Employee Performance"
        description="Coordinate department targets, track monthly sales progress, leave balances, and logs."
        border
        actions={
          isAdmin ? (
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="w-4 h-4" /> Add Agent / Admin
            </Button>
          ) : undefined
        }
      />

      {/* Grid listing */}
      {employees.length === 0 ? (
        <Card className="p-12 max-w-lg mx-auto">
          <EmptyState
            icon={UserCheck}
            title="No employees registered yet"
            description={'There are no employee target profiles in this tenant. Click the "Add Agent / Admin" button at the top right to register your first workspace member.'}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {employees.map((emp, i) => {
            const targetProgress = Math.min((emp.currentSalesMonthly / emp.targetMonthly) * 100, 100);
            return (
              <Card key={emp.id} delay={i * 0.06} hoverLift glow className="p-6 space-y-6">
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
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${targetProgress}%` }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                        className="bg-indigo-600 h-full rounded-full"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center pt-2">
                    <div className="p-2 bg-secondary/30 rounded-xl">
                      <span className="block font-bold text-indigo-500 text-sm">{emp.conversionRate}%</span>
                      <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">Conversion</span>
                    </div>
                    <div className="p-2 bg-secondary/30 rounded-xl">
                      <span className="block font-bold text-indigo-500 text-sm">{emp.attendanceCount}/22</span>
                      <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">Attendance</span>
                    </div>
                    <div className="p-2 bg-secondary/30 rounded-xl">
                      <span className="block font-bold text-indigo-500 text-sm">{emp.leaveBalance} Days</span>
                      <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">Leave Balance</span>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Employee Modal */}
      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} maxWidth="max-w-md">
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
            <Input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="E.g., Johnathan Doe"
              className="px-3.5 py-2"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@enterprise.com"
              className="px-3.5 py-2"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Password</label>
            <Input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="px-3.5 py-2"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">System Role</label>
            <Select value={role} onChange={(e) => setRole(e.target.value)} className="px-3 py-2">
              <option value="SALES_EXECUTIVE">Sales Executive (Agent)</option>
              <option value="TEAM_LEADER">Team Leader</option>
              <option value="MANAGER">Manager</option>
              <option value="ADMIN">System Administrator</option>
            </Select>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowAddModal(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" loading={loading} className="flex-1">
              {loading ? "Registering..." : "Create Account"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
