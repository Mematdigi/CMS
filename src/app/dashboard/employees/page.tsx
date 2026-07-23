"use client";

import React, { useState, useEffect, useMemo } from "react";
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
import { UserCheck, Plus, Search, Trophy, Medal, Award, Users, TrendingUp, DollarSign } from "lucide-react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { Button, Card, Input, Select, Modal, PageHeader, EmptyState, StatCard } from "@/components/ui";

const RANK_STYLES = [
  { icon: Trophy, ring: "ring-amber-400/60", badge: "from-amber-400 to-amber-600", glow: "shadow-amber-500/30" },
  { icon: Medal, ring: "ring-slate-300/60", badge: "from-slate-300 to-slate-400", glow: "shadow-slate-400/20" },
  { icon: Award, ring: "ring-orange-400/60", badge: "from-orange-400 to-orange-600", glow: "shadow-orange-500/20" },
];

export default function EmployeesPage() {
  const { data: session } = useSession();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter / sort
  const [departmentFilter, setDepartmentFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState<"performance" | "revenue" | "conversion" | "name">("performance");

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

  const withProgress = useMemo(
    () =>
      employees.map((emp) => ({
        ...emp,
        progress: emp.targetMonthly > 0 ? Math.min((emp.currentSalesMonthly / emp.targetMonthly) * 100, 100) : 0,
      })),
    [employees]
  );

  const departments = useMemo(
    () => Array.from(new Set(employees.map((e) => e.department))).sort(),
    [employees]
  );

  const stats = useMemo(() => {
    const total = employees.length;
    const avgConversion = total ? employees.reduce((s, e) => s + e.conversionRate, 0) / total : 0;
    const totalRevenue = employees.reduce((s, e) => s + e.currentSalesMonthly, 0);
    const topPerformer = [...withProgress].sort((a, b) => b.progress - a.progress)[0];
    return { total, avgConversion, totalRevenue, topPerformer };
  }, [employees, withProgress]);

  const visibleEmployees = useMemo(() => {
    let list = withProgress;

    if (departmentFilter !== "ALL") {
      list = list.filter((e) => e.department === departmentFilter);
    }

    const sorted = [...list];
    switch (sortBy) {
      case "revenue":
        sorted.sort((a, b) => b.currentSalesMonthly - a.currentSalesMonthly);
        break;
      case "conversion":
        sorted.sort((a, b) => b.conversionRate - a.conversionRate);
        break;
      case "name":
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        sorted.sort((a, b) => b.progress - a.progress);
    }
    return sorted;
  }, [withProgress, departmentFilter, sortBy]);

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

      {employees.length > 0 && (
        <>
          {/* Stat summary row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="Total Team Members" value={stats.total} desc="Active workspace agents" icon={Users} tone="indigo" delay={0} />
            <StatCard
              title="Avg. Conversion Rate"
              value={`${stats.avgConversion.toFixed(1)}%`}
              desc="Across all agents this month"
              icon={TrendingUp}
              tone="emerald"
              delay={0.05}
            />
            <StatCard
              title="Total Monthly Sales"
              value={`$${stats.totalRevenue.toLocaleString()}`}
              desc="Combined current sales"
              icon={DollarSign}
              tone="violet"
              delay={0.1}
            />
            <StatCard
              title="Top Performer"
              value={stats.topPerformer?.name ?? "—"}
              desc={stats.topPerformer ? `${stats.topPerformer.progress.toFixed(0)}% of target reached` : "No data yet"}
              icon={Trophy}
              tone="amber"
              delay={0.15}
            />
          </div>

          {/* Filter toolbar */}
          <Card className="flex flex-col sm:flex-row justify-end items-center gap-3 p-4">
            <Select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="w-full sm:w-44"
            >
              <option value="ALL">All Departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </Select>
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="w-full sm:w-48"
            >
              <option value="performance">Sort: Target Progress</option>
              <option value="revenue">Sort: Highest Sales</option>
              <option value="conversion">Sort: Conversion Rate</option>
              <option value="name">Sort: Name (A-Z)</option>
            </Select>
          </Card>
        </>
      )}

      {/* Grid listing */}
      {employees.length === 0 ? (
        <Card className="p-12 max-w-lg mx-auto">
          <EmptyState
            icon={UserCheck}
            title="No employees registered yet"
            description={'There are no employee target profiles in this tenant. Click the "Add Agent / Admin" button at the top right to register your first workspace member.'}
          />
        </Card>
      ) : visibleEmployees.length === 0 ? (
        <Card className="p-12 max-w-lg mx-auto">
          <EmptyState
            icon={Search}
            title="No matching employees"
            description="Try selecting a different department filter to find the agent you're looking for."
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {visibleEmployees.map((emp, i) => {
            const rankStyle = sortBy === "performance" && i < 3 ? RANK_STYLES[i] : null;
            const RankIcon = rankStyle?.icon;
            return (
              <Card
                key={emp.id}
                delay={i * 0.06}
                hoverLift
                glow
                className={`relative p-6 space-y-6 ${rankStyle ? `shadow-lg ${rankStyle.glow}` : ""}`}
              >
                {rankStyle && RankIcon && (
                  <div
                    className={`absolute -top-3 -left-3 w-9 h-9 rounded-full bg-gradient-to-br ${rankStyle.badge} flex items-center justify-center shadow-md ring-4 ring-background`}
                  >
                    <RankIcon className="w-4 h-4 text-white" strokeWidth={2.5} />
                  </div>
                )}

                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={emp.avatarUrl}
                    alt={emp.name}
                    className={`w-12 h-12 rounded-full border border-border object-cover ${
                      rankStyle ? `ring-2 ${rankStyle.ring} ring-offset-2 ring-offset-card` : ""
                    }`}
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
                        animate={{ width: `${emp.progress}%` }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                        className={`h-full rounded-full ${
                          emp.progress >= 100
                            ? "bg-emerald-500"
                            : emp.progress >= 60
                            ? "bg-indigo-600"
                            : "bg-amber-500"
                        }`}
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
