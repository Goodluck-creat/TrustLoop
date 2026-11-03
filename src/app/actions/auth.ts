"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createSession, destroySession } from "@/lib/session";

export async function signup(_prev: string | null, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const role = formData.get("role") === "ORG" ? "ORG" : "CONTRIBUTOR";

  if (!name || !email.includes("@") || password.length < 8) {
    return "Enter your name, a valid email and a password of 8+ characters.";
  }
  if (await db.user.findUnique({ where: { email } })) {
    return "That email is already registered.";
  }
  const user = await db.user.create({
    data: { name, email, role, passwordHash: await bcrypt.hash(password, 10) },
  });
  await createSession(user.id);
  redirect("/dashboard");
}

export async function login(_prev: string | null, formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const user = await db.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return "Wrong email or password.";
  }
  await createSession(user.id);
  redirect("/dashboard");
}

export async function logout() {
  await destroySession();
  redirect("/");
}