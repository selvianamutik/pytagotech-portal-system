import type { Metadata } from "next";

import { ClientsManager } from "@/components/clients/clients-manager";

export const metadata: Metadata = {
  title: "Master Klien — Pytagotech Portal",
  description: "Profil klien terstruktur, dibuat dari lead Closing tanpa input ulang.",
};

export default function ClientsPage() {
  return <ClientsManager />;
}
