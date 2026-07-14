import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { TaskRepository } from "@/lib/repositories/crm.repository";
import { Priority } from "@prisma/client";

import { maskLead } from "@/lib/utils/masking";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const role = (session.user as any).role || "SALES_EXECUTIVE";
    const tasks = await TaskRepository.findMany(
      (session.user as any).role === "SALES_EXECUTIVE" ? userId : undefined
    );

    const maskedTasks = tasks.map((t) => ({
      ...t,
      lead: t.lead ? maskLead(t.lead, role) : null,
    }));

    return NextResponse.json({ success: true, data: maskedTasks });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 401 });
    }

    const currentUserId = (session.user as any).id;
    const body = await request.json();
    const { title, description, priority, dueDate, assignedToId, leadId } = body;

    if (!title || !dueDate || !assignedToId) {
      return NextResponse.json(
        { success: false, error: "Title, dueDate, and assignedToId are required." },
        { status: 400 }
      );
    }

    const newTask = await TaskRepository.create({
      leadId: leadId || undefined,
      createdById: currentUserId,
      assignedToId,
      title,
      description: description || "",
      priority: (priority as Priority) || Priority.MEDIUM,
      dueDate: new Date(dueDate),
    });

    return NextResponse.json({ success: true, data: newTask }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 401 });
    }

    const body = await request.json();
    const { id, status, priority, title, description, dueDate, assignedToId } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Task ID is required." }, { status: 400 });
    }

    const updatedTask = await TaskRepository.update(id, {
      status,
      priority,
      title,
      description,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      assignedToId,
    });

    return NextResponse.json({ success: true, data: updatedTask });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
