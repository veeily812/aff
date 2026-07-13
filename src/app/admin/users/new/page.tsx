import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, canAccessUsersPage, assignableRoles } from "@/lib/auth";
import UserForm from "../user-form";

export default async function NewUserPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser || !canAccessUsersPage(currentUser.role)) {
    notFound();
  }

  const channels = await prisma.channel.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="space-y-6">
      <h1 className="gradient-text text-2xl font-bold">New User</h1>
      <UserForm assignableRoles={assignableRoles(currentUser.role)} channels={channels} />
    </div>
  );
}
