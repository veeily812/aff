import type { ReactNode } from "react";
import { getCurrentUser } from "@/lib/auth";
import AdminNav from "./admin-nav";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const currentUser = await getCurrentUser();

  return (
    <div className="bg-app-gradient min-h-screen">
      <AdminNav role={currentUser?.role ?? null} />
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
