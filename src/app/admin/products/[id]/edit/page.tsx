import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProductForm from "../../product-form";

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id } });

  if (!product) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Edit Product</h1>
      <ProductForm
        initialValues={{
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price ?? "",
          affiliateUrl: product.affiliateUrl,
          imageUrl: product.imageUrl,
        }}
      />
    </div>
  );
}
