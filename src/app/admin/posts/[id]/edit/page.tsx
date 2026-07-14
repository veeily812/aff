import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, getChannelScope, getOrganizationScope } from "@/lib/auth";
import PostForm from "../../post-form";

interface EditPostPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPostPage({ params }: EditPostPageProps) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/admin/login");
  }

  const { id } = await params;
  const post = await prisma.post.findUnique({ where: { id } });

  if (!post) {
    notFound();
  }

  const organizationScope = getOrganizationScope(currentUser);
  const channelScope = getChannelScope(currentUser);

  if (post.organizationId !== organizationScope) {
    notFound();
  }

  if (channelScope && post.channelId !== channelScope) {
    notFound();
  }

  const showChannelField = currentUser.role !== "CHANNEL_STAFF";

  const channels = showChannelField
    ? await prisma.channel.findMany({
        where: { organizationId: organizationScope },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      })
    : undefined;

  return (
    <div className="space-y-6">
      <h1 className="gradient-text text-2xl font-bold">Edit Post</h1>
      <PostForm
        initialValues={{
          id: post.id,
          title: post.title,
          slug: post.slug,
          body: post.body,
          published: post.published,
          channelId: post.channelId,
        }}
        channels={channels}
      />
    </div>
  );
}
