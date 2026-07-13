import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { postSchema } from "@/lib/validation";
import { getCurrentUser, canDeleteContent } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  const post = await prisma.post.findUnique({ where: { id } });

  if (!post) {
    return NextResponse.json({ success: false, error: "Post not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: post });
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const body: unknown = await request.json().catch(() => null);
  const parsed = postSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const slugOwner = await prisma.post.findUnique({ where: { slug: parsed.data.slug } });

  if (slugOwner && slugOwner.id !== id) {
    return NextResponse.json(
      { success: false, error: "A post with this slug already exists" },
      { status: 409 }
    );
  }

  try {
    const post = await prisma.post.update({ where: { id }, data: parsed.data });
    return NextResponse.json({ success: true, data: post });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update post";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const currentUser = await getCurrentUser();

  if (!currentUser || !canDeleteContent(currentUser.role)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    await prisma.post.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete post";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
