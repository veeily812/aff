import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const posts = await prisma.post.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-10">
      <div className="animate-fade-in-up">
        <h1 className="gradient-text text-4xl font-extrabold tracking-tight">Latest Posts</h1>
        <p className="mt-3 text-white/60">Hand-picked product recommendations and roundups.</p>
      </div>

      {posts.length === 0 ? (
        <p className="text-white/50">No posts published yet. Check back soon.</p>
      ) : (
        <ul className="space-y-6">
          {posts.map((post, index) => (
            <li
              key={post.id}
              className="glass-card glass-card-hover animate-fade-in-up rounded-2xl p-6"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <Link
                href={`/posts/${post.slug}`}
                className="text-xl font-semibold text-white transition-colors hover:text-pink-300"
              >
                {post.title}
              </Link>
              <p className="mt-2 text-sm text-white/40">
                {new Date(post.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
