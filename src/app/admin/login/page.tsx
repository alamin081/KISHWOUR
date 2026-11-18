import type { Metadata } from "next";

import { BrandLogo } from "@/components/shared/brand-logo";

import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function AdminLoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm rounded-xl border bg-card p-8 shadow-sm">
        {/* Above the fold and the largest element: load it eagerly (LCP). */}
        <BrandLogo height={44} priority />
        <h1 className="mt-6 text-2xl">Admin sign in</h1>
        <p className="mt-1 mb-6 text-sm text-muted-foreground">Staff access only.</p>
        <LoginForm />
      </div>
    </main>
  );
}
