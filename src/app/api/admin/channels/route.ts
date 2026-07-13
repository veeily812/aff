import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, canManageChannels } from "@/lib/auth";
import { channelSchema } from "@/lib/validation";

export async function GET() {
  const currentUser = await getCurrentUser();

  if (!currentUser || !canManageChannels(currentUser.role)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const channels = await prisma.channel.findMany({
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ success: true, data: channels });
}

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();

  if (!currentUser || !canManageChannels(currentUser.role)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const body: unknown = await request.json().catch(() => null);
  const parsed = channelSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const existing = await prisma.channel.findUnique({ where: { name: parsed.data.name } });

  if (existing) {
    return NextResponse.json(
      { success: false, error: "A channel with this name already exists" },
      { status: 409 }
    );
  }

  const channel = await prisma.channel.create({ data: { name: parsed.data.name } });

  return NextResponse.json({ success: true, data: channel }, { status: 201 });
}
