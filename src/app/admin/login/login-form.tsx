"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const result: { success: boolean; error?: string } = await response.json();

      if (!result.success) {
        setError(result.error ?? "Login failed");
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
    <div className="-m-4 -my-8 flex min-h-screen items-center justify-center px-4 sm:-m-8">
      <form
        onSubmit={handleSubmit}
        className="glass-card animate-fade-in-up w-full max-w-sm space-y-4 rounded-2xl p-8"
      >
        <h1 className="gradient-text text-xl font-bold">Admin Login</h1>

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
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-lg border-2 border-black bg-white px-3 py-2 text-sm text-black focus:border-violet-600 focus:outline-none focus:ring-2 focus:ring-violet-600/30"
          />
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="gradient-button w-full rounded-lg px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
        >
          {isSubmitting ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}
