import { prisma } from "../index"

export async function seedPlans() {
  await prisma.plan.upsert({
    where: {
      code: "FREE",
    },
    update: {
      name: "Free",
      price: 0,
      currency: "IDR",
      maxProducts: 3,
      checkIntervalMin: 1440,
      isActive: true,
    },
    create: {
      code: "FREE",
      name: "Free",
      price: 0,
      currency: "IDR",
      maxProducts: 3,
      checkIntervalMin: 1440, // 24 hours
      isActive: true,
    },
  });

  await prisma.plan.upsert({
    where: {
      code: "PRO",
    },
    update: {
      name: "Pro",
      price: 49000,
      currency: "IDR",
      maxProducts: 25,
      checkIntervalMin: 60,
      isActive: true,
    },
    create: {
      code: "PRO",
      name: "Pro",
      price: 49000,
      currency: "IDR",
      maxProducts: 25,
      checkIntervalMin: 60, // 1 hour
      isActive: true,
    },
  });
}
