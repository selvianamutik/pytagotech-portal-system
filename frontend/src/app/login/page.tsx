import { Suspense } from "react";
import type { Metadata } from "next";

import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Masuk — Pytagotech Portal",
  description: "Masuk ke portal dengan email dan kata sandi.",
};

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-background p-6">
          <p className="text-sm text-muted-foreground">Memuat...</p>
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
