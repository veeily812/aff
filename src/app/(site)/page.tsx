import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const organizations = await prisma.organization.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      _count: { select: { posts: { where: { published: true } }, products: true } },
    },
  });

  return (
    <div className="space-y-12">
      <div className="animate-fade-in-up space-y-4 pt-8 text-center">
        <h1 className="gradient-text text-4xl font-extrabold tracking-tight sm:text-5xl">
          Your products. Your storefront.
        </h1>
        <p className="mx-auto max-w-xl text-black/60">
          Every creator gets their own space for affiliate products and posts — set up in under a
          minute, completely separate from everyone else&apos;s.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            href="/signup"
            className="gradient-button rounded-lg px-6 py-2.5 text-sm font-semibold text-black"
          >
            Create your store
          </Link>
          <Link
            href="/admin/login"
            className="glass-card rounded-lg px-6 py-2.5 text-sm text-black/70 transition-colors hover:text-black"
          >
            Sign in
          </Link>
        </div>
      </div>

      <div className="animate-fade-in-up space-y-4">
        <h2 className="text-lg font-semibold text-black/80">Browse stores</h2>
        {organizations.length === 0 ? (
          <p className="text-black/50">No stores yet — be the first.</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {organizations.map((organization, index) => (
              <li
                key={organization.id}
                className="glass-card glass-card-hover animate-fade-in-up rounded-2xl"
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <Link href={`/store/${organization.slug}`} className="block p-6">
                  <p className="text-lg font-semibold text-black transition-colors hover:text-pink-600">
                    {organization.name}
                  </p>
                  <p className="mt-2 text-sm text-black/50">
                    {organization._count.posts} post(s) &middot; {organization._count.products}{" "}
                    product(s)
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
