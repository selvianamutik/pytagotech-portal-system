"use client";

import { useEffect, useState } from "react";
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  createMasterOption,
  createTeamMember,
  deleteMasterOption,
  deleteTeamMember,
  listAllMasterOptions,
  listTeamMembers,
  setMasterOptionActive,
  updateMasterOption,
  updateTeamMember,
} from "@/services/master-data";
import type {
  MasterOption,
  MasterOptionCategory,
  TeamMember,
  TeamMemberStatus,
} from "@/types/master-data";
import {
  MASTER_OPTION_CATEGORIES,
  MASTER_OPTION_GROUP_DESCRIPTIONS,
  MASTER_OPTION_GROUP_LABELS,
  isMasterOptionCategory,
} from "@/types/master-data";

type MasterDataGroup = MasterOptionCategory | "team_member";

const TEAM_GROUP = {
  key: "team_member" as const,
  label: "Tim / PIC",
  description: "Pool nama PIC untuk lead, inquiry, dan penugasan proyek.",
};

const GROUPS: { key: MasterDataGroup; label: string; description: string }[] = [
  ...MASTER_OPTION_CATEGORIES.map((category) => ({
    key: category,
    label: MASTER_OPTION_GROUP_LABELS[category],
    description: MASTER_OPTION_GROUP_DESCRIPTIONS[category],
  })),
  TEAM_GROUP,
];

function groupLabel(group: MasterDataGroup): string {
  return isMasterOptionCategory(group)
    ? MASTER_OPTION_GROUP_LABELS[group]
    : TEAM_GROUP.label;
}

/**
 * Pengelolaan master data & dropdown (US-005, FR-3) — khusus Super Admin.
 *
 * Delapan kategori `master_options` memakai CRUD + aktif/nonaktif. Tim/PIC
 * memakai `team_members`; karena skema belum punya flag aktif, tombol hapus
 * dijaga cek referensi (Q-015).
 */
export function MasterDataManager() {
  const [activeGroup, setActiveGroup] = useState<MasterDataGroup>("industry");
  const [options, setOptions] = useState<MasterOption[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editOption, setEditOption] = useState<MasterOption | null>(null);
  const [editMember, setEditMember] = useState<TeamMember | null>(null);
  const [value, setValue] = useState("");
  const [status, setStatus] = useState<TeamMemberStatus>("internal");
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<
    { kind: "option"; option: MasterOption } | { kind: "member"; member: TeamMember } | null
  >(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function refresh() {
    const [optionResult, memberResult] = await Promise.all([
      listAllMasterOptions(),
      listTeamMembers(),
    ]);
    if (optionResult.data) {
      setOptions(optionResult.data);
    }
    if (memberResult.data) {
      setMembers(memberResult.data);
    }
    if (optionResult.error || memberResult.error) {
      setLoadError(optionResult.error ?? memberResult.error);
    } else {
      setLoadError(null);
    }
    setLoading(false);
  }

  useEffect(() => {
    let cancelled = false;
    void Promise.all([listAllMasterOptions(), listTeamMembers()]).then(
      ([optionResult, memberResult]) => {
        if (cancelled) {
          return;
        }
        setOptions(optionResult.data ?? []);
        setMembers(memberResult.data ?? []);
        setLoadError(optionResult.error ?? memberResult.error);
        setLoading(false);
      }
    );
    return () => {
      cancelled = true;
    };
  }, []);

  const isTeamGroup = activeGroup === "team_member";
  const groupOptions = isMasterOptionCategory(activeGroup)
    ? options.filter((option) => option.category === activeGroup)
    : [];
  const activeCount = isTeamGroup
    ? members.length
    : groupOptions.filter((option) => option.isActive).length;

  function resetForm() {
    setEditOption(null);
    setEditMember(null);
    setValue("");
    setStatus("internal");
    setFormError(null);
  }

  function openCreate() {
    resetForm();
    setDialogOpen(true);
  }

  function openEditOption(option: MasterOption) {
    resetForm();
    setEditOption(option);
    setValue(option.value);
    setDialogOpen(true);
  }

  function openEditMember(member: TeamMember) {
    resetForm();
    setEditMember(member);
    setValue(member.name);
    setStatus(member.status);
    setDialogOpen(true);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setFormError(null);

    const result = isTeamGroup
      ? editMember
        ? await updateTeamMember(editMember.id, { name: value, status })
        : await createTeamMember({ name: value, status })
      : editOption
        ? await updateMasterOption(editOption.category, editOption.value, {
            value,
            isActive: editOption.isActive,
          })
        : isMasterOptionCategory(activeGroup)
          ? await createMasterOption({ category: activeGroup, value })
          : null;

    setPending(false);
    if (!result) {
      setFormError("Kategori master data tidak dikenal.");
      return;
    }
    if (result.error) {
      setFormError(result.error);
      return;
    }

    setDialogOpen(false);
    setNotice(
      isTeamGroup
        ? `Tim/PIC "${value.trim()}" berhasil disimpan.`
        : `Opsi "${value.trim()}" berhasil disimpan.`
    );
    await refresh();
  }

  async function handleToggle(option: MasterOption) {
    setActionError(null);
    setNotice(null);
    const result = await setMasterOptionActive(
      option.category,
      option.value,
      !option.isActive
    );
    if (result.error) {
      setActionError(result.error);
      return;
    }
    setNotice(
      `Opsi "${option.value}" ${option.isActive ? "dinonaktifkan" : "diaktifkan"}.`
    );
    await refresh();
  }

  async function handleDelete() {
    if (!deleteTarget) {
      return;
    }
    setDeleting(true);
    setDeleteError(null);
    const result =
      deleteTarget.kind === "option"
        ? await deleteMasterOption(
            deleteTarget.option.category,
            deleteTarget.option.value
          )
        : await deleteTeamMember(deleteTarget.member.id);
    setDeleting(false);
    if (result.error) {
      setDeleteError(result.error);
      return;
    }
    setNotice(
      deleteTarget.kind === "option"
        ? `Opsi "${deleteTarget.option.value}" dihapus.`
        : `Tim/PIC "${deleteTarget.member.name}" dihapus.`
    );
    setDeleteTarget(null);
    await refresh();
  }

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
        <p className="text-sm text-muted-foreground">Memuat master data...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl space-y-4 px-4 py-6 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Pengaturan · Super Admin</p>
          <h1 className="mt-1 text-2xl font-bold">Master Data</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kelola opsi dropdown terpusat agar tidak ada hardcode di tiap modul.
          </p>
        </div>
        <Button type="button" onClick={openCreate}>
          <PlusIcon aria-hidden="true" />
          {isTeamGroup ? "Tambah tim/PIC" : "Tambah opsi"}
        </Button>
      </div>

      {loadError ? (
        <p role="alert" className="text-sm text-destructive">
          {loadError}
        </p>
      ) : null}
      {actionError ? (
        <p role="alert" className="text-sm text-destructive">
          {actionError}
        </p>
      ) : null}
      {notice ? (
        <p role="status" className="text-sm text-emerald-600 dark:text-emerald-400">
          {notice}
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[16rem_1fr]">
        <Card className="h-fit">
          <CardHeader className="border-b">
            <CardTitle className="text-base">Kelompok</CardTitle>
            <CardDescription>9 kelompok dropdown.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-1 p-2 sm:grid-cols-2 lg:grid-cols-1">
            {GROUPS.map((group) => {
              const count =
                group.key === "team_member"
                  ? members.length
                  : options.filter((option) => option.category === group.key).length;
              const active = group.key === activeGroup;
              return (
                <button
                  key={group.key}
                  type="button"
                  onClick={() => {
                    setActiveGroup(group.key);
                    setActionError(null);
                    setNotice(null);
                  }}
                  className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                    active
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }`}
                  aria-pressed={active}
                >
                  <span className="truncate">{group.label}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      active ? "bg-primary-foreground/20" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="text-base">{groupLabel(activeGroup)}</CardTitle>
                <CardDescription>
                  {isTeamGroup
                    ? TEAM_GROUP.description
                    : MASTER_OPTION_GROUP_DESCRIPTIONS[activeGroup]}
                </CardDescription>
              </div>
              <Badge variant="outline">{activeCount} aktif</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isTeamGroup ? (
              members.length === 0 ? (
                <p className="p-6 text-sm text-muted-foreground">
                  Belum ada tim/PIC. Tambahkan nama untuk dipakai di dropdown penugasan.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead className="px-4">Nama</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell className="px-4 font-medium">{member.name}</TableCell>
                        <TableCell>
                          <Badge variant={member.status === "internal" ? "default" : "secondary"}>
                            {member.status === "internal" ? "Internal" : "External"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => openEditMember(member)}
                            >
                              <PencilIcon aria-hidden="true" /> Ubah
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Hapus ${member.name}`}
                              onClick={() => {
                                setDeleteError(null);
                                setDeleteTarget({ kind: "member", member });
                              }}
                            >
                              <Trash2Icon aria-hidden="true" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )
            ) : groupOptions.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground">
                Belum ada opsi untuk kelompok ini. Tambahkan opsi pertama.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="px-4">Nilai</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupOptions.map((option) => (
                    <TableRow key={`${option.category}:${option.value}`}>
                      <TableCell className="px-4 font-medium">{option.value}</TableCell>
                      <TableCell>
                        <Badge variant={option.isActive ? "default" : "outline"}>
                          {option.isActive ? "Aktif" : "Nonaktif"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => openEditOption(option)}
                          >
                            <PencilIcon aria-hidden="true" /> Ubah
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => void handleToggle(option)}
                          >
                            {option.isActive ? "Nonaktifkan" : "Aktifkan"}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Hapus ${option.value}`}
                            onClick={() => {
                              setDeleteError(null);
                              setDeleteTarget({ kind: "option", option });
                            }}
                          >
                            <Trash2Icon aria-hidden="true" />
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
      </div>

      <p className="text-sm text-muted-foreground">
        Opsi yang sudah dipakai modul lain tidak bisa dihapus; nonaktifkan agar tidak
        muncul di form. Perubahan langsung dipakai saat form dibuka.
        {isTeamGroup
          ? " Tim/PIC belum punya tombol nonaktifkan karena skema belum menyimpan status aktif (Q-015)."
          : ""}
      </p>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            resetForm();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editOption || editMember ? "Ubah" : "Tambah"} {groupLabel(activeGroup)}
            </DialogTitle>
            <DialogDescription>
              {isTeamGroup
                ? "Nama dan status internal/external. Nama harus unik."
                : "Nilai ini akan muncul di dropdown terkait. Nama harus unik per kategori."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="master-value" className="text-sm font-medium">
                {isTeamGroup ? "Nama tim/PIC" : "Nilai opsi"}
              </label>
              <Input
                id="master-value"
                value={value}
                onChange={(event) => setValue(event.target.value)}
                placeholder={isTeamGroup ? "Contoh: Nabila" : "Contoh: Teknologi"}
                maxLength={isTeamGroup ? 100 : 80}
                required
              />
            </div>
            {isTeamGroup ? (
              <div className="space-y-2">
                <label htmlFor="master-status" className="text-sm font-medium">
                  Status
                </label>
                <select
                  id="master-status"
                  className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring"
                  value={status}
                  onChange={(event) =>
                    setStatus(event.target.value as TeamMemberStatus)
                  }
                >
                  <option value="internal">Internal</option>
                  <option value="external">External</option>
                </select>
              </div>
            ) : null}
            {formError ? (
              <p role="alert" className="text-sm text-destructive">
                {formError}
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

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
            setDeleteError(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus data master?</DialogTitle>
            <DialogDescription>
              {deleteTarget?.kind === "option"
                ? `Opsi "${deleteTarget.option.value}" akan dihapus permanen. Jika sedang dipakai, nonaktifkan sebagai gantinya.`
                : deleteTarget?.kind === "member"
                  ? `Tim/PIC "${deleteTarget.member.name}" akan dihapus permanen bila belum dipakai.`
                  : ""}
            </DialogDescription>
          </DialogHeader>
          {deleteError ? (
            <p role="alert" className="text-sm text-destructive">
              {deleteError}
            </p>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDeleteTarget(null);
                setDeleteError(null);
              }}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleting}
              onClick={() => void handleDelete()}
            >
              {deleting ? "Menghapus..." : "Hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
