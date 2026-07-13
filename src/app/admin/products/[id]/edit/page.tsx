import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, getChannelScope } from "@/lib/auth";
import ProductForm from "../../product-form";

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const currentUser = await getCurrentUser();
  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id } });

  if (!product) {
    notFound();
  }

  const channelScope = currentUser ? getChannelScope(currentUser) : null;

  if (channelScope && product.channelId !== channelScope) {
    notFound();
  }

  const showChannelField = currentUser?.role !== "CHANNEL_STAFF";

  const channels = showChannelField
    ? await prisma.channel.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } })
    : undefined;

  return (
    <div className="space-y-6">
      <h1 className="gradient-text text-2xl font-bold">Edit Product</h1>
      <ProductForm
        initialValues={{
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price ?? "",
          category: product.category ?? "",
          channelId: product.channelId,
          affiliateUrl: product.affiliateUrl,
          imageUrl: product.imageUrl,
        }}
        channels={channels}
      />
    </div>
  );
}
