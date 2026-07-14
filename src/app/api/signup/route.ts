import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/session";
import { signupSchema } from "@/lib/validation";
import { slugify } from "@/lib/slugify";

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const parsed = signupSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const existingUser = await prisma.user.findUnique({ where: { email: parsed.data.email } });

  if (existingUser) {
    return NextResponse.json(
      { success: false, error: "An account with this email already exists" },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const baseSlug = slugify(parsed.data.organizationName) || "store";

  try {
    const owner = await prisma.$transaction(async (tx) => {
      let slug = baseSlug;
      let suffix = 1;

      while (await tx.organization.findUnique({ where: { slug } })) {
        suffix += 1;
        slug = `${baseSlug}-${suffix}`;
      }

      const organization = await tx.organization.create({
        data: { name: parsed.data.organizationName, slug },
      });

      return tx.user.create({
        data: {
          email: parsed.data.email,
          passwordHash,
          role: "OWNER",
          organizationId: organization.id,
        },
      });
    });

    const session = await getAdminSession();
    session.userId = owner.id;
    await session.save();

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create your store";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
