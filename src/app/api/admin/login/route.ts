import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { getAdminSession } from "@/lib/session";

const loginSchema = z.object({
  password: z.string().min(1),
});

export async function POST(request: Request) {
  const passwordHash = process.env.ADMIN_PASSWORD_HASH;

  if (!passwordHash) {
    return NextResponse.json(
      { success: false, error: "Admin password is not configured" },
      { status: 500 }
    );
  }

  const body: unknown = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Password is required" },
      { status: 400 }
    );
  }

  const isValid = await bcrypt.compare(parsed.data.password, passwordHash);

  if (!isValid) {
    return NextResponse.json(
      { success: false, error: "Incorrect password" },
      { status: 401 }
    );
  }

  const session = await getAdminSession();
  session.isAdmin = true;
  await session.save();

  return NextResponse.json({ success: true });
}
