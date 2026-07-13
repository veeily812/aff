import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, canAccessUsersPage, canManageTargetRole } from "@/lib/auth";
import { userUpdateSchema } from "@/lib/validation";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  const currentUser = await getCurrentUser();

  if (!currentUser || !canAccessUsersPage(currentUser.role)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, role: true, createdAt: true },
  });

  if (!user) {
    return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: user });
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const currentUser = await getCurrentUser();

  if (!currentUser || !canAccessUsersPage(currentUser.role)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body: unknown = await request.json().catch(() => null);
  const parsed = userUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({ where: { id } });

  if (!existing) {
    return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
  }

  if (
    !canManageTargetRole(currentUser.role, existing.role) ||
    !canManageTargetRole(currentUser.role, parsed.data.role)
  ) {
    return NextResponse.json(
      { success: false, error: "You are not allowed to manage this user" },
      { status: 403 }
    );
  }

  if (parsed.data.email !== existing.email) {
    const emailOwner = await prisma.user.findUnique({ where: { email: parsed.data.email } });

    if (emailOwner) {
      return NextResponse.json(
        { success: false, error: "A user with this email already exists" },
        { status: 409 }
      );
    }
  }

  const user = await prisma.user.update({
    where: { id },
    data: {
      email: parsed.data.email,
      role: parsed.data.role,
      ...(parsed.data.password ? { passwordHash: await bcrypt.hash(parsed.data.password, 12) } : {}),
    },
    select: { id: true, email: true, role: true, createdAt: true },
  });

  return NextResponse.json({ success: true, data: user });
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const currentUser = await getCurrentUser();

  if (!currentUser || !canAccessUsersPage(currentUser.role)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  if (id === currentUser.id) {
    return NextResponse.json(
      { success: false, error: "You cannot delete your own account" },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({ where: { id } });

  if (!existing) {
    return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
  }

  if (!canManageTargetRole(currentUser.role, existing.role)) {
    return NextResponse.json(
      { success: false, error: "You are not allowed to manage this user" },
      { status: 403 }
    );
  }

  await prisma.user.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
