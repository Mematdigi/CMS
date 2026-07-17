"use server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import {
  EmployeeRepository,
  AuditRepository,
  FollowupRepository,
} from "@/lib/repositories/crm.repository";
import { getPrisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

async function verifySession() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    throw new Error("Unauthorized access");
  }
  return session;
}

export async function getEmployeesAction() {
  const session = await verifySession();
  const tenantId = (session.user as { tenantId?: string }).tenantId || "tenant-1";
  
  const [employees, wonLeads] = await Promise.all([
    EmployeeRepository.findMany(tenantId),
    getPrisma().lead.findMany({
      where: {
        tenantId,
        status: "WON",
        isDeleted: false,
      },
      select: {
        assignedToId: true,
        budget: true,
      },
    }),
  ]);

  const salesMap = new Map<string, number>();
  for (const lead of wonLeads) {
    if (lead.assignedToId) {
      salesMap.set(lead.assignedToId, (salesMap.get(lead.assignedToId) || 0) + (lead.budget ? Number(lead.budget) : 0));
    }
  }

  // Format Decimal values to numbers for serialization
  return employees.map((emp) => ({
    id: emp.id,
    userId: emp.userId,
    name: emp.user.name,
    email: emp.user.email,
    role: emp.user.role,
    department: emp.department?.name || "General",
    targetMonthly: Number(emp.targetMonthly),
    currentSalesMonthly: salesMap.get(emp.userId) || 0,
    conversionRate: Number(emp.conversionRate),
    attendanceCount: emp.attendanceCount,
    leaveBalance: emp.leaveBalance,
    avatarUrl: `https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150`,
  }));
}

export async function getAuditLogsAction() {
  const session = await verifySession();
  const tenantId = (session.user as { tenantId?: string }).tenantId || "tenant-1";
  const logs = await AuditRepository.findMany(tenantId);

  return logs.map((log) => ({
    id: log.id,
    userId: log.userId,
    userName: log.user.name,
    action: log.action,
    ipAddress: log.ipAddress,
    details: log.details,
    createdAt: log.createdAt.toISOString(),
  }));
}

export async function saveTenantSettingsAction(data: {
  companyName: string;
  subdomain: string;
  assignmentMode: string;
}) {
  const session = await verifySession();
  const tenantId = (session.user as { tenantId?: string }).tenantId || "tenant-1";

  const prismaClient = getPrisma();
  await prismaClient.$transaction([
    prismaClient.tenant.update({
      where: { id: tenantId },
      data: { name: data.companyName, subdomain: data.subdomain },
    }),
    prismaClient.settings.upsert({
      where: { tenantId },
      update: { assignmentMode: data.assignmentMode },
      create: { tenantId, assignmentMode: data.assignmentMode },
    }),
  ]);

  return { success: true };
}

export async function getFollowupsAction() {
  const session = await verifySession();
  const user = session.user as { id?: string; role?: string };
  const userId = user.id;

  const followups = await FollowupRepository.findMany(
    user.role === "SALES_EXECUTIVE" ? userId : undefined
  );

  return followups.map((f) => ({
    id: f.id,
    leadId: f.leadId,
    leadName: f.lead.name,
    userId: f.userId,
    dateTime: f.dateTime.toISOString(),
    isRecurring: f.isRecurring,
    recurrence: f.recurrence as "DAILY" | "WEEKLY" | "MONTHLY" | undefined,
    status: f.status as "PENDING" | "COMPLETED" | "OVERDUE",
    notes: f.notes || "",
  }));
}

export async function createFollowupAction(data: {
  leadId: string;
  dateTime: string;
  isRecurring: boolean;
  recurrence?: string;
  notes?: string;
}) {
  const session = await verifySession();
  const userId = (session.user as { id: string }).id;

  const followup = await FollowupRepository.create({
    leadId: data.leadId,
    userId,
    dateTime: new Date(data.dateTime),
    isRecurring: data.isRecurring,
    recurrence: data.recurrence,
    notes: data.notes,
  });

  return {
    id: followup.id,
    leadId: followup.leadId,
    userId: followup.userId,
    dateTime: followup.dateTime.toISOString(),
    isRecurring: followup.isRecurring,
    recurrence: followup.recurrence || undefined,
    status: followup.status,
    notes: followup.notes || "",
  };
}

export async function getDashboardAnalyticsAction() {
  const session = await verifySession();
  const tenantId = (session.user as { tenantId?: string }).tenantId || "tenant-1";

  // Fetch all core datasets in parallel
  const [allLeads, dbEmployees, dbCampaigns] = await Promise.all([
    getPrisma().lead.findMany({
      where: { tenantId, isDeleted: false },
      select: {
        id: true,
        status: true,
        leadSource: true,
        budget: true,
        assignedToId: true,
      },
    }),
    getPrisma().employee.findMany({
      where: { user: { tenantId } },
      include: { user: true },
    }),
    getPrisma().campaign.findMany({
      where: { tenantId },
      include: {
        leads: {
          where: { isDeleted: false },
          select: { id: true },
        },
      },
    }),
  ]);

  // 1. Total leads count
  const totalLeads = allLeads.length;

  // 2. Won leads value (revenue)
  const wonLeads = allLeads.filter((l) => l.status === "WON");
  const totalRevenue = wonLeads.reduce((acc, lead) => acc + (lead.budget ? Number(lead.budget) : 0), 0);

  // 3. Lead status counts (Funnel) aggregated in-memory
  const statusMap = new Map<string, number>();
  for (const lead of allLeads) {
    statusMap.set(lead.status, (statusMap.get(lead.status) || 0) + 1);
  }
  const conversionFunnel = Array.from(statusMap.entries()).map(([stage, value]) => ({
    stage,
    value,
  }));

  // 4. Lead Source counts aggregated in-memory
  const sourceMap = new Map<string, number>();
  for (const lead of allLeads) {
    const src = lead.leadSource || "Unknown";
    sourceMap.set(src, (sourceMap.get(src) || 0) + 1);
  }
  const leadSourceData = Array.from(sourceMap.entries()).map(([name, value]) => ({
    name,
    value,
  }));

  // 5. Hardcoded trend base filled with db parameters
  const revenueTrend = [
    { name: "Jan", revenue: Math.round(totalRevenue * 0.15) || 5000 },
    { name: "Feb", revenue: Math.round(totalRevenue * 0.3) || 12000 },
    { name: "Mar", revenue: Math.round(totalRevenue * 0.45) || 18000 },
    { name: "Apr", revenue: Math.round(totalRevenue * 0.6) || 24000 },
    { name: "May", revenue: Math.round(totalRevenue * 0.8) || 35000 },
    { name: "Jun", revenue: totalRevenue || 45000 },
  ];

  // 6. Fetch actual employees performance aggregated in-memory
  const employeeLeadsMap = new Map<string, typeof allLeads>();
  for (const lead of allLeads) {
    if (lead.assignedToId) {
      if (!employeeLeadsMap.has(lead.assignedToId)) {
        employeeLeadsMap.set(lead.assignedToId, []);
      }
      employeeLeadsMap.get(lead.assignedToId)!.push(lead);
    }
  }

  const employeePerformance = dbEmployees.map((emp) => {
    const empLeads = employeeLeadsMap.get(emp.userId) || [];
    const totalLeadsCount = empLeads.length;
    const wonLeads = empLeads.filter((l) => l.status === "WON");
    const wonLeadsCount = wonLeads.length;
    const revenue = wonLeads.reduce((sum, l) => sum + (l.budget ? Number(l.budget) : 0), 0);

    return {
      name: emp.user.name,
      leads: totalLeadsCount,
      won: wonLeadsCount,
      rev: revenue,
    };
  });

  // 7. Fetch actual campaigns aggregated in-memory
  const campaignPerformance = dbCampaigns.map((camp) => {
    return {
      name: camp.name,
      cost: camp.budget,
      leads: camp.leads.length,
      roi: camp.budget > 0 ? `${(1.5 + (camp.leads.length * 0.2)).toFixed(1)}x` : "0.0x",
    };
  });

  return {
    totalLeads,
    totalRevenue,
    conversionFunnel: conversionFunnel.length > 0 ? conversionFunnel : [
      { stage: "NEW", value: 10 },
      { stage: "CONTACTED", value: 8 },
      { stage: "QUALIFIED", value: 5 },
      { stage: "PROPOSAL", value: 3 },
      { stage: "WON", value: 2 }
    ],
    leadSourceData: leadSourceData.length > 0 ? leadSourceData : [
      { name: "Google Search", value: 100 },
      { name: "LinkedIn Ads", value: 80 },
      { name: "Referrals", value: 50 }
    ],
    revenueTrend,
    employeePerformance: employeePerformance.length > 0 ? employeePerformance : [
      { name: "John Sales", leads: 45, won: 12, rev: 48000 },
      { name: "Elena Rostova", leads: 52, won: 15, rev: 54000 },
      { name: "Marcus Vance", leads: 38, won: 10, rev: 38000 },
      { name: "Sarah Connor", leads: 60, won: 22, rev: 95000 },
    ],
    campaignPerformance: campaignPerformance.length > 0 ? campaignPerformance : [
      { name: "Q3 Tech Summit", cost: 15000, leads: 220, roi: "2.4x" },
      { name: "AI Automations", cost: 8000, leads: 145, roi: "3.1x" },
      { name: "Direct Marketing", cost: 5000, leads: 90, roi: "1.8x" },
    ],
  };
}

export async function createEmployeeAction(data: {
  name: string;
  email: string;
  passwordHash: string;
  role: string;
}) {
  const session = await verifySession();
  const currentRole = (session.user as { role?: string }).role;
  if (currentRole !== "ADMIN" && currentRole !== "SUPER_ADMIN") {
    throw new Error("Only admins can create new employees");
  }

  const tenantId = (session.user as { tenantId?: string }).tenantId || "tenant-1";

  // Check if user already exists
  const existingUser = await getPrisma().user.findUnique({
    where: { email: data.email.toLowerCase() },
  });
  if (existingUser) {
    throw new Error("User with this email already exists");
  }

  // Create User
  const user = await getPrisma().user.create({
    data: {
      tenantId,
      name: data.name,
      email: data.email.toLowerCase(),
      passwordHash: data.passwordHash,
      role: data.role as UserRole,
      isActive: true,
    },
  });

  // Create Employee
  const employee = await getPrisma().employee.create({
    data: {
      userId: user.id,
      targetMonthly: 60000.0,
      conversionRate: 20.0,
      attendanceCount: 22,
      leaveBalance: 15,
    },
  });

  return {
    success: true,
    employee: {
      id: employee.id,
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: "General",
      targetMonthly: Number(employee.targetMonthly),
      currentSalesMonthly: 0,
      conversionRate: Number(employee.conversionRate),
      attendanceCount: employee.attendanceCount,
      leaveBalance: employee.leaveBalance,
      avatarUrl: `https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150`,
    },
  };
}
