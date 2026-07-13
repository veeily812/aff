import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/session";
import { loginSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "A valid email and password are required" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });

  if (!user) {
    return NextResponse.json(
      { success: false, error: "Incorrect email or password" },
      { status: 401 }
    );
  }

  const isValid = await bcrypt.compare(parsed.data.password, user.passwordHash);

  if (!isValid) {
    return NextResponse.json(
      { success: false, error: "Incorrect email or password" },
      { status: 401 }
    );
  }

  const session = await getAdminSession();
  session.userId = user.id;
  await session.save();

  return NextResponse.json({ success: true });
}
