import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/session";
import { setupSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const existingUserCount = await prisma.user.count();

  if (existingUserCount > 0) {
    return NextResponse.json(
      { success: false, error: "Setup has already been completed" },
      { status: 403 }
    );
  }

  const body: unknown = await request.json().catch(() => null);
  const parsed = setupSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  const owner = await prisma.user.create({
    data: {
      email: parsed.data.email,
      passwordHash,
      role: "OWNER",
    },
  });

  const session = await getAdminSession();
  session.userId = owner.id;
  await session.save();

  return NextResponse.json({ success: true });
}
