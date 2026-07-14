import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Start seeding database...");

  // 1. Seed Tenant
  const tenant = await prisma.tenant.upsert({
    where: { id: "tenant-1" },
    update: {},
    create: {
      id: "tenant-1",
      name: "Enterprise Holdings",
      subdomain: "enterprise",
    },
  });

  // 2. Seed Workspace
  const workspace = await prisma.workspace.upsert({
    where: { id: "workspace-1" },
    update: {},
    create: {
      id: "workspace-1",
      tenantId: tenant.id,
      name: "Main Sales Workspace",
    },
  });

  // 3. Seed Users
  const usersToSeed = [
    { id: "user-super", name: "Sarah Connor", email: "super@enterprise.com", role: UserRole.SUPER_ADMIN },
    { id: "user-admin", name: "David Miller", email: "admin@enterprise.com", role: UserRole.ADMIN },
    { id: "user-exec1", name: "John Sales", email: "sales1@enterprise.com", role: UserRole.SALES_EXECUTIVE },
    { id: "user-exec2", name: "Elena Rostova", email: "sales2@enterprise.com", role: UserRole.SALES_EXECUTIVE },
    { id: "user-leader", name: "Marcus Vance", email: "leader@enterprise.com", role: UserRole.TEAM_LEADER },
    { id: "user-viewer", name: "Thomas Viewer", email: "viewer@enterprise.com", role: UserRole.VIEWER },
  ];

  for (const u of usersToSeed) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role },
      create: {
        id: u.id,
        tenantId: tenant.id,
        name: u.name,
        email: u.email,
        passwordHash: "admin123", // Matching authorize fallback check
        role: u.role,
        language: "English",
      },
    });

    // Seed Employee profile for the user
    await prisma.employee.upsert({
      where: { userId: u.id },
      update: {},
      create: {
        id: `emp-${u.id}`,
        userId: u.id,
        targetMonthly: u.role === UserRole.ADMIN || u.role === UserRole.SUPER_ADMIN ? 120000.0 : 60000.0,
        conversionRate: u.role === UserRole.ADMIN || u.role === UserRole.SUPER_ADMIN ? 25.0 : 18.0,
        attendanceCount: 22,
        leaveBalance: 15,
      },
    });
  }

  // 4. Seed Products
  const productsToSeed = [
    { id: "prod-cloud", name: "Enterprise Cloud Hosting", price: 1200 },
    { id: "prod-sec", name: "Endpoint Security Suite", price: 650 },
  ];

  for (const p of productsToSeed) {
    await prisma.product.upsert({
      where: { id: p.id },
      update: { name: p.name, price: p.price },
      create: {
        id: p.id,
        tenantId: tenant.id,
        name: p.name,
        price: p.price,
      },
    });
  }

  // 5. Seed default Campaigns
  const campaignsToSeed = [
    { id: "camp-tech", name: "Q3 Tech Summit", source: "Google Ads", budget: 15000, startDate: new Date("2026-07-01"), endDate: new Date("2026-09-30") },
    { id: "camp-ai", name: "AI Automations Campaign", source: "Facebook Ads", budget: 8000, startDate: new Date("2026-06-01"), endDate: new Date("2026-08-31") },
    { id: "camp-direct", name: "Direct Marketing Drive", source: "Newsletter", budget: 5000, startDate: new Date("2026-05-01"), endDate: new Date("2026-07-31") },
  ];

  for (const c of campaignsToSeed) {
    await prisma.campaign.upsert({
      where: { id: c.id },
      update: { name: c.name, budget: c.budget },
      create: {
        id: c.id,
        tenantId: tenant.id,
        name: c.name,
        source: c.source,
        budget: c.budget,
        startDate: c.startDate,
        endDate: c.endDate,
      },
    });
  }

  // 6. Seed default Lead opportunity
  await prisma.lead.upsert({
    where: { id: "lead-seed-1" },
    update: {
      productId: "prod-cloud",
      campaignId: "camp-tech",
    },
    create: {
      id: "lead-seed-1",
      tenantId: tenant.id,
      workspaceId: workspace.id,
      name: "Acme Corporate Sync",
      phone: "+15550199",
      email: "info@acme.com",
      company: "Acme Corp",
      industry: "Technology",
      productId: "prod-cloud",
      campaignId: "camp-tech",
      budget: 85000,
      leadSource: "Google Search",
      status: "NEW",
      priority: "HIGH",
      createdById: "user-admin",
      assignedToId: "user-exec1",
      notes: "Seeded initial enterprise lead opportunity.",
    },
  });

  // 7. Seed default Notifications for users
  for (const u of usersToSeed) {
    await prisma.notification.upsert({
      where: { id: `notif-1-${u.id}` },
      update: {},
      create: {
        id: `notif-1-${u.id}`,
        userId: u.id,
        title: "New Lead Assigned",
        message: "Sophia Martinez has been assigned to your workspace profile",
        isRead: false,
      },
    });
    await prisma.notification.upsert({
      where: { id: `notif-2-${u.id}` },
      update: {},
      create: {
        id: `notif-2-${u.id}`,
        userId: u.id,
        title: "Follow-up Sync Reminder",
        message: "Book new meeting target with Alex Thompson in 1 hour",
        isRead: false,
      },
    });
  }

  console.log("Seeding finished successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
