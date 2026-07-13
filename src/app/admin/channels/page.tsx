import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, canManageChannels } from "@/lib/auth";
import NewChannelForm from "./new-channel-form";
import DeleteChannelButton from "./delete-channel-button";

export const dynamic = "force-dynamic";

export default async function AdminChannelsPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser || !canManageChannels(currentUser.role)) {
    notFound();
  }

  const channels = await prisma.channel.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true, posts: true, users: true } } },
  });

  return (
    <div className="space-y-6">
      <h1 className="gradient-text text-2xl font-bold">Channels</h1>

      <NewChannelForm />

      {channels.length === 0 ? (
        <p className="text-sm text-white/50">No channels yet.</p>
      ) : (
        <ul className="space-y-3">
          {channels.map((channel) => (
            <li key={channel.id} className="glass-card flex items-center gap-4 rounded-xl p-4">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-white">{channel.name}</p>
                <p className="mt-1 text-sm text-white/50">
                  {channel._count.products} product(s) &middot; {channel._count.posts} post(s)
                  &middot; {channel._count.users} user(s)
                </p>
              </div>
              <DeleteChannelButton channelId={channel.id} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
