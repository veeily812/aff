"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ImportRowResult } from "@/lib/spreadsheet-import";

export default function ImportForm() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [sheetUrl, setSheetUrl] = useState("");
  const [rows, setRows] = useState<ImportRowResult[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  async function handlePreview() {
    setError(null);
    setRows([]);
    setIsParsing(true);

    try {
      let response: Response;

      if (file) {
        const formData = new FormData();
        formData.set("file", file);
        response = await fetch("/api/admin/products/import/parse", {
          method: "POST",
          body: formData,
        });
      } else if (sheetUrl.trim()) {
        response = await fetch("/api/admin/products/import/parse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sheetUrl: sheetUrl.trim() }),
        });
      } else {
        setError("Choose a file or paste a Google Sheets link");
        return;
      }

      const result: { success: boolean; data?: ImportRowResult[]; error?: string } =
        await response.json();

      if (!result.success || !result.data) {
        setError(result.error ?? "Failed to parse spreadsheet");
        return;
      }

      setRows(result.data);
      setSelected(new Set(result.data.filter((row) => row.data).map((row) => row.rowNumber)));
    } catch {
      setError("Something went wrong while parsing. Please try again.");
    } finally {
      setIsParsing(false);
    }
  }

  function toggleRow(rowNumber: number) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(rowNumber)) {
        next.delete(rowNumber);
      } else {
        next.add(rowNumber);
      }
      return next;
    });
  }

  async function handleImport() {
    const validRows = rows.filter((row) => row.data && selected.has(row.rowNumber));

    if (validRows.length === 0) {
      setError("Select at least one valid row to import");
      return;
    }

    setError(null);
    setIsImporting(true);

    try {
      const response = await fetch("/api/admin/products/import/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: validRows.map((row) => row.data) }),
      });

      const result: { success: boolean; error?: string } = await response.json();

      if (!result.success) {
        setError(result.error ?? "Import failed");
        return;
      }

      router.push("/admin/products");
      router.refresh();
    } catch {
      setError("Something went wrong during import. Please try again.");
    } finally {
      setIsImporting(false);
    }
  }

  const validCount = rows.filter((row) => row.data).length;

  return (
    <div className="space-y-6">
      <h1 className="gradient-text text-2xl font-bold">Import Products</h1>

      <div className="glass-card max-w-xl space-y-4 rounded-2xl p-6">
        <div className="space-y-1">
          <label htmlFor="file" className="text-sm font-medium text-white/70">
            Upload Excel or CSV file
          </label>
          <input
            id="file"
            type="file"
            accept=".xlsx,.csv,text/csv"
            onChange={(event) => {
              setFile(event.target.files?.[0] ?? null);
              setSheetUrl("");
            }}
            className="w-full text-sm text-white/70"
          />
        </div>

        <div className="flex items-center gap-3 text-xs text-white/30">
          <div className="h-px flex-1 bg-white/10" />
          OR
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <div className="space-y-1">
          <label htmlFor="sheetUrl" className="text-sm font-medium text-white/70">
            Public Google Sheets link
          </label>
          <input
            id="sheetUrl"
            value={sheetUrl}
            onChange={(event) => {
              setSheetUrl(event.target.value);
              setFile(null);
            }}
            placeholder="https://docs.google.com/spreadsheets/d/..."
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 focus:border-purple-400/50 focus:outline-none focus:ring-2 focus:ring-purple-400/20"
          />
          <p className="text-xs text-white/40">
            Sheet must be shared as &quot;Anyone with the link&quot; or published to the web.
          </p>
        </div>

        <p className="text-xs text-white/40">
          Expected columns: <code>name</code>, <code>description</code>, <code>price</code>{" "}
          (optional), <code>category</code> (optional), <code>channel</code> (optional — created
          automatically if it doesn&apos;t exist yet), <code>affiliateUrl</code>,{" "}
          <code>imageUrl</code> (a direct link to an image).{" "}
          <a
            href="/templates/product-import-template.xlsx"
            download
            className="text-purple-300 underline hover:text-purple-200"
          >
            Download sample template
          </a>
        </p>

        {error ? <p className="text-sm text-red-400">{error}</p> : null}

        <button
          onClick={handlePreview}
          disabled={isParsing || (!file && !sheetUrl.trim())}
          className="gradient-button rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {isParsing ? "Parsing..." : "Preview"}
        </button>
      </div>

      {rows.length > 0 ? (
        <div className="animate-fade-in-up space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-white/60">
              {validCount} of {rows.length} rows are valid. {selected.size} selected.
            </p>
            <button
              onClick={handleImport}
              disabled={isImporting || selected.size === 0}
              className="gradient-button rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {isImporting ? "Importing..." : `Import ${selected.size} Product(s)`}
            </button>
          </div>

          <div className="glass-card overflow-x-auto rounded-2xl">
            <table className="min-w-full divide-y divide-white/10 text-sm">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-3 py-2 text-left" />
                  <th className="px-3 py-2 text-left font-medium text-white/60">Row</th>
                  <th className="px-3 py-2 text-left font-medium text-white/60">Name</th>
                  <th className="px-3 py-2 text-left font-medium text-white/60">Price</th>
                  <th className="px-3 py-2 text-left font-medium text-white/60">Category</th>
                  <th className="px-3 py-2 text-left font-medium text-white/60">Channel</th>
                  <th className="px-3 py-2 text-left font-medium text-white/60">Affiliate URL</th>
                  <th className="px-3 py-2 text-left font-medium text-white/60">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {rows.map((row) => (
                  <tr key={row.rowNumber} className={row.data ? "" : "bg-red-500/10"}>
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        disabled={!row.data}
                        checked={selected.has(row.rowNumber)}
                        onChange={() => toggleRow(row.rowNumber)}
                      />
                    </td>
                    <td className="px-3 py-2 text-white/50">{row.rowNumber}</td>
                    <td className="px-3 py-2 text-white">
                      {row.data?.name ?? row.raw.name ?? "-"}
                    </td>
                    <td className="px-3 py-2 text-white/50">{row.data?.price || "-"}</td>
                    <td className="px-3 py-2 text-white/50">{row.data?.category || "-"}</td>
                    <td className="px-3 py-2 text-white/50">{row.data?.channel || "-"}</td>
                    <td className="max-w-xs truncate px-3 py-2 text-white/50">
                      {row.data?.affiliateUrl ?? "-"}
                    </td>
                    <td className="px-3 py-2">
                      {row.data ? (
                        <span className="text-emerald-400">Valid</span>
                      ) : (
                        <span className="text-red-400">{row.errors.join(", ")}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
