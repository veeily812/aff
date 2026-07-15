"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function NewChannelForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      const result: { success: boolean; error?: string } = await response.json();

      if (!result.success) {
        setError(result.error ?? "Something went wrong");
        return;
      }

      setName("");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="glass-card max-w-lg space-y-3 rounded-2xl p-6">
      <div className="flex items-end gap-2">
        <div className="flex-1 space-y-1">
          <label htmlFor="name" className="text-sm font-medium text-black/70">
            New channel name
          </label>
          <input
            id="name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Electronics"
            className="w-full rounded-lg border-2 border-black bg-white px-3 py-2 text-sm text-black placeholder-black/50 focus:border-violet-600 focus:outline-none focus:ring-2 focus:ring-violet-600/30"
          />
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="gradient-button shrink-0 rounded-lg px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
        >
          {isSubmitting ? "Adding..." : "Add"}
        </button>
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </form>
  );
}
