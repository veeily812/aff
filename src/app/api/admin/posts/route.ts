import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { postSchema } from "@/lib/validation";
import { getCurrentUser, getChannelScope } from "@/lib/auth";

export async function GET() {
  const currentUser = await getCurrentUser();
  const channelScope = currentUser ? getChannelScope(currentUser) : null;

  const posts = await prisma.post.findMany({
    where: channelScope ? { channelId: channelScope } : {},
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ success: true, data: posts });
}

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const body: unknown = await request.json().catch(() => null);
  const parsed = postSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const existing = await prisma.post.findUnique({ where: { slug: parsed.data.slug } });

  if (existing) {
    return NextResponse.json(
      { success: false, error: "A post with this slug already exists" },
      { status: 409 }
    );
  }

  const channelScope = getChannelScope(currentUser);

  const post = await prisma.post.create({
    data: {
      title: parsed.data.title,
      slug: parsed.data.slug,
      body: parsed.data.body,
      published: parsed.data.published,
      channelId: channelScope ?? (parsed.data.channelId || null),
    },
  });

  return NextResponse.json({ success: true, data: post }, { status: 201 });
}
