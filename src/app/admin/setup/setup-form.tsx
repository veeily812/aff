"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function SetupForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const result: { success: boolean; error?: string } = await response.json();

      if (!result.success) {
        setError(result.error ?? "Setup failed");
        return;
      }

      router.push("/admin/products");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="glass-card animate-fade-in-up w-full max-w-sm space-y-4 rounded-2xl p-8"
    >
      <div>
        <h1 className="gradient-text text-xl font-bold">Create Owner Account</h1>
        <p className="mt-1 text-sm text-black/50">
          This is a one-time setup. Once created, this account has full control over the site.
        </p>
      </div>

      <div className="space-y-1">
        <label htmlFor="email" className="text-sm font-medium text-black/70">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-lg border-2 border-black bg-white px-3 py-2 text-sm text-black focus:border-violet-600 focus:outline-none focus:ring-2 focus:ring-violet-600/30"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="password" className="text-sm font-medium text-black/70">
          Password
        </label>
        <input
          id="password"
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-lg border-2 border-black bg-white px-3 py-2 text-sm text-black focus:border-violet-600 focus:outline-none focus:ring-2 focus:ring-violet-600/30"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="confirmPassword" className="text-sm font-medium text-black/70">
          Confirm Password
        </label>
        <input
          id="confirmPassword"
          type="password"
          required
          minLength={8}
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          className="w-full rounded-lg border-2 border-black bg-white px-3 py-2 text-sm text-black focus:border-violet-600 focus:outline-none focus:ring-2 focus:ring-violet-600/30"
        />
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="gradient-button w-full rounded-lg px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
      >
        {isSubmitting ? "Creating..." : "Create Owner Account"}
      </button>
    </form>
  );
}
