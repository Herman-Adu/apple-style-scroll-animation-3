import { headers } from "next/headers";

import { auth } from "@/lib/auth/adapters/instance";
import { prisma } from "@/lib/db/prisma";
import { effectiveRole } from "@/lib/auth/domain/config";

export async function sessionUser(): Promise<{
  id: string;
  email: string;
} | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) return null;
  return { id: session.user.id, email: session.user.email ?? "" };
}

export async function requireUser(): Promise<{ id: string; email: string }> {
  const user = await sessionUser();
  if (!user) throw new Error("Not signed in.");
  return user;
}

export async function requireAdminId(): Promise<string> {
  const user = await requireUser();
  const me = await prisma.user.findUnique({
    where: { id: user.id },
    select: { email: true, role: true, roleOverride: true },
  });
  if (!me || effectiveRole(me) !== "admin") throw new Error("Admins only.");
  return user.id;
}
