import type { Metadata } from "next";

import { AssetManager } from "@/components/sosmed/asset-manager";

export const metadata: Metadata = {
  title: "Asset Library — Pytagotech Portal",
  description: "Katalog aset dengan info lisensi dan masa berlaku.",
};

export default function AssetsPage() {
  return <AssetManager />;
}
