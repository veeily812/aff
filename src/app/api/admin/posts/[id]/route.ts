import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { postSchema } from "@/lib/validation";
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
  const post = await prisma.post.findUnique({ where: { id } });

  if (!post) {
    return NextResponse.json({ success: false, error: "Post not found" }, { status: 404 });
  }

  const organizationScope = getOrganizationScope(currentUser);
  const channelScope = getChannelScope(currentUser);

  if (post.organizationId !== organizationScope) {
    return NextResponse.json({ success: false, error: "Post not found" }, { status: 404 });
  }

  if (channelScope && post.channelId !== channelScope) {
    return NextResponse.json({ success: false, error: "Post not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: post });
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

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

  const organizationScope = getOrganizationScope(currentUser);
  const channelScope = getChannelScope(currentUser);

  try {
    const existing = await prisma.post.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ success: false, error: "Post not found" }, { status: 404 });
    }

    if (existing.organizationId !== organizationScope) {
      return NextResponse.json({ success: false, error: "Post not found" }, { status: 404 });
    }

    if (channelScope && existing.channelId !== channelScope) {
      return NextResponse.json({ success: false, error: "Post not found" }, { status: 404 });
    }

    const post = await prisma.post.update({
      where: { id },
      data: {
        title: parsed.data.title,
        slug: parsed.data.slug,
        body: parsed.data.body,
        published: parsed.data.published,
        channelId: channelScope ?? (parsed.data.channelId || null),
      },
    });

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
  const organizationScope = getOrganizationScope(currentUser);
  const channelScope = getChannelScope(currentUser);

  try {
    const existing = await prisma.post.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ success: false, error: "Post not found" }, { status: 404 });
    }

    if (existing.organizationId !== organizationScope) {
      return NextResponse.json({ success: false, error: "Post not found" }, { status: 404 });
    }

    if (channelScope && existing.channelId !== channelScope) {
      return NextResponse.json({ success: false, error: "Post not found" }, { status: 404 });
    }

    await prisma.post.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete post";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
