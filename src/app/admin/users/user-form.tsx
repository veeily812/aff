"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { Role } from "@/lib/permissions";

interface ChannelOption {
  id: string;
  name: string;
}

interface UserFormValues {
  id?: string;
  email: string;
  role: Role;
  channelId?: string | null;
}

interface UserFormProps {
  initialValues?: UserFormValues;
  assignableRoles: Role[];
  channels: ChannelOption[];
}

const ROLE_LABELS: Record<Role, string> = {
  OWNER: "Owner",
  SECONDARY_ADMIN: "Secondary Admin",
  MANAGER: "Manager",
  STAFF: "Staff",
  CHANNEL_STAFF: "Channel Staff",
};

const inputClass =
  "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 focus:border-purple-400/50 focus:outline-none focus:ring-2 focus:ring-purple-400/20";
const labelClass = "text-sm font-medium text-white/70";

export default function UserForm({ initialValues, assignableRoles, channels }: UserFormProps) {
  const router = useRouter();
  const isEdit = Boolean(initialValues?.id);

  const [email, setEmail] = useState(initialValues?.email ?? "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>(initialValues?.role ?? assignableRoles[0]);
  const [channelId, setChannelId] = useState(initialValues?.channelId ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const url = isEdit ? `/api/admin/users/${initialValues?.id}` : "/api/admin/users";
      const method = isEdit ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          role,
          channelId: role === "CHANNEL_STAFF" ? channelId : "",
          ...(password || !isEdit ? { password } : {}),
        }),
      });

      const result: { success: boolean; error?: string } = await response.json();

      if (!result.success) {
        setError(result.error ?? "Something went wrong");
        return;
      }

      router.push("/admin/users");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="glass-card max-w-lg space-y-4 rounded-2xl p-6">
      <div className="space-y-1">
        <label htmlFor="email" className={labelClass}>
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
        <label htmlFor="password" className={labelClass}>
          Password {isEdit ? "(leave blank to keep current)" : ""}
        </label>
        <input
          id="password"
          type="password"
          required={!isEdit}
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className={inputClass}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="role" className={labelClass}>
          Role
        </label>
        <select
          id="role"
          value={role}
          onChange={(event) => setRole(event.target.value as Role)}
          className={inputClass}
        >
          {assignableRoles.map((option) => (
            <option key={option} value={option} className="bg-slate-900">
              {ROLE_LABELS[option]}
            </option>
          ))}
        </select>
      </div>

      {role === "CHANNEL_STAFF" ? (
        <div className="space-y-1">
          <label htmlFor="channelId" className={labelClass}>
            Channel
          </label>
          <select
            id="channelId"
            required
            value={channelId}
            onChange={(event) => setChannelId(event.target.value)}
            className={inputClass}
          >
            <option value="" className="bg-slate-900">
              Select channel...
            </option>
            {channels.map((channel) => (
              <option key={channel.id} value={channel.id} className="bg-slate-900">
                {channel.name}
              </option>
            ))}
          </select>
          {channels.length === 0 ? (
            <p className="text-xs text-amber-400">
              No channels exist yet — create one on the Channels page first.
            </p>
          ) : null}
        </div>
      ) : null}

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="gradient-button rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {isSubmitting ? "Saving..." : isEdit ? "Save Changes" : "Create User"}
      </button>
    </form>
  );
}
