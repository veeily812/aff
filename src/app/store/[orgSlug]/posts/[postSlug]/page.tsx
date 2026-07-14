import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { prisma } from "@/lib/prisma";
import { parsePostBody, extractProductIds } from "@/lib/post-content";
import ProductCard from "@/components/product-card";

export const dynamic = "force-dynamic";

interface StorePostPageProps {
  params: Promise<{ orgSlug: string; postSlug: string }>;
}

async function getPost(orgSlug: string, postSlug: string) {
  // findFirst with the org relation filter: a post is only reachable under
  // its own store's URL, never through another organization's slug.
  return prisma.post.findFirst({
    where: { slug: postSlug, published: true, organization: { slug: orgSlug } },
  });
}

export async function generateMetadata({ params }: StorePostPageProps): Promise<Metadata> {
  const { orgSlug, postSlug } = await params;
  const post = await getPost(orgSlug, postSlug);

  if (!post) {
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

export default async function StorePostPage({ params }: StorePostPageProps) {
  const { orgSlug, postSlug } = await params;
  const post = await getPost(orgSlug, postSlug);

  if (!post) {
    notFound();
  }

  const blocks = parsePostBody(post.body);
  const productIds = extractProductIds(post.body);
  const products = productIds.length
    ? await prisma.product.findMany({
        where: { id: { in: productIds }, organizationId: post.organizationId },
      })
    : [];
  const productsById = new Map(products.map((product) => [product.id, product]));

  return (
    <article className="prose prose-invert glass-card animate-fade-in-up max-w-none rounded-2xl p-6 sm:p-10">
      <h1 className="gradient-text">{post.title}</h1>
      <p className="text-sm text-white/40">
        {new Date(post.createdAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </p>

      {blocks.map((block, index) => {
        if (block.type === "markdown") {
          return (
            <ReactMarkdown key={index} remarkPlugins={[remarkGfm]}>
              {block.content}
            </ReactMarkdown>
          );
        }

        const product = productsById.get(block.productId);

        if (!product) {
          return null;
        }

        return (
          <ProductCard
            key={index}
            name={product.name}
            description={product.description}
            price={product.price}
            imageUrl={product.imageUrl}
            affiliateUrl={product.affiliateUrl}
          />
        );
      })}
    </article>
  );
}
