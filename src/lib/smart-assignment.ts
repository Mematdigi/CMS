import { getPrisma } from "@/lib/prisma";

export interface AssignmentRule {
  field: "department" | "language" | "location" | "product";
  value: string;
  assignToUserId: string;
}

export interface SmartAssignmentLead {
  name: string;
  phone: string;
  email: string;
  company?: string;
  industry?: string;
  productId?: string;
  productName?: string;
  budget?: number;
  leadSource?: string;
  campaign?: string;
  state?: string;
  city?: string;
  country?: string;
  language?: string;
  notes?: string;
  status?: string;
  priority?: string;
  assignedToId?: string;
  assignedToName?: string;
  [key: string]: unknown;
}

export async function evaluateSmartAssignment(lead: SmartAssignmentLead): Promise<{ userId: string; userName: string }> {
  // 1. Get settings rules
  const rules: AssignmentRule[] = [
    { field: "language", value: "Spanish", assignToUserId: "user-exec2" },
    { field: "language", value: "Japanese", assignToUserId: "user-exec2" },
    { field: "product", value: "Endpoint Security Suite", assignToUserId: "user-exec1" },
    { field: "location", value: "London", assignToUserId: "user-exec1" },
  ];

  // 2. Evaluate rules
  for (const rule of rules) {
    if (rule.field === "language" && lead.language && lead.language.toLowerCase() === rule.value.toLowerCase()) {
      const emp = await getPrisma().user.findFirst({
        where: { id: rule.assignToUserId, isDeleted: false },
      });
      if (emp) return { userId: emp.id, userName: emp.name };
    }
    if (rule.field === "product" && lead.productName && lead.productName.toLowerCase() === rule.value.toLowerCase()) {
      const emp = await getPrisma().user.findFirst({
        where: { id: rule.assignToUserId, isDeleted: false },
      });
      if (emp) return { userId: emp.id, userName: emp.name };
    }
    if (rule.field === "location" && lead.city && lead.city.toLowerCase() === rule.value.toLowerCase()) {
      const emp = await getPrisma().user.findFirst({
        where: { id: rule.assignToUserId, isDeleted: false },
      });
      if (emp) return { userId: emp.id, userName: emp.name };
    }
  }

  // 3. Fallback to Round Robin
  // Get active sales executives
  const salesReps = await getPrisma().user.findMany({
    where: { role: "SALES_EXECUTIVE", isDeleted: false },
  });

  if (salesReps.length === 0) {
    const fallbackUser = await getPrisma().user.findFirst({
      where: { role: "ADMIN", isDeleted: false },
    });
    return {
      userId: fallbackUser?.id || "user-admin",
      userName: fallbackUser?.name || "David Miller",
    };
  }

  // Pick sequentially using timestamp
  const index = Math.floor(Date.now() / 1000) % salesReps.length;
  const chosenRep = salesReps[index];

  return { userId: chosenRep.id, userName: chosenRep.name };
}
