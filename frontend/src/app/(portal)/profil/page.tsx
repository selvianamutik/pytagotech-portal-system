import type { Metadata } from "next";

import { ProfileView } from "@/components/auth/profile-view";

export const metadata: Metadata = {
  title: "Profil — Pytagotech Portal",
  description: "Profil akun dan manajemen sesi portal Anda.",
};

export default function ProfilePage() {
  return (
    <div className="p-4 sm:p-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Profil</h1>
        <p className="text-sm text-muted-foreground">
          Data akun Anda dan kelola sesi masuk.
        </p>
      </div>
      <ProfileView />
    </div>
  );
}