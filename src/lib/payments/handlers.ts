import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export async function handleFundingConfirmed(input: { eventId: string; reference: string }) {
  try {
    await db.$transaction(async (tx) => {
      // Fails with a unique error if this event was already processed.
      await tx.webhookEvent.create({
        data: { eventId: input.eventId, type: "funding_confirmed" },
      });
      const payment = await tx.payment.findUnique({ where: { reference: input.reference } });
      if (!payment || payment.type !== "FUND") throw new Error("UNKNOWN_REFERENCE");
      if (payment.status === "CONFIRMED") return;
      await tx.payment.update({ where: { id: payment.id }, data: { status: "CONFIRMED" } });
      await tx.task.update({ where: { id: payment.taskId }, data: { status: "FUNDED" } });
    });
    return "ok" as const;
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return "duplicate" as const;
    }
    throw e;
  }
}