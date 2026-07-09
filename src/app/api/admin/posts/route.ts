import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { postSchema } from "@/lib/validation";

export async function GET() {
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ success: true, data: posts });
}

export async function POST(request: Request) {
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

  const post = await prisma.post.create({ data: parsed.data });

  return NextResponse.json({ success: true, data: post }, { status: 201 });
}
