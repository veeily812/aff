import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deleteImage, storagePathFromPublicUrl, uploadImage } from "@/lib/supabase";
import { productSchema } from "@/lib/validation";
import { getCurrentUser, canDeleteContent, getChannelScope, getOrganizationScope } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id } });

  if (!product) {
    return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
  }

  const organizationScope = getOrganizationScope(currentUser);
  const channelScope = getChannelScope(currentUser);

  if (product.organizationId !== organizationScope) {
    return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
  }

  if (channelScope && product.channelId !== channelScope) {
    return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: product });
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
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

  const organizationScope = getOrganizationScope(currentUser);
  const channelScope = getChannelScope(currentUser);

  try {
    const existing = await prisma.product.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
    }

    if (existing.organizationId !== organizationScope) {
      return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
    }

    if (channelScope && existing.channelId !== channelScope) {
      return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
    }

    let imageUrl = existing.imageUrl;

    if (image instanceof File && image.size > 0) {
      imageUrl = await uploadImage(image, `products/${Date.now()}-${image.name}`);

      const oldPath = storagePathFromPublicUrl(existing.imageUrl);
      if (oldPath) {
        await deleteImage(oldPath).catch(() => undefined);
      }
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        name: parsed.data.name,
        description: parsed.data.description,
        price: parsed.data.price || null,
        category: parsed.data.category || null,
        channelId: channelScope ?? (parsed.data.channelId || null),
        affiliateUrl: parsed.data.affiliateUrl,
        imageUrl,
      },
    });

    return NextResponse.json({ success: true, data: product });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update product";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const currentUser = await getCurrentUser();

  if (!currentUser || !canDeleteContent(currentUser.role)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const organizationScope = getOrganizationScope(currentUser);
  const channelScope = getChannelScope(currentUser);

  try {
    const existing = await prisma.product.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
    }

    if (existing.organizationId !== organizationScope) {
      return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
    }

    if (channelScope && existing.channelId !== channelScope) {
      return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
    }

    const deleted = await prisma.product.delete({ where: { id } });

    const path = storagePathFromPublicUrl(deleted.imageUrl);
    if (path) {
      await deleteImage(path).catch(() => undefined);
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete product";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
