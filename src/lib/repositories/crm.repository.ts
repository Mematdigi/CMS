import { getPrisma } from "@/lib/prisma";
import { LeadStatus, Priority, Prisma } from "@prisma/client";

// LEADS REPOS
export class LeadRepository {
  static async findMany(params: {
    search?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    page?: number;
    limit?: number;
    tenantId: string;
    assignedToId?: string;
  }) {
    const {
      search = "",
      status = "",
      sortBy = "createdAt",
      sortOrder = "desc",
      page = 1,
      limit = 50,
      tenantId,
      assignedToId,
    } = params;

    const skip = (page - 1) * limit;

    // Build Prisma query filters
    const whereClause: Prisma.LeadWhereInput = {
      tenantId,
      isDeleted: false,
    };

    if (assignedToId) {
      whereClause.assignedToId = assignedToId;
    }

    if (status && status !== "ALL") {
      whereClause.status = status as LeadStatus;
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { company: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
      ];
    }

    // Run parallel count and fetch via Prisma transaction
    const [data, totalCount] = await getPrisma().$transaction([
      getPrisma().lead.findMany({
        where: whereClause,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
        include: {
          product: true,
          campaign: true,
          assignedTo: true,
        },
      }),
      getPrisma().lead.count({ where: whereClause }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return { data, totalCount, totalPages, page, limit };
  }

  static async findById(id: string) {
    return getPrisma().lead.findUnique({
      where: { id },
      include: {
        product: true,
        campaign: true,
        assignedTo: true,
        customFields: {
          include: { customField: true },
        },
      },
    });
  }

  static async create(data: {
    tenantId: string;
    workspaceId: string;
    name: string;
    phone: string;
    altPhone?: string;
    email: string;
    company?: string;
    industry?: string;
    productId?: string;
    budget?: number;
    leadSource?: string;
    campaignId?: string;
    status?: LeadStatus;
    priority?: Priority;
    createdById: string;
    assignedToId?: string;
    state?: string;
    city?: string;
    country?: string;
    language?: string;
    notes?: string;
  }) {
    return getPrisma().lead.create({
      data: {
        ...data,
        budget: data.budget ? Number(data.budget) : undefined,
        status: data.status || LeadStatus.NEW,
        priority: data.priority || Priority.MEDIUM,
      },
    });
  }

  static async update(id: string, data: Prisma.LeadUncheckedUpdateInput) {
    return getPrisma().lead.update({
      where: { id },
      data: {
        ...data,
        budget: data.budget !== undefined ? Number(data.budget) : undefined,
      },
      include: {
        product: true,
        campaign: true,
        assignedTo: true,
      },
    });
  }

  static async delete(id: string) {
    // Soft delete implementation
    return getPrisma().lead.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });
  }
}

// TASKS REPOS
export class TaskRepository {
  static async findMany(assignedToId?: string) {
    return getPrisma().task.findMany({
      where: assignedToId ? { assignedToId } : {},
      orderBy: { dueDate: "asc" },
      include: { lead: true },
    });
  }

  static async create(data: {
    leadId?: string;
    createdById: string;
    assignedToId: string;
    title: string;
    description?: string;
    priority?: Priority;
    dueDate: Date;
  }) {
    return getPrisma().task.create({
      data: {
        ...data,
        status: "TODO",
        priority: data.priority || Priority.MEDIUM,
      },
    });
  }

  static async update(id: string, data: Prisma.TaskUncheckedUpdateInput) {
    return getPrisma().task.update({
      where: { id },
      data,
    });
  }
}

// FOLLOWUPS REPOS
export class FollowupRepository {
  static async findMany(userId?: string) {
    return getPrisma().followup.findMany({
      where: userId ? { userId } : {},
      orderBy: { dateTime: "asc" },
      include: { lead: true },
    });
  }

  static async create(data: {
    leadId: string;
    userId: string;
    dateTime: Date;
    isRecurring?: boolean;
    recurrence?: string;
    notes?: string;
  }) {
    return getPrisma().followup.create({
      data: {
        ...data,
        status: "PENDING",
      },
    });
  }

  static async update(id: string, data: Prisma.FollowupUncheckedUpdateInput) {
    return getPrisma().followup.update({
      where: { id },
      data,
    });
  }
}

// CALL LOGS REPOS
export class CallRepository {
  static async findMany(userId?: string) {
    return getPrisma().callLog.findMany({
      where: userId ? { userId } : {},
      orderBy: { createdAt: "desc" },
      include: {
        lead: true,
      },
    });
  }

  static async create(data: {
    leadId: string;
    userId: string;
    durationSec: number;
    callType: string;
    recordingUrl?: string;
    notes?: string;
  }) {
    return getPrisma().callLog.create({
      data,
      include: {
        lead: true,
      },
    });
  }
}

// WHATSAPP REPOS
export class WhatsappRepository {
  static async findMany(leadId: string) {
    return getPrisma().whatsappMessage.findMany({
      where: { leadId },
      orderBy: { createdAt: "asc" },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    });
  }

  static async create(data: {
    leadId: string;
    userId: string;
    messageBody: string;
    mediaUrl?: string;
    direction: "INBOUND" | "OUTBOUND";
    status?: string;
    templateName?: string;
    phone?: string;
    from?: string;
    to?: string;
    twilioSid?: string;
    error?: string;
  }) {
    return getPrisma().whatsappMessage.create({
      data: {
        ...data,
        status: data.status || "SENT",
      },
    });
  }

  static async updateStatusBySid(twilioSid: string, status: string, error?: string) {
    return getPrisma().whatsappMessage.updateMany({
      where: { twilioSid },
      data: {
        status,
        error: error || undefined,
      },
    });
  }
}

// EMPLOYEES REPOS
export class EmployeeRepository {
  static async findMany(tenantId: string) {
    return getPrisma().employee.findMany({
      where: {
        user: { tenantId },
      },
      include: {
        user: true,
        department: true,
      },
    });
  }

  static async findById(id: string) {
    return getPrisma().employee.findUnique({
      where: { id },
      include: { user: true },
    });
  }

  static async update(id: string, data: Prisma.EmployeeUncheckedUpdateInput) {
    return getPrisma().employee.update({
      where: { id },
      data,
    });
  }
}

// AUDITS REPOS
export class AuditRepository {
  static async findMany(tenantId: string) {
    return getPrisma().auditLog.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      include: { user: true },
    });
  }

  static async create(data: {
    tenantId: string;
    userId: string;
    action: string;
    ipAddress: string;
    details: string;
  }) {
    return getPrisma().auditLog.create({
      data,
    });
  }
}
