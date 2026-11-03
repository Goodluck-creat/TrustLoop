import { db } from "@/lib/db";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string; kind: string }> }) {
  const { id, kind } = await params;
  if (kind !== "avatar" && kind !== "cover") return new Response("Not found", { status: 404 });
  const img = await db.userImage.findUnique({ where: { userId_kind: { userId: id, kind } } });
  if (!img) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(img.data), {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}