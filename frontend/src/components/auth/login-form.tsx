"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { requestPasswordReset, updatePassword } from "@/services/auth";
import { useAuthStore } from "@/store/auth";

/**
 * Form masuk + reset kata sandi + status sesi (US-002, FR-1).
 * Seluruh akses data lewat `store/auth` → `services/auth` (Supabase Auth).
 */
export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);
  const authError = useAuthStore((state) => state.error);
  const initialize = useAuthStore((state) => state.initialize);
  const signIn = useAuthStore((state) => state.signIn);
  const signOut = useAuthStore((state) => state.signOut);

  const [mode, setMode] = useState<"login" | "reset" | "update">(() =>
    searchParams.get("recovery") === "1" ? "update" : "login"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  if (status === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-6">
        <p className="text-sm text-muted-foreground">Memuat sesi...</p>
      </main>
    );
  }

  if (status === "authenticated" && user && mode !== "update") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Anda sudah masuk</CardTitle>
            <CardDescription>
              {user.name} · {user.email}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {user.roles.map((role) => (
                <Badge key={role} variant="secondary">
                  {role}
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={() => {
                  void signOut();
                }}
              >
                Keluar
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/")}
              >
                Ke beranda
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    const ok = await signIn({ email, password });
    setPending(false);
    if (ok) {
      router.push("/");
    }
  }

  async function handleUpdate(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setNotice(null);
    setUpdateError(null);
    if (password !== confirmPassword) {
      setPending(false);
      setUpdateError("Konfirmasi kata sandi tidak sama.");
      return;
    }
    const { error } = await updatePassword(password);
    setPending(false);
    if (error) {
      setUpdateError(error);
    } else {
      setPassword("");
      setConfirmPassword("");
      setNotice("Kata sandi diperbarui. Silakan masuk dengan kata sandi baru.");
      setMode("login");
      router.replace("/login");
    }
  }

  const titles = {
    login: "Masuk ke Pytagotech Portal",
    reset: "Reset kata sandi",
    update: "Buat kata sandi baru",
  } as const;
  const descriptions = {
    login: "Gunakan email dan kata sandi akun portal Anda.",
    reset: "Masukkan email akun Anda untuk menerima tautan reset.",
    update: "Tautan reset terverifikasi. Masukkan kata sandi baru Anda.",
  } as const;

  async function handleReset(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setNotice(null);
    setResetError(null);
    const { data, error } = await requestPasswordReset(email);
    setPending(false);
    if (error) {
      setResetError(error);
    } else {
      setNotice(data);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{titles[mode]}</CardTitle>
          <CardDescription>{descriptions[mode]}</CardDescription>
        </CardHeader>
        <CardContent>
          {notice && mode === "login" ? (
            <p role="status" className="mb-4 text-sm text-emerald-700 dark:text-emerald-300">
              {notice}
            </p>
          ) : null}
          {mode === "login" ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="nama@pytagotech.test"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Kata sandi
                </label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Minimal 8 karakter"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </div>
              {authError ? (
                <p role="alert" className="text-sm text-destructive">
                  {authError}
                </p>
              ) : null}
              <Button type="submit" className="w-full" disabled={pending}>
                {pending ? "Memeriksa..." : "Masuk"}
              </Button>
              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  className="text-primary underline-offset-4 hover:underline"
                  onClick={() => {
                    setMode("reset");
                    setNotice(null);
                  }}
                >
                  Lupa kata sandi?
                </button>
                <Link href="/" className="text-muted-foreground hover:underline">
                  Kembali ke beranda
                </Link>
              </div>
              <p className="rounded-lg bg-muted p-3 text-xs leading-5 text-muted-foreground">
                Akun portal dibuat oleh Super Admin di Pengaturan · Pengguna.
                Baru pertama kali masuk? Pakai Lupa kata sandi untuk mengatur
                kata sandi Anda.
              </p>
            </form>
          ) : mode === "reset" ? (
            <form onSubmit={handleReset} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="reset-email" className="text-sm font-medium">
                  Email
                </label>
                <Input
                  id="reset-email"
                  type="email"
                  autoComplete="email"
                  placeholder="nama@pytagotech.test"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>
              {resetError ? (
                <p role="alert" className="text-sm text-destructive">
                  {resetError}
                </p>
              ) : null}
              {notice ? (
                <p role="status" className="text-sm text-emerald-700 dark:text-emerald-300">
                  {notice}
                </p>
              ) : null}
              <Button type="submit" className="w-full" disabled={pending}>
                {pending ? "Mengirim..." : "Kirim tautan reset"}
              </Button>
              <button
                type="button"
                className="text-sm text-primary underline-offset-4 hover:underline"
                onClick={() => setMode("login")}
              >
                Kembali masuk
              </button>
            </form>
          ) : (
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="new-password" className="text-sm font-medium">
                  Kata sandi baru
                </label>
                <Input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Minimal 8 karakter"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="confirm-password" className="text-sm font-medium">
                  Konfirmasi kata sandi baru
                </label>
                <Input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Ulangi kata sandi baru"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                />
              </div>
              {updateError ? (
                <p role="alert" className="text-sm text-destructive">
                  {updateError}
                </p>
              ) : null}
              <Button type="submit" className="w-full" disabled={pending}>
                {pending ? "Menyimpan..." : "Simpan kata sandi"}
              </Button>
              <button
                type="button"
                className="text-sm text-primary underline-offset-4 hover:underline"
                onClick={() => setMode("login")}
              >
                Kembali masuk
              </button>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
