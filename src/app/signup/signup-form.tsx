"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const inputClass =
  "w-full rounded-lg border-2 border-black bg-white px-3 py-2 text-sm text-black placeholder-black/50 focus:border-violet-600 focus:outline-none focus:ring-2 focus:ring-violet-600/30";

export default function SignupForm() {
  const router = useRouter();
  const [organizationName, setOrganizationName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationName, email, password }),
      });

      const result: { success: boolean; error?: string } = await response.json();

      if (!result.success) {
        setError(result.error ?? "Signup failed");
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
    <div className="bg-app-gradient flex min-h-screen items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="glass-card animate-fade-in-up w-full max-w-sm space-y-4 rounded-2xl p-8"
      >
        <div>
          <h1 className="gradient-text text-xl font-bold">Create your store</h1>
          <p className="mt-2 text-sm text-black/50">
            Your own space for affiliate products and posts — separate from everyone else&apos;s.
          </p>
        </div>

        <div className="space-y-1">
          <label htmlFor="organizationName" className="text-sm font-medium text-black/70">
            Store name
          </label>
          <input
            id="organizationName"
            required
            maxLength={100}
            value={organizationName}
            onChange={(event) => setOrganizationName(event.target.value)}
            placeholder="Vy's Beauty Picks"
            className={inputClass}
          />
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
            className={inputClass}
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
            placeholder="At least 8 characters"
            className={inputClass}
          />
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="gradient-button w-full rounded-lg px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
        >
          {isSubmitting ? "Creating your store..." : "Create my store"}
        </button>

        <p className="text-center text-sm text-black/50">
          Already have an account?{" "}
          <Link href="/admin/login" className="text-violet-700 hover:text-violet-500">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
