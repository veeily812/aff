import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { extractProductIds } from "@/lib/post-content";

export const dynamic = "force-dynamic";

interface StorePageProps {
  params: Promise<{ orgSlug: string }>;
  searchParams: Promise<{ q?: string; category?: string }>;
}

function buildHref(orgSlug: string, q: string | undefined, category: string | undefined): string {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (category) params.set("category", category);
  const query = params.toString();
  return query ? `/store/${orgSlug}?${query}` : `/store/${orgSlug}`;
}

export async function generateMetadata({ params }: StorePageProps): Promise<Metadata> {
  const { orgSlug } = await params;
  const organization = await prisma.organization.findUnique({
    where: { slug: orgSlug },
    select: { name: true },
  });

  return { title: organization?.name ?? "Store not found" };
}

export default async function StorePage({ params, searchParams }: StorePageProps) {
  const { orgSlug } = await params;
  const { q, category } = await searchParams;
  const query = q?.trim().toLowerCase() ?? "";

  const organization = await prisma.organization.findUnique({
    where: { slug: orgSlug },
    select: { id: true, name: true, slug: true },
  });

  if (!organization) {
    notFound();
  }

  const posts = await prisma.post.findMany({
    where: { published: true, organizationId: organization.id },
    orderBy: { createdAt: "desc" },
  });

  const firstProductIdByPostId = new Map(
    posts.map((post) => [post.id, extractProductIds(post.body)[0]])
  );
  const productIds = [...new Set([...firstProductIdByPostId.values()].filter(Boolean))] as string[];
  const products = productIds.length
    ? await prisma.product.findMany({
        where: { id: { in: productIds }, organizationId: organization.id },
      })
    : [];
  const productsById = new Map(products.map((product) => [product.id, product]));

  const categories = [...new Set(products.map((product) => product.category).filter(Boolean))] as string[];
  categories.sort((a, b) => a.localeCompare(b));

  const visiblePosts = posts.filter((post) => {
    const productId = firstProductIdByPostId.get(post.id);
    const product = productId ? productsById.get(productId) : undefined;

    if (category && product?.category !== category) {
      return false;
    }

    if (!query) {
      return true;
    }

    return [post.title, post.body, product?.name, product?.description]
      .filter(Boolean)
      .some((text) => text!.toLowerCase().includes(query));
  });

  return (
    <div className="space-y-10">
      <div className="animate-fade-in-up">
        <h1 className="gradient-text text-4xl font-extrabold tracking-tight">{organization.name}</h1>
        <p className="mt-3 text-black/60">Hand-picked product recommendations and roundups.</p>
      </div>

      <div className="animate-fade-in-up space-y-4">
        <form action={`/store/${organization.slug}`} method="GET" className="flex gap-2">
          {category ? <input type="hidden" name="category" value={category} /> : null}
          <input
            type="text"
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search products..."
            className="w-full rounded-lg border-2 border-black bg-white px-4 py-2 text-sm text-black placeholder-black/50 focus:border-violet-600 focus:outline-none focus:ring-2 focus:ring-violet-600/30"
          />
          <button
            type="submit"
            className="gradient-button shrink-0 rounded-lg px-5 py-2 text-sm font-semibold text-black"
          >
            Search
          </button>
          {q || category ? (
            <Link
              href={`/store/${organization.slug}`}
              className="glass-card shrink-0 rounded-lg px-4 py-2 text-sm text-black/70 transition-colors hover:text-black"
            >
              Clear
            </Link>
          ) : null}
        </form>

        {categories.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            <Link
              href={buildHref(organization.slug, q, undefined)}
              className={
                !category
                  ? "gradient-button rounded-full px-4 py-1.5 text-xs font-semibold text-black"
                  : "glass-card rounded-full px-4 py-1.5 text-xs text-black/70 transition-colors hover:text-black"
              }
            >
              All
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat}
                href={buildHref(organization.slug, q, cat)}
                className={
                  category === cat
                    ? "gradient-button rounded-full px-4 py-1.5 text-xs font-semibold text-black"
                    : "glass-card rounded-full px-4 py-1.5 text-xs text-black/70 transition-colors hover:text-black"
                }
              >
                {cat}
              </Link>
            ))}
          </div>
        ) : null}
      </div>

      {visiblePosts.length === 0 ? (
        <p className="text-black/50">
          {query || category
            ? "No products found matching your filters."
            : "No posts published yet. Check back soon."}
        </p>
      ) : (
        <ul className="space-y-6">
          {visiblePosts.map((post, index) => {
            const productId = firstProductIdByPostId.get(post.id);
            const product = productId ? productsById.get(productId) : undefined;

            return (
              <li
                key={post.id}
                className="glass-card glass-card-hover animate-fade-in-up rounded-2xl p-6"
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <Link
                  href={`/store/${organization.slug}/posts/${post.slug}`}
                  className="flex items-center gap-4"
                >
                  {product ? (
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-white">
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
                    <span className="text-xl font-semibold text-black transition-colors hover:text-pink-600">
                      {post.title}
                    </span>
                    <p className="mt-2 text-sm text-black/50">
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
