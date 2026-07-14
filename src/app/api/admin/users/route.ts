import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, canAccessUsersPage, canManageTargetRole, getOrganizationScope } from "@/lib/auth";
import { userCreateSchema } from "@/lib/validation";

export async function GET() {
  const currentUser = await getCurrentUser();

  if (!currentUser || !canAccessUsersPage(currentUser.role)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const organizationScope = getOrganizationScope(currentUser);

  const users = await prisma.user.findMany({
    where: { organizationId: organizationScope },
    orderBy: { createdAt: "desc" },
    select: { id: true, email: true, role: true, createdAt: true, channel: { select: { name: true } } },
  });

  return NextResponse.json({ success: true, data: users });
}

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();

  if (!currentUser || !canAccessUsersPage(currentUser.role)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const body: unknown = await request.json().catch(() => null);
  const parsed = userCreateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  if (!canManageTargetRole(currentUser.role, parsed.data.role)) {
    return NextResponse.json(
      { success: false, error: "You are not allowed to create a user with that role" },
      { status: 403 }
    );
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });

  if (existing) {
    return NextResponse.json(
      { success: false, error: "A user with this email already exists" },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const organizationScope = getOrganizationScope(currentUser);

  const user = await prisma.user.create({
    data: {
      email: parsed.data.email,
      passwordHash,
      role: parsed.data.role,
      channelId: parsed.data.role === "CHANNEL_STAFF" ? parsed.data.channelId || null : null,
      organizationId: organizationScope,
    },
    select: { id: true, email: true, role: true, createdAt: true },
  });

  return NextResponse.json({ success: true, data: user }, { status: 201 });
}
