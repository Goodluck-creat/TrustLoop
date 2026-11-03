import type { Prisma } from "@prisma/client";

export async function notify(
  client: { notification: Prisma.TransactionClient["notification"] },
  userId: string,
  title: string,
  body: string,
  href: string,
) {
  await client.notification.create({ data: { userId, title, body, href } });
}