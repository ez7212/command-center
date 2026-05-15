import Link from "next/link";

import { requireUser, signOut } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/env";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="min-h-screen bg-stone-100 text-stone-950">
      <header className="flex items-center justify-between border-b border-stone-200 bg-white px-4 py-3">
        <Link className="text-sm font-semibold tracking-tight" href="/dashboard">
          Command Center
        </Link>
        <div className="flex items-center gap-3 text-sm">
          {!hasSupabaseEnv() ? (
            <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-950">
              Mock data
            </span>
          ) : null}
          <span className="hidden text-stone-600 sm:inline">
            {user.fullName ?? user.email}
          </span>
          <form action={signOut}>
            <button
              className="rounded-md border border-stone-300 px-3 py-1.5 text-sm font-medium hover:bg-stone-50"
              type="submit"
            >
              Log out
            </button>
          </form>
        </div>
      </header>
      {children}
    </div>
  );
}
