import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { issueCredential } from "@/lib/credentials";

export async function handleFundingConfirmed(input: { eventId: string; reference: string }) {
  try {
    await db.$transaction(async (tx) => {
      await tx.webhookEvent.create({ data: { eventId: input.eventId, type: "funding_confirmed" } });
      const payment = await tx.payment.findUnique({ where: { reference: input.reference } });
      if (!payment || payment.type !== "FUND") throw new Error("UNKNOWN_REFERENCE");
      if (payment.status === "CONFIRMED") return;
      await tx.payment.update({ where: { id: payment.id }, data: { status: "CONFIRMED" } });
      await tx.task.update({ where: { id: payment.taskId }, data: { status: "FUNDED" } });
    });
    return "ok" as const;
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return "duplicate" as const;
    throw e;
  }
}

export async function handlePayoutConfirmed(input: { eventId: string; reference: string; txHash: string }) {
  try {
    await db.$transaction(async (tx) => {
      await tx.webhookEvent.create({ data: { eventId: input.eventId, type: "payout_confirmed" } });
      const payment = await tx.payment.findUnique({ where: { reference: input.reference } });
      if (!payment || payment.type !== "PAYOUT") throw new Error("UNKNOWN_REFERENCE");
      if (payment.status === "CONFIRMED") return;
      await tx.payment.update({ where: { id: payment.id }, data: { status: "CONFIRMED", txHash: input.txHash } });
      await tx.task.update({ where: { id: payment.taskId }, data: { status: "PAID" } });
      await issueCredential(tx, payment.taskId, input.reference, input.txHash);
    });
    return "ok" as const;
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return "duplicate" as const;
    throw e;
  }
}