import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { extractProductIds } from "@/lib/post-content";

export const dynamic = "force-dynamic";

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

async function getPost(slug: string) {
  return prisma.post.findUnique({ where: { slug } });
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post || !post.published) {
    return { title: "Post not found" };
  }

  const description = post.body.replace(/\[\[product:[a-zA-Z0-9_-]+\]\]/g, "").slice(0, 160);

  return {
    title: post.title,
    description,
    openGraph: {
      title: post.title,
      description,
      type: "article",
      ...(post.coverImage ? { images: [{ url: post.coverImage }] } : {}),
    },
  };
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post || !post.published) {
    notFound();
  }

  const [firstProductId] = extractProductIds(post.body);

  if (firstProductId) {
    const product = await prisma.product.findUnique({ where: { id: firstProductId } });

    if (product) {
      redirect(product.affiliateUrl);
    }
  }

  notFound();
}
