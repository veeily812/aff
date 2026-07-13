"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteChannelButton({ channelId }: { channelId: string }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (!confirm("Delete this channel? This cannot be undone.")) {
      return;
    }

    setError(null);
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/admin/channels/${channelId}`, { method: "DELETE" });
      const result: { success: boolean; error?: string } = await response.json();

      if (!result.success) {
        setError(result.error ?? "Failed to delete channel");
        return;
      }

      router.refresh();
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className="text-sm text-red-400 transition-colors hover:text-red-300 disabled:opacity-50"
      >
        {isDeleting ? "Deleting..." : "Delete"}
      </button>
      {error ? <p className="max-w-[200px] text-right text-xs text-red-400">{error}</p> : null}
    </div>
  );
}
