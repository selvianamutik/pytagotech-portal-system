import type { Metadata } from "next";

import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Masuk — Pytagotech Portal",
  description: "Masuk ke portal dengan email dan kata sandi.",
};

export default function LoginPage() {
  return <LoginForm />;
}
