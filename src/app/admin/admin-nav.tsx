"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { Role } from "@/lib/permissions";
import { canAccessUsersPage, canManageChannels } from "@/lib/permissions";

interface AdminNavProps {
  role: Role | null;
}

export default function AdminNav({ role }: AdminNavProps) {
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
          <span className="gradient-text font-bold">Admin</span>
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
        <button
          onClick={handleLogout}
          className="text-sm text-white/50 transition-colors hover:text-white"
        >
          Log out
        </button>
      </div>
    </nav>
  );
}
