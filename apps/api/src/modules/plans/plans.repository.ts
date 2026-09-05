import { prisma } from "@dipantauin/prisma";

export class PlansRepository {
  static findActive() {
    return prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { price: "asc" },
    });
  }

  static findById(id: string) {
    return prisma.plan.findUnique({ where: { id } });
  }
}
