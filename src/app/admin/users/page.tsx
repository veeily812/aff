import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, canAccessUsersPage, canManageTargetRole, getOrganizationScope } from "@/lib/auth";
import DeleteUserButton from "./delete-user-button";

export const dynamic = "force-dynamic";

const ROLE_LABELS: Record<string, string> = {
  OWNER: "Owner",
  SECONDARY_ADMIN: "Secondary Admin",
  MANAGER: "Manager",
  STAFF: "Staff",
  CHANNEL_STAFF: "Channel Staff",
};

export default async function AdminUsersPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser || !canAccessUsersPage(currentUser.role)) {
    notFound();
  }

  const organizationScope = getOrganizationScope(currentUser);

  const users = await prisma.user.findMany({
    where: { organizationId: organizationScope },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      role: true,
      createdAt: true,
      channel: { select: { name: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="gradient-text text-2xl font-bold">Users</h1>
        <Link
          href="/admin/users/new"
          className="gradient-button rounded-lg px-4 py-2 text-sm font-semibold text-black"
        >
          New User
        </Link>
      </div>

      <ul className="space-y-3">
        {users.map((user) => {
          const canManage = canManageTargetRole(currentUser.role, user.role);

          return (
            <li
              key={user.id}
              className="glass-card flex items-center gap-4 rounded-xl p-4"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-black">{user.email}</p>
                <p className="mt-1 text-sm text-black/50">
                  {ROLE_LABELS[user.role] ?? user.role}
                  {user.channel ? ` (${user.channel.name})` : ""} &middot;{" "}
                  {new Date(user.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              {canManage ? (
                <div className="flex shrink-0 items-center gap-3">
                  <Link
                    href={`/admin/users/${user.id}/edit`}
                    className="text-sm text-black/60 transition-colors hover:text-black"
                  >
                    Edit
                  </Link>
                  <DeleteUserButton userId={user.id} />
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
