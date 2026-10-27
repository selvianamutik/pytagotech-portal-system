"use client";

import { useEffect, useState } from "react";
import { PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { FormSelect } from "@/components/crm/lead-table";
import { useMasterOptions } from "@/hooks/use-master-options";
import { listGrowth, recordGrowth } from "@/services/growth";
import { netGrowth, NET_GROWTH_FORMULA, type AccountGrowth } from "@/types/growth";

/**
 * Pertumbuhan akun (US-036): input bulanan per platform + Net Growth
 * otomatis + grafik tren bulanan (CSS murni).
 */
export function GrowthManager() {
  const { options } = useMasterOptions();
  const [platform, setPlatform] = useState<string>("Instagram");
  const [entries, setEntries] = useState<AccountGrowth[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [month, setMonth] = useState("");
  const [followersStart, setFollowersStart] = useState("");
  const [followersGained, setFollowersGained] = useState("");
  const [unfollows, setUnfollows] = useState("");
  const [reach, setReach] = useState("");
  const [profileVisits, setProfileVisits] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh(selected: string) {
    const { data } = await listGrowth(selected);
    if (data) {
      setEntries(data);
    }
  }

  useEffect(() => {
    let cancelled = false;
    void listGrowth(platform || undefined).then(({ data }) => {
      if (!cancelled) {
        setEntries(data ?? []);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [platform]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const { error: recordError } = await recordGrowth({
      platform,
      month,
      followersStart: Number(followersStart),
      followersGained: Number(followersGained),
      unfollows: Number(unfollows),
      reach: Number(reach),
      profileVisits: Number(profileVisits),
    });
    setPending(false);
    if (recordError) {
      setError(recordError);
      return;
    }
    setDialogOpen(false);
    await refresh(platform);
  }

  const maxNet = Math.max(1, ...entries.map((entry) => Math.abs(netGrowth(entry))));

  return (
    <main className="mx-auto w-full max-w-6xl space-y-4 px-4 py-6 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Sosmed · Analytics</p>
          <h1 className="mt-1 text-2xl font-bold">Pertumbuhan Akun</h1>
          <p className="mt-1 text-sm text-muted-foreground" title={NET_GROWTH_FORMULA}>
            {NET_GROWTH_FORMULA}
          </p>
        </div>
        <Button type="button" onClick={() => setDialogOpen(true)}>
          <PlusIcon aria-hidden="true" /> Catat bulan
        </Button>
      </div>

      <div className="max-w-xs">
        <FormSelect
          id="growth-platform"
          label="Platform"
          value={platform}
          onChange={setPlatform}
          options={options.platform}
        />
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Memuat data...</p>
      ) : (
        <>
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="text-base">Tren Net Growth per bulan (%)</CardTitle>
            </CardHeader>
            <CardContent>
              {entries.length === 0 ? (
                <p className="text-sm text-muted-foreground">Belum ada data platform ini.</p>
              ) : (
                <div className="flex h-40 items-end gap-3" role="img" aria-label="Grafik tren net growth">
                  {entries.map((entry) => {
                    const value = netGrowth(entry);
                    const height = Math.max(4, (Math.abs(value) / maxNet) * 100);
                    return (
                      <div key={entry.id} className="flex flex-1 flex-col items-center gap-1">
                        <span className="text-xs font-medium">{value.toFixed(1)}%</span>
                        <div
                          className={`w-full rounded-t ${value >= 0 ? "bg-emerald-500" : "bg-red-500"}`}
                          style={{ height: `${height}%`, maxHeight: "100%" }}
                          title={`${entry.month}: ${value.toFixed(2)}%`}
                        />
                        <span className="font-mono text-[10px] text-muted-foreground">
                          {entry.month.slice(2)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="px-4">Bulan</TableHead>
                    <TableHead>Awal</TableHead>
                    <TableHead>Masuk</TableHead>
                    <TableHead>Unfollows</TableHead>
                    <TableHead>Net Growth</TableHead>
                    <TableHead>Reach</TableHead>
                    <TableHead>Profile Visits</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="px-4 font-mono">{entry.month}</TableCell>
                      <TableCell>{entry.followersStart.toLocaleString("id-ID")}</TableCell>
                      <TableCell>{entry.followersGained.toLocaleString("id-ID")}</TableCell>
                      <TableCell>{entry.unfollows.toLocaleString("id-ID")}</TableCell>
                      <TableCell className="font-medium" title={NET_GROWTH_FORMULA}>
                        {netGrowth(entry).toFixed(2)}%
                      </TableCell>
                      <TableCell>{entry.reach.toLocaleString("id-ID")}</TableCell>
                      <TableCell>{entry.profileVisits.toLocaleString("id-ID")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Data bulan baru — {platform}</DialogTitle>
            <DialogDescription>Followers awal/masuk, unfollows, reach, visits.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            {(
              [
                ["month", "Bulan (YYYY-MM)", month, setMonth, "2026-10"],
                ["start", "Followers Awal", followersStart, setFollowersStart, "0"],
                ["gained", "Followers Masuk", followersGained, setFollowersGained, "0"],
                ["unfollows", "Unfollows", unfollows, setUnfollows, "0"],
                ["reach", "Account Reach", reach, setReach, "0"],
                ["visits", "Profile Visits", profileVisits, setProfileVisits, "0"],
              ] as const
            ).map(([key, label, value, setter, placeholder]) => (
              <div key={key} className="space-y-2">
                <label htmlFor={`growth-${key}`} className="text-sm font-medium">
                  {label}
                </label>
                <Input
                  id={`growth-${key}`}
                  type={key === "month" ? "month" : "number"}
                  min={key === "month" ? undefined : "0"}
                  value={value}
                  placeholder={placeholder}
                  onChange={(event) => setter(event.target.value)}
                  required
                />
              </div>
            ))}
            {error ? (
              <p role="alert" className="text-sm text-destructive sm:col-span-2">
                {error}
              </p>
            ) : null}
            <DialogFooter className="sm:col-span-2">
              <Button type="submit" disabled={pending}>
                {pending ? "Menyimpan..." : "Simpan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}
