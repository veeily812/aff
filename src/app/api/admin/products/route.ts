import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { uploadImage } from "@/lib/supabase";
import { productSchema } from "@/lib/validation";

export async function GET() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ success: true, data: products });
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const image = formData.get("image");

  const parsed = productSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    price: formData.get("price"),
    affiliateUrl: formData.get("affiliateUrl"),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  if (!(image instanceof File) || image.size === 0) {
    return NextResponse.json(
      { success: false, error: "Product image is required" },
      { status: 400 }
    );
  }

  try {
    const imageUrl = await uploadImage(image, `products/${Date.now()}-${image.name}`);

    const product = await prisma.product.create({
      data: {
        name: parsed.data.name,
        description: parsed.data.description,
        price: parsed.data.price || null,
        affiliateUrl: parsed.data.affiliateUrl,
        imageUrl,
      },
    });

    return NextResponse.json({ success: true, data: product }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create product";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
