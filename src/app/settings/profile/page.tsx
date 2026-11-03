import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import Shell from "@/components/Shell";
import ImagePicker from "@/components/ImagePicker";
import { db } from "@/lib/db";
import { getUserId } from "@/lib/session";
import { avatarSrc, coverSrc } from "@/lib/images";
import { removeImage } from "@/app/actions/profile";
import { card } from "@/lib/ui";

export const instant = false;

export default async function ProfileSettings({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const userId = await getUserId();
  if (!userId) redirect("/login");
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) redirect("/login");
  const { saved } = await searchParams;

  return (
    <Shell>
      <div className="mx-auto max-w-2xl space-y-5">
        <Link href={`/p/${user.id}`} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white">
          <ArrowLeft className="h-4 w-4" aria-hidden /> Back to my passport
        </Link>
        <h1 className="text-2xl font-extrabold">Edit profile pictures</h1>
        {saved && (
          <p role="status" className="flex items-center gap-2 rounded-2xl bg-emerald-400/15 px-4 py-3 text-sm font-semibold text-emerald-200">
            <CheckCircle2 className="h-5 w-5" aria-hidden /> Saved.
          </p>
        )}

        <section className={`${card} space-y-3 p-6`}>
          <h2 className="text-lg font-bold">Profile picture</h2>
          <ImagePicker kind="avatar" current={avatarSrc(user)} />
          {user.avatarAt && (
            <form action={removeImage.bind(null, "avatar")}>
              <button className="text-sm font-semibold text-slate-300 underline">Remove picture</button>
            </form>
          )}
        </section>

        <section className={`${card} space-y-3 p-6`}>
          <h2 className="text-lg font-bold">Cover picture</h2>
          <ImagePicker kind="cover" current={coverSrc(user)} />
          {user.coverAt && (
            <form action={removeImage.bind(null, "cover")}>
              <button className="text-sm font-semibold text-slate-300 underline">Remove cover</button>
            </form>
          )}
        </section>
      </div>
    </Shell>
  );
}