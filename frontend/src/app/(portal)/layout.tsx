import { PortalHeader } from "@/components/layout/portal-header";
import { PortalSidebar } from "@/components/layout/portal-sidebar";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboardSnapshot } from "@/services/dashboard";

/**
 * Layout global portal: sidebar + header dipakai semua halaman
 * modul (dipindah dari halaman beranda US-001 atas permintaan pemilik).
 * Halaman auth (/login) dan /403 tetap di luar grup ini.
 */
export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const { data } = await getDashboardSnapshot();

  if (!data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-6">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Portal belum tersedia</CardTitle>
            <CardDescription>
              Data navigasi tidak bisa dimuat. Coba muat ulang halaman.
            </CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  const initials = data.currentUser.name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PortalSidebar navigation={data.navigation} />
      <div className="xl:pl-72">
        <PortalHeader
          user={{
            name: data.currentUser.name,
            email: data.currentUser.email,
            roles: data.currentUser.roles,
            initials,
          }}
        />
        {children}
      </div>
    </div>
  );
}
