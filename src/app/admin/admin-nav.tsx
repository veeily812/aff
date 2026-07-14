"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { Role } from "@/lib/permissions";
import { canAccessUsersPage, canManageChannels } from "@/lib/permissions";

interface AdminNavProps {
  role: Role | null;
  storeName: string | null;
  storeSlug: string | null;
}

export default function AdminNav({ role, storeName, storeSlug }: AdminNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/admin/login" || pathname === "/admin/setup") {
    return null;
  }

  const links = [
    { href: "/admin/products", label: "Products" },
    { href: "/admin/posts", label: "Posts" },
    ...(role && canManageChannels(role) ? [{ href: "/admin/channels", label: "Channels" }] : []),
    ...(role && canAccessUsersPage(role) ? [{ href: "/admin/users", label: "Users" }] : []),
  ];

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <nav className="glass-card sticky top-0 z-10 border-x-0 border-t-0">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <div className="flex items-center gap-6">
          <span className="gradient-text max-w-40 truncate font-bold" title={storeName ?? "Admin"}>
            {storeName ?? "Admin"}
          </span>
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={
                pathname.startsWith(link.href)
                  ? "text-sm font-semibold text-white"
                  : "text-sm text-white/50 transition-colors hover:text-white"
              }
            >
              {link.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-5">
          {storeSlug ? (
            <a
              href={`/store/${storeSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-purple-300 transition-colors hover:text-purple-200"
            >
              View my store ↗
            </a>
          ) : null}
          <button
            onClick={handleLogout}
            className="text-sm text-white/50 transition-colors hover:text-white"
          >
            Log out
          </button>
        </div>
      </div>
    </nav>
  );
}
