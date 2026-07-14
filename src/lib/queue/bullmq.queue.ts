import { Queue } from "bullmq";

const connection = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
};

export const emailQueue = new Queue("email-queue", { connection });
export const whatsappQueue = new Queue("whatsapp-queue", { connection });
export const reminderQueue = new Queue("reminder-queue", { connection });
export const assignmentQueue = new Queue("assignment-queue", { connection });
export const reportQueue = new Queue("report-queue", { connection });

export async function addEmailJob(data: { to: string; subject: string; body: string }) {
  await emailQueue.add("send-email", data, { attempts: 3, backoff: 5000 });
}

export async function addWhatsappJob(data: { to: string; message: string; templateName?: string }) {
  await whatsappQueue.add("send-whatsapp", data, { attempts: 3, backoff: 5000 });
}

export async function addAssignmentJob(data: { leadId: string }) {
  await assignmentQueue.add("smart-assign", data, { attempts: 2 });
}
