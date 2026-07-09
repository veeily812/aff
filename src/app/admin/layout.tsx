import type { ReactNode } from "react";
import AdminNav from "./admin-nav";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-app-gradient min-h-screen">
      <AdminNav />
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
