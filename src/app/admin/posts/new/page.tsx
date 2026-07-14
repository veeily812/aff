import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, getOrganizationScope } from "@/lib/auth";
import PostForm from "../post-form";

export default async function NewPostPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/admin/login");
  }

  const showChannelField = currentUser.role !== "CHANNEL_STAFF";
  const organizationScope = getOrganizationScope(currentUser);

  const channels = showChannelField
    ? await prisma.channel.findMany({
        where: { organizationId: organizationScope },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      })
    : undefined;

  return (
    <div className="space-y-6">
      <h1 className="gradient-text text-2xl font-bold">New Post</h1>
      <PostForm channels={channels} />
    </div>
  );
}
