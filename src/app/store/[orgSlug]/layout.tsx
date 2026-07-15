import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import SiteFooter from "@/components/site-footer";

interface StoreLayoutProps {
  children: ReactNode;
  params: Promise<{ orgSlug: string }>;
}

export default async function StoreLayout({ children, params }: StoreLayoutProps) {
  const { orgSlug } = await params;
  const organization = await prisma.organization.findUnique({
    where: { slug: orgSlug },
    select: { name: true, slug: true },
  });

  if (!organization) {
    notFound();
  }

  return (
    <div className="bg-app-gradient flex min-h-screen flex-col">
      <header className="glass-card sticky top-0 z-10 border-x-0 border-t-0">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-5">
          <Link
            href={`/store/${organization.slug}`}
            className="gradient-text text-lg font-bold tracking-tight"
          >
            {organization.name}
          </Link>
          <Link href="/" className="text-sm text-black/50 transition-colors hover:text-black">
            All stores
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12">{children}</main>
      <SiteFooter />
    </div>
  );
}
