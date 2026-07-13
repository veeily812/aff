import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, canDeleteContent, canImportContent } from "@/lib/auth";
import DeleteProductButton from "./delete-product-button";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const currentUser = await getCurrentUser();
  const canDelete = Boolean(currentUser && canDeleteContent(currentUser.role));
  const canImport = Boolean(currentUser && canImportContent(currentUser.role));

  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="gradient-text text-2xl font-bold">Products</h1>
        <div className="flex items-center gap-3">
          {canImport ? (
            <Link
              href="/admin/products/import"
              className="glass-card rounded-lg px-4 py-2 text-sm font-medium text-white/80 transition-colors hover:text-white"
            >
              Import from File/Sheet
            </Link>
          ) : null}
          <Link
            href="/admin/products/new"
            className="gradient-button rounded-lg px-4 py-2 text-sm font-semibold text-white"
          >
            New Product
          </Link>
        </div>
      </div>

      {products.length === 0 ? (
        <p className="text-sm text-white/50">No products yet.</p>
      ) : (
        <ul className="space-y-3">
          {products.map((product, index) => (
            <li
              key={product.id}
              className="glass-card glass-card-hover animate-fade-in-up flex items-center gap-4 rounded-xl p-4"
              style={{ animationDelay: `${index * 40}ms` }}
            >
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-white/5">
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-white">{product.name}</p>
                <p className="truncate text-sm text-white/50">{product.description}</p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <Link
                  href={`/admin/products/${product.id}/edit`}
                  className="text-sm text-white/60 transition-colors hover:text-white"
                >
                  Edit
                </Link>
                {canDelete ? <DeleteProductButton productId={product.id} /> : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
