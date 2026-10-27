"use client";

import { useEffect, useState } from "react";
import { PlusIcon, Trash2Icon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { FormSelect } from "@/components/crm/lead-table";
import { useMasterOptions } from "@/hooks/use-master-options";
import {
  createEvaluation,
  deleteEvaluation,
  listEvaluations,
} from "@/services/evaluations";
import { KIST_CATEGORIES } from "@/types/evaluation";

const CATEGORY_STYLES: Record<string, string> = {
  Keep: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
  Improve:
    "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-300",
  Stop: "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300",
  Test: "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950 dark:text-violet-300",
};

/**
 * Evaluasi strategi KIST (US-040, FR-29): Keep/Improve/Stop/Test
 * + hipotesis dkk. untuk Test + filter periode & lini bisnis.
 */
export function KistBoard() {
  const { options } = useMasterOptions();
  const [items, setItems] = useState<Awaited<ReturnType<typeof listEvaluations>>["data"]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [period, setPeriod] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formCategory, setFormCategory] = useState<string>("Keep");
  const [pillar, setPillar] = useState("");
  const [format, setFormat] = useState("");
  const [formBrand, setFormBrand] = useState("");
  const [formPeriod, setFormPeriod] = useState("");
  const [summary, setSummary] = useState("");
  const [evidence, setEvidence] = useState("");
  const [hypothesis, setHypothesis] = useState("");
  const [actionPlan, setActionPlan] = useState("");
  const [successTarget, setSuccessTarget] = useState("");
  const [businessImpact, setBusinessImpact] = useState("");
  const [result, setResult] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const { data } = await listEvaluations({
      category: category || undefined,
      brand: brand || undefined,
      period: period || undefined,
    });
    if (data) {
      setItems(data);
    }
  }

  useEffect(() => {
    let cancelled = false;
    void listEvaluations({
      category: category || undefined,
      brand: brand || undefined,
      period: period || undefined,
    }).then(({ data }) => {
      if (!cancelled) {
        setItems(data ?? []);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [category, brand, period]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const { error: createError } = await createEvaluation({
      category: formCategory,
      pillar,
      format,
      brand: formBrand,
      period: formPeriod,
      summary,
      evidence,
      hypothesis,
      actionPlan,
      successTarget,
      businessImpact,
      result,
    });
    setPending(false);
    if (createError) {
      setError(createError);
      return;
    }
    setDialogOpen(false);
    await refresh();
  }

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
        <p className="text-sm text-muted-foreground">Memuat evaluasi...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl space-y-4 px-4 py-6 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Sosmed · Strategi</p>
          <h1 className="mt-1 text-2xl font-bold">Evaluasi Strategi KIST</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Keep · Improve · Stop · Test — keputusan berbasis data.
          </p>
        </div>
        <Button type="button" onClick={() => setDialogOpen(true)}>
          <PlusIcon aria-hidden="true" /> Tambah evaluasi
        </Button>
      </div>

      <div className="grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-3">
        <FormSelect id="kist-category" label="Kategori" value={category} onChange={setCategory} options={KIST_CATEGORIES} />
        <FormSelect id="kist-brand" label="Lini bisnis" value={brand} onChange={setBrand} options={options.brand} />
        <div className="space-y-2">
          <label htmlFor="kist-period" className="text-sm font-medium">
            Periode
          </label>
          <Input id="kist-period" type="month" value={period} onChange={(event) => setPeriod(event.target.value)} />
        </div>
      </div>

      {items?.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">Belum ada evaluasi pada filter ini.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {(items ?? []).map((item) => (
            <Card key={item.id}>
              <CardContent className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className={CATEGORY_STYLES[item.category]}>
                    {item.category}
                  </Badge>
                  <span className="font-mono text-xs text-muted-foreground">
                    {item.id} · {item.period} · {item.brand}
                  </span>
                </div>
                <p className="text-sm font-medium">{item.summary}</p>
                <p className="text-xs text-muted-foreground">
                  {item.pillar} · {item.format} · Bukti: {item.evidence}
                </p>
                {item.category === "Test" ? (
                  <dl className="space-y-1 rounded-lg bg-muted/50 p-2 text-xs">
                    <div><dt className="font-medium">Hipotesis</dt><dd>{item.hypothesis}</dd></div>
                    {item.actionPlan ? (<div><dt className="font-medium">Rencana aksi</dt><dd>{item.actionPlan}</dd></div>) : null}
                    {item.successTarget ? (<div><dt className="font-medium">Target sukses</dt><dd>{item.successTarget}</dd></div>) : null}
                    {item.businessImpact ? (<div><dt className="font-medium">Dampak bisnis</dt><dd>{item.businessImpact}</dd></div>) : null}
                    {item.result ? (<div><dt className="font-medium">Hasil</dt><dd>{item.result}</dd></div>) : null}
                  </dl>
                ) : null}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    void deleteEvaluation(item.id).then(() => void refresh())
                  }
                >
                  <Trash2Icon aria-hidden="true" /> Hapus
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Evaluasi baru</DialogTitle>
            <DialogDescription>KIST + tautan pillar/format + bukti.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            <FormSelect id="eval-category" label="Kategori" value={formCategory} onChange={setFormCategory} options={KIST_CATEGORIES} />
            <FormSelect id="eval-brand" label="Lini bisnis" value={formBrand} onChange={setFormBrand} options={options.brand} required />
            <FormSelect id="eval-pillar" label="Pillar" value={pillar} onChange={setPillar} options={options.pillar} required />
            <div className="space-y-2">
              <label htmlFor="eval-format" className="text-sm font-medium">Format</label>
              <Input id="eval-format" placeholder="Carousel, Reels, ..." value={format} onChange={(event) => setFormat(event.target.value)} />
            </div>
            <div className="space-y-2">
              <label htmlFor="eval-period" className="text-sm font-medium">Periode</label>
              <Input id="eval-period" type="month" value={formPeriod} onChange={(event) => setFormPeriod(event.target.value)} required />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label htmlFor="eval-summary" className="text-sm font-medium">Ringkasan</label>
              <Input id="eval-summary" value={summary} onChange={(event) => setSummary(event.target.value)} required />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label htmlFor="eval-evidence" className="text-sm font-medium">Data pendukung</label>
              <Input id="eval-evidence" value={evidence} onChange={(event) => setEvidence(event.target.value)} />
            </div>
            {formCategory === "Test" ? (
              <>
                <div className="space-y-2 sm:col-span-2">
                  <label htmlFor="eval-hypothesis" className="text-sm font-medium">Hipotesis (wajib)</label>
                  <Input id="eval-hypothesis" value={hypothesis} onChange={(event) => setHypothesis(event.target.value)} required />
                </div>
                <div className="space-y-2">
                  <label htmlFor="eval-action" className="text-sm font-medium">Rencana aksi</label>
                  <Input id="eval-action" value={actionPlan} onChange={(event) => setActionPlan(event.target.value)} />
                </div>
                <div className="space-y-2">
                  <label htmlFor="eval-target" className="text-sm font-medium">Target sukses</label>
                  <Input id="eval-target" value={successTarget} onChange={(event) => setSuccessTarget(event.target.value)} />
                </div>
                <div className="space-y-2">
                  <label htmlFor="eval-impact" className="text-sm font-medium">Dampak bisnis</label>
                  <Input id="eval-impact" value={businessImpact} onChange={(event) => setBusinessImpact(event.target.value)} />
                </div>
                <div className="space-y-2">
                  <label htmlFor="eval-result" className="text-sm font-medium">Hasil</label>
                  <Input id="eval-result" value={result} onChange={(event) => setResult(event.target.value)} />
                </div>
              </>
            ) : null}
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
