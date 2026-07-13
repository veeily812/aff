import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/session";
import type { User } from "@/generated/prisma/client";

export type { User };
export * from "@/lib/permissions";

export async function getCurrentUser(): Promise<User | null> {
  const session = await getAdminSession();

  if (!session.userId) {
    return null;
  }

  return prisma.user.findUnique({ where: { id: session.userId } });
}
