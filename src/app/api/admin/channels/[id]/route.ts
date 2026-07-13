import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, canManageChannels } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const currentUser = await getCurrentUser();

  if (!currentUser || !canManageChannels(currentUser.role)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const assignedUserCount = await prisma.user.count({ where: { channelId: id } });

  if (assignedUserCount > 0) {
    return NextResponse.json(
      {
        success: false,
        error: "This channel has users assigned to it. Reassign or delete those users first.",
      },
      { status: 409 }
    );
  }

  try {
    await prisma.channel.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete channel";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
