import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { uploadImage } from "@/lib/supabase";
import { productSchema } from "@/lib/validation";
import { getCurrentUser, getChannelScope, getOrganizationScope } from "@/lib/auth";

export async function GET() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const organizationScope = getOrganizationScope(currentUser);
  const channelScope = getChannelScope(currentUser);

  const products = await prisma.product.findMany({
    where: {
      organizationId: organizationScope,
      ...(channelScope ? { channelId: channelScope } : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ success: true, data: products });
}

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const image = formData.get("image");

  const parsed = productSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    price: formData.get("price"),
    category: formData.get("category"),
    channelId: formData.get("channelId"),
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

  const organizationScope = getOrganizationScope(currentUser);
  const channelScope = getChannelScope(currentUser);

  try {
    const imageUrl = await uploadImage(image, `products/${Date.now()}-${image.name}`);

    const product = await prisma.product.create({
      data: {
        name: parsed.data.name,
        description: parsed.data.description,
        price: parsed.data.price || null,
        category: parsed.data.category || null,
        channelId: channelScope ?? (parsed.data.channelId || null),
        organizationId: organizationScope,
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
