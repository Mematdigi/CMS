import { Worker, Job } from "bullmq";
import { metaWhatsappClient } from "../providers/whatsapp/meta.provider";
import { getPrisma } from "../prisma";
import { evaluateSmartAssignment } from "../smart-assignment";

const connection = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
};

// 1. Email worker
export const emailWorker = new Worker(
  "email-queue",
  async (job: Job) => {
    const { to, subject, body } = job.data;
    console.log(`[Worker: Email] Dispatching email to ${to}...`);
    console.log(`[Worker: Email] Sent successfully. Subject: ${subject}`);
    return { status: "sent" };
  },
  { connection }
);

// 2. WhatsApp worker
export const whatsappWorker = new Worker(
  "whatsapp-queue",
  async (job: Job) => {
    const { to, message, templateName } = job.data;
    console.log(`[Worker: WhatsApp] Dispatching WhatsApp to ${to}...`);
    if (templateName) {
      await metaWhatsappClient.sendTemplate({
        to,
        templateName,
        languageCode: "en",
      });
    } else {
      await metaWhatsappClient.sendFreeText(to, message);
    }
    return { status: "dispatched" };
  },
  { connection }
);

// 3. Smart assignment worker
export const assignmentWorker = new Worker(
  "assignment-queue",
  async (job: Job) => {
    const { leadId } = job.data;
    console.log(`[Worker: Assignment] Evaluating assignment rules for Lead ${leadId}...`);

    const lead = await getPrisma().lead.findUnique({ where: { id: leadId } });
    if (!lead) {
      console.warn(`[Worker: Assignment] Lead ${leadId} not found.`);
      return;
    }

    // Evaluate assignment rule (awaited)
    const assignmentResult = await evaluateSmartAssignment({
      name: lead.name,
      phone: lead.phone,
      email: lead.email,
      company: lead.company || "",
      industry: lead.industry || "",
      productId: lead.productId || "",
      productName: lead.productId || "",
      budget: lead.budget ? Number(lead.budget) : 0,
      leadSource: lead.leadSource || "",
      campaign: "",
      status: lead.status,
      priority: lead.priority,
      assignedToId: "",
      assignedToName: "",
      state: lead.state || "",
      city: lead.city || "",
      country: lead.country || "",
      language: lead.language || "English",
      notes: lead.notes || "",
      attachments: lead.attachments,
    });

    await getPrisma().lead.update({
      where: { id: leadId },
      data: {
        assignedToId: assignmentResult.userId,
      },
    });

    console.log(`[Worker: Assignment] Assigned Lead ${leadId} to Agent ${assignmentResult.userName}`);
  },
  { connection }
);
