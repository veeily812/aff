import { NextResponse } from "next/server";
import { z } from "zod";
import {
  googleSheetsUrlToCsvExportUrl,
  parseCsvText,
  parseXlsxBuffer,
} from "@/lib/spreadsheet-import";

const sheetUrlSchema = z.object({
  sheetUrl: z.string().trim().url(),
});

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  try {
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file");

      if (!(file instanceof File) || file.size === 0) {
        return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
      }

      const isCsv = file.name.toLowerCase().endsWith(".csv") || file.type === "text/csv";
      const rows = isCsv
        ? parseCsvText(await file.text())
        : await parseXlsxBuffer(await file.arrayBuffer());

      return NextResponse.json({ success: true, data: rows });
    }

    const body: unknown = await request.json().catch(() => null);
    const parsed = sheetUrlSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "A valid Google Sheets URL is required" },
        { status: 400 }
      );
    }

    const csvUrl = googleSheetsUrlToCsvExportUrl(parsed.data.sheetUrl);

    if (!csvUrl) {
      return NextResponse.json(
        { success: false, error: "That doesn't look like a Google Sheets URL" },
        { status: 400 }
      );
    }

    const response = await fetch(csvUrl);

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Couldn't fetch that sheet. Make sure it's shared as \"Anyone with the link\" or published to the web.",
        },
        { status: 400 }
      );
    }

    const text = await response.text();
    const rows = parseCsvText(text);

    return NextResponse.json({ success: true, data: rows });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to parse spreadsheet";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
