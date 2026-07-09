import type { ReactNode } from "react";
import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-app-gradient flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12">{children}</main>
      <SiteFooter />
    </div>
  );
}
