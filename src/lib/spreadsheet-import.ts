import { Workbook } from "exceljs";
import Papa from "papaparse";
import { productImportRowSchema, type ProductImportRow } from "@/lib/validation";

const HEADER_ALIASES: Record<string, keyof ProductImportRow> = {
  name: "name",
  productname: "name",
  title: "name",
  description: "description",
  desc: "description",
  price: "price",
  affiliateurl: "affiliateUrl",
  affiliatelink: "affiliateUrl",
  affiliate: "affiliateUrl",
  producturl: "affiliateUrl",
  link: "affiliateUrl",
  imageurl: "imageUrl",
  image: "imageUrl",
  imagelink: "imageUrl",
  photo: "imageUrl",
  photourl: "imageUrl",
  picture: "imageUrl",
};

export interface ImportRowResult {
  rowNumber: number;
  raw: Record<string, string>;
  data: ProductImportRow | null;
  errors: string[];
}

function normalizeHeader(header: string): string {
  return header.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function rawRowsToResults(rawRows: Record<string, string>[]): ImportRowResult[] {
  return rawRows.map((raw, index) => {
    const mapped: Partial<Record<keyof ProductImportRow, string>> = {};

    for (const [header, value] of Object.entries(raw)) {
      const field = HEADER_ALIASES[normalizeHeader(header)];
      if (field && value != null && value !== "") {
        mapped[field] = String(value).trim();
      }
    }

    const parsed = productImportRowSchema.safeParse(mapped);

    return {
      rowNumber: index + 2,
      raw,
      data: parsed.success ? parsed.data : null,
      errors: parsed.success ? [] : parsed.error.issues.map((issue) => issue.message),
    };
  });
}

export function parseCsvText(text: string): ImportRowResult[] {
  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
  });

  return rawRowsToResults(result.data);
}

export async function parseXlsxBuffer(arrayBuffer: ArrayBuffer): Promise<ImportRowResult[]> {
  const workbook = new Workbook();
  // exceljs's ambient `Buffer` type (extends ArrayBuffer) conflicts with @types/node's generic
  // Buffer<T> in strict structural checks, even though a real Node Buffer satisfies it at runtime.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await workbook.xlsx.load(Buffer.from(arrayBuffer) as any);
  const worksheet = workbook.worksheets[0];

  if (!worksheet) {
    return [];
  }

  const headerRow = worksheet.getRow(1);
  const headers: string[] = [];
  headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    headers[colNumber] = String(cell.value ?? "").trim();
  });

  const rawRows: Record<string, string>[] = [];

  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) {
      return;
    }

    const raw: Record<string, string> = {};
    row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const header = headers[colNumber];
      if (header) {
        raw[header] = String(cell.value ?? "").trim();
      }
    });

    if (Object.values(raw).some((value) => value !== "")) {
      rawRows.push(raw);
    }
  });

  return rawRowsToResults(rawRows);
}

export function googleSheetsUrlToCsvExportUrl(url: string): string | null {
  const idMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);

  if (!idMatch) {
    return null;
  }

  const gidMatch = url.match(/[?#&]gid=(\d+)/);
  const gid = gidMatch ? gidMatch[1] : "0";

  return `https://docs.google.com/spreadsheets/d/${idMatch[1]}/export?format=csv&gid=${gid}`;
}
