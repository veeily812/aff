import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { productImportRowSchema } from "@/lib/validation";
import { getCurrentUser, canImportContent } from "@/lib/auth";

const commitSchema = z.object({
  rows: z.array(productImportRowSchema).min(1).max(500),
});

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();

  if (!currentUser || !canImportContent(currentUser.role)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const body: unknown = await request.json().catch(() => null);
  const parsed = commitSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? "Invalid import payload" },
      { status: 400 }
    );
  }

  const result = await prisma.product.createMany({
    data: parsed.data.rows.map((row) => ({
      name: row.name,
      description: row.description,
      price: row.price || null,
      category: row.category || null,
      affiliateUrl: row.affiliateUrl,
      imageUrl: row.imageUrl,
    })),
  });

  return NextResponse.json({ success: true, data: { created: result.count } });
}
