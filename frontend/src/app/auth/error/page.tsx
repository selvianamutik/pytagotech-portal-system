import Link from "next/link";
import { TriangleAlertIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const REASONS: Record<string, { title: string; message: string }> = {
  "tautan-kedaluwarsa": {
    title: "Tautan tidak valid",
    message:
      "Tautan ini sudah kedaluwarsa, sudah pernah dipakai, atau tidak lengkap. " +
      "Tautan email hanya berlaku sekali — minta yang baru dan klik satu kali.",
  },
};

/**
 * Halaman error auth khusus (US-002): terpisah dari form login agar fokus
 * pada masalah dan langkah pemulihan. Dicapai dari /auth/confirm yang gagal.
 */
export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;
  const content =
    reason && REASONS[reason]
      ? REASONS[reason]
      : {
          title: "Terjadi kendala autentikasi",
          message:
            "Tautan atau sesi autentikasi tidak valid. Coba lagi atau minta tautan baru.",
        };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="items-center">
          <div className="flex size-11 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <TriangleAlertIcon aria-hidden="true" />
          </div>
          <CardTitle>{content.title}</CardTitle>
          <CardDescription>{content.message}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Button nativeButton={false} render={<Link href="/login" />}>
            Minta tautan baru / masuk
          </Button>
          <Button nativeButton={false} variant="outline" render={<Link href="/" />}>
            Ke beranda
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
