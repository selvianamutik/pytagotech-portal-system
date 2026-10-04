import { listPublications } from "@/services/publications";
import type { MetricInput, PostMetric } from "@/types/metric";
import { FINAL_UNLOCK_ROLES } from "@/types/metric";
import type { ServiceResult } from "@/services/result";

/**
 * Lapisan analytics performa posting (US-035, FR-25).
 * Dedup KPI Final + kunci edit (kecuali role yang diizinkan).
 */

let metricStore: PostMetric[] = [];

/** Mengembalikan state mock ke awal — dipakai test dan demo. */
export function resetMockMetrics(): void {
  metricStore = [];
}

function validateMetricInput(input: MetricInput): string | null {
  const fields: [string, number][] = [
    ["Views/Impresi", input.views],
    ["Reach", input.reach],
    ["Likes", input.likes],
    ["Comments", input.comments],
    ["Shares", input.shares],
    ["Saves", input.saves],
  ];
  for (const [label, value] of fields) {
    if (!Number.isFinite(value) || value < 0 || !Number.isInteger(value)) {
      return `${label} harus bilangan bulat ≥ 0.`;
    }
  }
  if (input.snapshot !== "Monitoring" && input.snapshot !== "Final") {
    return "Snapshot harus Monitoring atau Final.";
  }
  return null;
}

function canUnlockFinal(roles: string[]): boolean {
  return roles.some((role) => (FINAL_UNLOCK_ROLES as readonly string[]).includes(role));
}

export async function listMetrics(
  publicationId?: string
): Promise<ServiceResult<PostMetric[]>> {
  const items = publicationId
    ? metricStore.filter((metric) => metric.publicationId === publicationId)
    : metricStore;
  return {
    data: [...items]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((metric) => ({ ...metric })),
    error: null,
  };
}

export async function recordMetric(
  publicationId: string,
  input: MetricInput,
  recordedBy: string
): Promise<ServiceResult<PostMetric>> {
  const { data: publications } = await listPublications();
  if (!(publications ?? []).some((publication) => publication.id === publicationId)) {
    return { data: null, error: "Publikasi tidak ditemukan." };
  }
  const validationError = validateMetricInput(input);
  if (validationError) {
    return { data: null, error: validationError };
  }
  if (
    input.snapshot === "Final" &&
    metricStore.some(
      (metric) => metric.publicationId === publicationId && metric.snapshot === "Final"
    )
  ) {
    return { data: null, error: "Publikasi ini sudah memiliki snapshot KPI Final." };
  }
  const metric: PostMetric = {
    id: `MET-${String(metricStore.length + 1).padStart(3, "0")}`,
    publicationId,
    ...input,
    recordedBy,
    createdAt: new Date().toISOString(),
  };
  metricStore.push(metric);
  return { data: { ...metric }, error: null };
}

export async function updateMetric(
  metricId: string,
  input: MetricInput,
  actorRoles: string[]
): Promise<ServiceResult<PostMetric>> {
  const metric = metricStore.find((item) => item.id === metricId);
  if (!metric) {
    return { data: null, error: "Metrik tidak ditemukan." };
  }
  if (metric.snapshot === "Final" && !canUnlockFinal(actorRoles)) {
    return {
      data: null,
      error: "Snapshot Final terkunci. Hanya Super Admin / Leader yang dapat mengubah.",
    };
  }
  const validationError = validateMetricInput(input);
  if (validationError) {
    return { data: null, error: validationError };
  }
  if (
    input.snapshot === "Final" &&
    metric.snapshot !== "Final" &&
    metricStore.some(
      (item) =>
        item.id !== metricId &&
        item.publicationId === metric.publicationId &&
        item.snapshot === "Final"
    )
  ) {
    return { data: null, error: "Publikasi ini sudah memiliki snapshot KPI Final." };
  }
  Object.assign(metric, input);
  return { data: { ...metric }, error: null };
}

export async function deleteMetric(
  metricId: string,
  actorRoles: string[]
): Promise<ServiceResult<true>> {
  const index = metricStore.findIndex((item) => item.id === metricId);
  if (index === -1) {
    return { data: null, error: "Metrik tidak ditemukan." };
  }
  if (metricStore[index]?.snapshot === "Final" && !canUnlockFinal(actorRoles)) {
    return {
      data: null,
      error: "Snapshot Final terkunci. Hanya Super Admin / Leader yang dapat menghapus.",
    };
  }
  metricStore.splice(index, 1);
  return { data: true, error: null };
}
