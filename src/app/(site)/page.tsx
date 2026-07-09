import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { extractProductIds } from "@/lib/post-content";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const posts = await prisma.post.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
  });

  const firstProductIdByPostId = new Map(
    posts.map((post) => [post.id, extractProductIds(post.body)[0]])
  );
  const productIds = [...new Set([...firstProductIdByPostId.values()].filter(Boolean))] as string[];
  const products = productIds.length
    ? await prisma.product.findMany({ where: { id: { in: productIds } } })
    : [];
  const productsById = new Map(products.map((product) => [product.id, product]));

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
          {posts.map((post, index) => {
            const productId = firstProductIdByPostId.get(post.id);
            const product = productId ? productsById.get(productId) : undefined;

            return (
              <li
                key={post.id}
                className="glass-card glass-card-hover animate-fade-in-up rounded-2xl p-6"
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <Link href={`/posts/${post.slug}`} className="flex items-center gap-4">
                  {product ? (
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-white/5">
                      <Image
                        src={product.imageUrl}
                        alt={product.name}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    </div>
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <span className="text-xl font-semibold text-white transition-colors hover:text-pink-300">
                      {post.title}
                    </span>
                    <p className="mt-2 text-sm text-white/40">
                      {new Date(post.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
