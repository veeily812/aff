import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { prisma } from "@/lib/prisma";
import { parsePostBody, extractProductIds } from "@/lib/post-content";
import ProductCard from "@/components/product-card";

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

  const blocks = parsePostBody(post.body);
  const productIds = extractProductIds(post.body);
  const products = productIds.length
    ? await prisma.product.findMany({ where: { id: { in: productIds } } })
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
