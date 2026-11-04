import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Lightbulb } from "lucide-react";
import Shell from "@/components/Shell";
import NewTaskForm from "@/components/NewTaskForm";
import { db } from "@/lib/db";
import { getUserId } from "@/lib/session";
import { card } from "@/lib/ui";

export const instant = false;

export default async function NewTaskPage() {
  const userId = await getUserId();
  if (!userId) redirect("/login");
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) redirect("/login");
  if (user.role !== "ORG") redirect("/dashboard");

  return (
    <Shell>
      <Link href="/dashboard" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" aria-hidden /> Back to dashboard
      </Link>
      <h1 className="mb-5 text-3xl font-extrabold">Create a task</h1>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <NewTaskForm />
        <aside className="space-y-4">
          <div className={`${card} space-y-3 p-5`}>
            <p className="flex items-center gap-2 font-bold"><Lightbulb className="h-5 w-5 text-amber-700" aria-hidden /> Write criteria a reviewer can check</p>
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
              <li>Delivered as PNG and SVG</li>
              <li>Includes 2 colour versions</li>
              <li>Submitted before the deadline</li>
            </ul>
            <p className="text-sm text-muted">Avoid words like neat, good or nice. They cause disputes.</p>
          </div>
          <div className={`${card} space-y-2 p-5`}>
            <p className="font-bold">What happens next</p>
            <p className="text-sm text-muted">After you create the task, fund it from your dashboard. Once funded, freelancers can accept it.</p>
          </div>
        </aside>
      </div>
    </Shell>
  );
}