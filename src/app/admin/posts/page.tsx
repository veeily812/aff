import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, canDeleteContent } from "@/lib/auth";
import DeletePostButton from "./delete-post-button";

export const dynamic = "force-dynamic";

export default async function AdminPostsPage() {
  const currentUser = await getCurrentUser();
  const canDelete = Boolean(currentUser && canDeleteContent(currentUser.role));

  const posts = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="gradient-text text-2xl font-bold">Posts</h1>
        <Link
          href="/admin/posts/new"
          className="gradient-button rounded-lg px-4 py-2 text-sm font-semibold text-white"
        >
          New Post
        </Link>
      </div>

      {posts.length === 0 ? (
        <p className="text-sm text-white/50">No posts yet.</p>
      ) : (
        <ul className="space-y-3">
          {posts.map((post, index) => (
            <li
              key={post.id}
              className="glass-card glass-card-hover animate-fade-in-up flex items-center gap-4 rounded-xl p-4"
              style={{ animationDelay: `${index * 40}ms` }}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-white">{post.title}</p>
                <p className="truncate text-sm text-white/50">
                  /{post.slug} &middot;{" "}
                  <span className={post.published ? "text-emerald-400" : "text-amber-400"}>
                    {post.published ? "Published" : "Draft"}
                  </span>
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <Link
                  href={`/admin/posts/${post.id}/edit`}
                  className="text-sm text-white/60 transition-colors hover:text-white"
                >
                  Edit
                </Link>
                {canDelete ? <DeletePostButton postId={post.id} /> : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
