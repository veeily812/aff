import Link from "next/link";

export default function SiteHeader() {
  return (
    <header className="glass-card sticky top-0 z-10 border-x-0 border-t-0">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-5">
        <Link href="/" className="gradient-text text-lg font-bold tracking-tight">
          The Affiliate Blog
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/signup"
            className="text-sm text-purple-300 transition-colors hover:text-purple-200"
          >
            Create your store
          </Link>
          <Link
            href="/admin/login"
            className="text-sm text-white/50 transition-colors hover:text-white"
          >
            Sign in
          </Link>
        </div>
      </div>
    </header>
  );
}
