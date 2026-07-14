import { notFound, permanentRedirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface LegacyPostPageProps {
  params: Promise<{ slug: string }>;
}

// Posts now live under their store's URL. Old /posts/<slug> links (shared
// before the multi-tenant split) redirect to the canonical store address -
// post slugs are globally unique, so the lookup is unambiguous.
export default async function LegacyPostPage({ params }: LegacyPostPageProps) {
  const { slug } = await params;
  const post = await prisma.post.findUnique({
    where: { slug },
    select: { published: true, organization: { select: { slug: true } } },
  });

  if (!post || !post.published) {
    notFound();
  }

  permanentRedirect(`/store/${post.organization.slug}/posts/${slug}`);
}
