import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { productImportRowSchema } from "@/lib/validation";

const commitSchema = z.object({
  rows: z.array(productImportRowSchema).min(1).max(500),
});

export async function POST(request: Request) {
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
