import { prisma } from "@dipantauin/prisma";
import { Prisma } from "@prisma/client";

type PaymentEventStatus = "RECEIVED" | "PROCESSED" | "FAILED";
type FailedPaymentStatus = "EXPIRED" | "REFUNDED" | "FAILED";

type ProcessEventInput = {
  payment: {
    id: string;
    subscriptionId: string | null;
    providerTransactionId: string;
    subscription: { userId: string; plan: { code: string } } | null;
  };
  eventId: string;
  eventType: string;
  payload: Prisma.InputJsonValue;
  eventStatus: PaymentEventStatus;
  isPaid: boolean;
  failedStatus: FailedPaymentStatus | null;
  providerTransactionId?: string;
  now: Date;
  paidPeriodEnd?: Date;
};

export class PaymentsRepository {
  static findById(id: string) {
    return prisma.payment.findUnique({
      where: { id },
      include: {
        subscription: {
          select: { userId: true, plan: { select: { code: true } } },
        },
      },
    });
  }

  static findEvent(eventId: string) {
    return prisma.paymentEvent.findUnique({
      where: { eventId },
      select: { id: true },
    });
  }

  static processEvent(input: ProcessEventInput) {
    const { payment } = input;
    return prisma.$transaction(async (tx) => {
      await tx.paymentEvent.create({
        data: {
          paymentId: payment.id,
          eventId: input.eventId,
          eventType: input.eventType,
          payload: input.payload,
          status: input.eventStatus,
          processedAt: input.now,
        },
      });

      if (input.isPaid) {
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: "PAID",
            paidAt: input.now,
            providerTransactionId:
              input.providerTransactionId || payment.providerTransactionId,
          },
        });
        if (
          payment.subscriptionId &&
          payment.subscription &&
          input.paidPeriodEnd
        ) {
          await tx.subscription.updateMany({
            where: {
              userId: payment.subscription.userId,
              id: { not: payment.subscriptionId },
              status: { in: ["ACTIVE", "TRIALING"] },
            },
            data: { status: "CANCELLED", cancelledAt: input.now },
          });
          await tx.subscription.update({
            where: { id: payment.subscriptionId },
            data: {
              status: "ACTIVE",
              currentPeriodStart: input.now,
              currentPeriodEnd: input.paidPeriodEnd,
              cancelAtPeriodEnd: false,
              cancelledAt: null,
            },
          });
        }
      } else if (input.failedStatus) {
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: input.failedStatus,
            providerTransactionId:
              input.providerTransactionId || payment.providerTransactionId,
          },
        });
        if (payment.subscriptionId) {
          await tx.subscription.update({
            where: { id: payment.subscriptionId },
            data: {
              status:
                input.failedStatus === "EXPIRED" ? "EXPIRED" : "CANCELLED",
              cancelledAt: input.now,
            },
          });
        }
      }
    });
  }

  static findForUser(userId: string) {
    return prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { subscription: { include: { plan: true } } },
    });
  }

  static findForUserById(userId: string, id: string) {
    return prisma.payment.findFirst({
      where: { id, userId },
      include: {
        subscription: { include: { plan: true } },
        events: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            eventType: true,
            status: true,
            processedAt: true,
            createdAt: true,
          },
        },
      },
    });
  }
}
