import type { ReactNode } from "react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import AdminNav from "./admin-nav";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const currentUser = await getCurrentUser();

  const organization = currentUser
    ? await prisma.organization.findUnique({
        where: { id: currentUser.organizationId },
        select: { name: true, slug: true },
      })
    : null;

  return (
    <div className="bg-app-gradient min-h-screen">
      <AdminNav
        role={currentUser?.role ?? null}
        storeName={organization?.name ?? null}
        storeSlug={organization?.slug ?? null}
      />
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
