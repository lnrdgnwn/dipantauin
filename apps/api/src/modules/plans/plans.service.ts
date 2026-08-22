import { prisma } from "@dipantauin/prisma";

export class PlansService {
  static async getPlans() {
    return prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { price: "asc" },
    });
  }

  static async getPlanById(id: string) {
    const plan = await prisma.plan.findUnique({ where: { id } });
    if (!plan) {
      throw { statusCode: 404, message: "Plan not found" };
    }
    return plan;
  }
}
