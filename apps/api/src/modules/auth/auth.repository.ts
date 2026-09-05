import { prisma } from "@dipantauin/prisma";

export class AuthRepository {
  static findActiveSubscription(userId: string) {
    return prisma.subscription.findFirst({
      where: { userId, status: "ACTIVE" },
      select: { id: true },
    });
  }

  static findFreePlan() {
    return prisma.plan.findFirst({ where: { code: "FREE", isActive: true } });
  }

  static createSubscription(
    userId: string,
    planId: string,
    currentPeriodStart: Date,
    currentPeriodEnd: Date,
  ) {
    return prisma.subscription.create({
      data: {
        userId,
        planId,
        status: "ACTIVE",
        currentPeriodStart,
        currentPeriodEnd,
      },
    });
  }

  static findUserByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  }

  static createUser(data: {
    email: string;
    passwordHash: string;
    name: string;
    verificationCode: string;
    verificationCodeExpiresAt: Date;
  }) {
    return prisma.user.create({ data });
  }

  static verifyUser(id: string) {
    return prisma.user.update({
      where: { id },
      data: {
        isVerified: true,
        verificationCode: null,
        verificationCodeExpiresAt: null,
      },
    });
  }

  static findPublicUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        isVerified: true,
        createdAt: true,
      },
    });
  }

  static findCredentialsById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: { id: true, passwordHash: true },
    });
  }

  static updateProfile(id: string, data: { name: string }) {
    return prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        isVerified: true,
        createdAt: true,
      },
    });
  }

  static updatePasswordAndRevokeSessions(id: string, passwordHash: string) {
    return prisma.$transaction([
      prisma.user.update({ where: { id }, data: { passwordHash } }),
      prisma.refreshToken.deleteMany({ where: { userId: id } }),
    ]);
  }

  static findUserRole(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: { role: true, status: true },
    });
  }

  static createRefreshToken(
    userId: string,
    tokenHash: string,
    expiresAt: Date,
  ) {
    return prisma.refreshToken.create({
      data: { userId, tokenHash, expiresAt },
    });
  }

  static async pruneRefreshTokens(userId: string, keep = 5) {
    const staleTokens = await prisma.refreshToken.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { id: true },
      skip: keep,
    });
    if (staleTokens.length === 0) return;
    await prisma.refreshToken.deleteMany({
      where: { id: { in: staleTokens.map(({ id }) => id) } },
    });
  }

  static findRefreshToken(tokenHash: string) {
    return prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isVerified: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });
  }

  static deleteRefreshToken(tokenHash: string) {
    return prisma.refreshToken.deleteMany({ where: { tokenHash } });
  }
}
