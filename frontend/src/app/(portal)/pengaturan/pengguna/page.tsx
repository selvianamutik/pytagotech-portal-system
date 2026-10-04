import type { Metadata } from "next";

import { RequireRole } from "@/components/auth/require-role";
import { UserManagement } from "@/components/auth/user-management";

export const metadata: Metadata = {
  title: "Manajemen User — Pytagotech Portal",
  description: "Kelola user portal dan role mereka (Super Admin).",
};

export default function UsersPage() {
  return (
    <RequireRole allowed={["Super Admin"]}>
      <UserManagement />
    </RequireRole>
  );
}
