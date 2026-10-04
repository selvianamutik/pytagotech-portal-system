import { mockDevelopers } from "@/mocks/developers";
import type { Developer, DeveloperInput } from "@/types/developer";
import { isEmploymentStatus } from "@/types/developer";
import type { ServiceResult } from "@/services/result";

/** Lapisan master data developer (dropdown assignee task/fitur). */

let developerStore: Developer[] = structuredClone(mockDevelopers);

/** Mengembalikan state mock ke awal — dipakai test dan demo. */
export function resetMockDevelopers(): void {
  developerStore = structuredClone(mockDevelopers);
}

export async function listDevelopers(): Promise<ServiceResult<Developer[]>> {
  return {
    data: [...developerStore]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((developer) => ({ ...developer })),
    error: null,
  };
}

/** Nama developer untuk dropdown penugasan. */
export async function listDeveloperNames(): Promise<ServiceResult<string[]>> {
  const { data } = await listDevelopers();
  return { data: (data ?? []).map((developer) => developer.name), error: null };
}

export async function createDeveloper(
  input: DeveloperInput
): Promise<ServiceResult<Developer>> {
  if (input.name.trim().length === 0) {
    return { data: null, error: "Nama developer wajib diisi." };
  }
  if (!isEmploymentStatus(input.status)) {
    return { data: null, error: "Status harus internal atau external." };
  }
  if (
    developerStore.some(
      (developer) => developer.name.toLowerCase() === input.name.trim().toLowerCase()
    )
  ) {
    return { data: null, error: "Nama developer sudah terdaftar." };
  }
  const developer: Developer = {
    id: `DEV-${String(developerStore.length + 1).padStart(3, "0")}`,
    name: input.name.trim(),
    status: input.status,
    createdAt: new Date().toISOString(),
  };
  developerStore.push(developer);
  return { data: { ...developer }, error: null };
}

export async function updateDeveloper(
  developerId: string,
  input: DeveloperInput
): Promise<ServiceResult<Developer>> {
  const developer = developerStore.find((item) => item.id === developerId);
  if (!developer) {
    return { data: null, error: "Developer tidak ditemukan." };
  }
  if (input.name.trim().length === 0) {
    return { data: null, error: "Nama developer wajib diisi." };
  }
  if (!isEmploymentStatus(input.status)) {
    return { data: null, error: "Status harus internal atau external." };
  }
  developer.name = input.name.trim();
  developer.status = input.status;
  return { data: { ...developer }, error: null };
}

export async function deleteDeveloper(developerId: string): Promise<ServiceResult<true>> {
  const index = developerStore.findIndex((item) => item.id === developerId);
  if (index === -1) {
    return { data: null, error: "Developer tidak ditemukan." };
  }
  developerStore.splice(index, 1);
  return { data: true, error: null };
}
