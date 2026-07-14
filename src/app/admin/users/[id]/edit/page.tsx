import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  getCurrentUser,
  canAccessUsersPage,
  canManageTargetRole,
  assignableRoles,
  getOrganizationScope,
} from "@/lib/auth";
import UserForm from "../../user-form";

interface EditUserPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditUserPage({ params }: EditUserPageProps) {
  const currentUser = await getCurrentUser();

  if (!currentUser || !canAccessUsersPage(currentUser.role)) {
    notFound();
  }

  const organizationScope = getOrganizationScope(currentUser);
  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, role: true, channelId: true, organizationId: true },
  });

  if (!user || user.organizationId !== organizationScope || !canManageTargetRole(currentUser.role, user.role)) {
    notFound();
  }

  const channels = await prisma.channel.findMany({
    where: { organizationId: organizationScope },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="space-y-6">
      <h1 className="gradient-text text-2xl font-bold">Edit User</h1>
      <UserForm
        initialValues={{ id: user.id, email: user.email, role: user.role, channelId: user.channelId }}
        assignableRoles={assignableRoles(currentUser.role)}
        channels={channels}
      />
    </div>
  );
}
