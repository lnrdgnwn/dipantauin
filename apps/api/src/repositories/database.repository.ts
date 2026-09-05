import { prisma } from "@dipantauin/prisma";

export class DatabaseRepository {
  static async isReady() {
    await prisma.$queryRaw`SELECT 1`;
  }

  static disconnect() {
    return prisma.$disconnect();
  }
}
