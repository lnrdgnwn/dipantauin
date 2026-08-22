import { prisma } from "../index";
import { seedPlans } from "./plan.seeder";

async function main() {
  console.log("🌱 Starting database seed...");

  await seedPlans();

  console.log("✅ Database seed completed.");
}

main()
  .catch((error) => {
    console.error("❌ Database seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });