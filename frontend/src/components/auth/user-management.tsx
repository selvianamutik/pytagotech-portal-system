"use client";

import { useEffect, useState } from "react";
import { PencilIcon, PlusIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  createUser,
  listUsers,
  setUserActive,
  updateUserRoles,
} from "@/services/auth";
import { useAuthStore } from "@/store/auth";
import { PORTAL_ROLES, type PortalUser, type UserRole } from "@/types/auth";

function RoleCheckboxes({
  selected,
  onChange,
}: {
  selected: UserRole[];
  onChange: (roles: UserRole[]) => void;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">Role (bisa lebih dari satu)</legend>
      <div className="grid gap-2">
        {PORTAL_ROLES.map((role) => (
          <label key={role} className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="size-4 accent-primary"
              checked={selected.includes(role)}
              onChange={(event) => {
                if (event.target.checked) {
                  onChange([...selected, role]);
                } else {
                  onChange(selected.filter((item) => item !== role));
                }
              }}
            />
            {role}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/**
 * Tabel manajemen user untuk Super Admin (US-002):
 * buat user, ubah role (multi-role), nonaktifkan/aktifkan kembali.
 */
export function UserManagement() {
  const currentUser = useAuthStore((state) => state.user);
  const initialize = useAuthStore((state) => state.initialize);

  const [users, setUsers] = useState<PortalUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRoles, setNewRoles] = useState<UserRole[]>([]);

  const [editTarget, setEditTarget] = useState<PortalUser | null>(null);
  const [editRoles, setEditRoles] = useState<UserRole[]>([]);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  async function refresh() {
    setLoading(true);
    setLoadError(null);
    const { data, error } = await listUsers();
    setLoading(false);
    if (error || !data) {
      setLoadError(error ?? "Gagal memuat daftar user.");
      return;
    }
    setUsers(data);
  }

  useEffect(() => {
    let cancelled = false;
    void listUsers().then(({ data, error }) => {
      if (cancelled) {
        return;
      }
      if (error || !data) {
        setLoadError(error ?? "Gagal memuat daftar user.");
      } else {
        setUsers(data);
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setActionError(null);
    const { data, error } = await createUser({
      name: newName,
      email: newEmail,
      roles: newRoles,
    });
    setPending(false);
    if (error || !data) {
      setActionError(error ?? "Gagal membuat user.");
      return;
    }
    setCreateOpen(false);
    setNewName("");
    setNewEmail("");
    setNewRoles([]);
    await refresh();
  }

  async function handleEditRoles(event: React.FormEvent) {
    event.preventDefault();
    if (!editTarget) {
      return;
    }
    setPending(true);
    setActionError(null);
    const { data, error } = await updateUserRoles(editTarget.id, editRoles);
    setPending(false);
    if (error || !data) {
      setActionError(error ?? "Gagal mengubah role.");
      return;
    }
    setEditTarget(null);
    await refresh();
  }

  async function handleToggleActive(target: PortalUser) {
    setPending(true);
    setActionError(null);
    const { error } = await setUserActive(
      target.id,
      !target.isActive,
      currentUser?.id
    );
    setPending(false);
    if (error) {
      setActionError(error);
      return;
    }
    await refresh();
  }

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
        <p className="text-sm text-muted-foreground">Memuat daftar user...</p>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Daftar user belum tersedia</CardTitle>
            <CardDescription>{loadError}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button type="button" onClick={() => void refresh()}>
              Muat ulang
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Pengaturan · Super Admin</p>
          <h1 className="mt-1 text-2xl font-bold">Manajemen User</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Undang user baru, atur role (satu user bisa banyak role), dan
            nonaktifkan akun yang sudah tidak aktif.
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger
            render={
              <Button type="button">
                <PlusIcon aria-hidden="true" /> Tambah user
              </Button>
            }
          />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Undang user baru</DialogTitle>
              <DialogDescription>
                User baru langsung aktif. Minta user memakai Lupa kata sandi
                di halaman masuk untuk mengatur kata sandinya sendiri.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="new-name" className="text-sm font-medium">
                  Nama
                </label>
                <Input
                  id="new-name"
                  placeholder="Nama lengkap"
                  value={newName}
                  onChange={(event) => setNewName(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="new-email" className="text-sm font-medium">
                  Email
                </label>
                <Input
                  id="new-email"
                  type="email"
                  placeholder="nama@pytagotech.test"
                  value={newEmail}
                  onChange={(event) => setNewEmail(event.target.value)}
                  required
                />
              </div>
              <RoleCheckboxes selected={newRoles} onChange={setNewRoles} />
              {actionError ? (
                <p role="alert" className="text-sm text-destructive">
                  {actionError}
                </p>
              ) : null}
              <DialogFooter>
                <Button type="submit" disabled={pending}>
                  {pending ? "Menyimpan..." : "Simpan"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {actionError && !createOpen && !editTarget ? (
        <p role="alert" className="mb-4 text-sm text-destructive">
          {actionError}
        </p>
      ) : null}

      <Card>
        <CardContent className="p-0">
          {users.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">
              Belum ada user. Tambahkan user pertama lewat tombol di atas.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="px-4">Nama</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="px-4 font-medium">{user.name}</TableCell>
                    <TableCell className="font-mono text-xs">{user.email}</TableCell>
                    <TableCell>
                      <div className="flex max-w-64 flex-wrap gap-1">
                        {user.roles.map((role) => (
                          <Badge key={role} variant="secondary">
                            {role}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.isActive ? "default" : "outline"}>
                        {user.isActive ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={pending}
                          onClick={() => {
                            setEditTarget(user);
                            setEditRoles([...user.roles]);
                            setActionError(null);
                          }}
                        >
                          <PencilIcon aria-hidden="true" /> Role
                        </Button>
                        <Button
                          type="button"
                          variant={user.isActive ? "destructive" : "secondary"}
                          size="sm"
                          disabled={pending || currentUser?.id === user.id}
                          title={
                            currentUser?.id === user.id
                              ? "Tidak dapat menonaktifkan akun sendiri"
                              : undefined
                          }
                          onClick={() => void handleToggleActive(user)}
                        >
                          {user.isActive ? "Nonaktifkan" : "Aktifkan"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={editTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEditTarget(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ubah role — {editTarget?.name}</DialogTitle>
            <DialogDescription>
              Super Admin terakhir yang aktif tidak dapat dicabut role-nya.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditRoles} className="space-y-4">
            <RoleCheckboxes selected={editRoles} onChange={setEditRoles} />
            {actionError ? (
              <p role="alert" className="text-sm text-destructive">
                {actionError}
              </p>
            ) : null}
            <DialogFooter>
              <Button type="submit" disabled={pending}>
                {pending ? "Menyimpan..." : "Simpan role"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}
