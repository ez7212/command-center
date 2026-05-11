import Link from "next/link";

import { signInWithPassword } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/env";

type LoginPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const error = params?.error;
  const demoMode = !hasSupabaseEnv();

  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-100 px-4 py-10 text-stone-950">
      <section className="w-full max-w-sm rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <p className="text-sm font-medium uppercase tracking-wide text-stone-500">
            Command Center
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            Sign in
          </h1>
        </div>

        {demoMode ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
            Supabase is not configured. The dashboard will use mock Dalya data.
            <Link
              href="/dashboard"
              className="mt-3 block font-medium text-amber-950 underline"
            >
              Continue to demo dashboard
            </Link>
          </div>
        ) : (
          <form action={signInWithPassword} className="space-y-4">
            <label className="block text-sm font-medium">
              Email
              <input
                className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-sm outline-none focus:border-stone-900"
                name="email"
                type="email"
                autoComplete="email"
                required
              />
            </label>
            <label className="block text-sm font-medium">
              Password
              <input
                className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-sm outline-none focus:border-stone-900"
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </label>
            {error ? (
              <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            ) : null}
            <button
              className="w-full rounded-md bg-stone-950 px-3 py-2 text-sm font-medium text-white transition hover:bg-stone-800"
              type="submit"
            >
              Sign in
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
