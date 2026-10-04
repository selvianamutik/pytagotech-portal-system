import { beforeEach, describe, expect, it } from "vitest";

import {
  createDeveloper,
  deleteDeveloper,
  listDeveloperNames,
  listDevelopers,
  resetMockDevelopers,
  updateDeveloper,
} from "@/services/developers";

beforeEach(() => {
  resetMockDevelopers();
});

describe("developers", () => {
  it("seed 4 dengan status internal/external", async () => {
    const { data } = await listDevelopers();

    expect(data).toHaveLength(4);
    expect(data?.find((item) => item.name === "Dimas (Freelance)")?.status).toBe("external");
    expect((await listDeveloperNames()).data).toContain("Nabila");
  });

  it("CRUD dengan validasi + anti duplikat", async () => {
    const created = await createDeveloper({ name: "Bimo", status: "external" });
    expect(created.error).toBeNull();

    expect((await createDeveloper({ name: "bimo", status: "internal" })).error).toMatch(
      /sudah terdaftar/
    );
    expect((await createDeveloper({ name: "X", status: "kontrak" })).error).toMatch(
      /internal atau external/
    );

    expect((await updateDeveloper(created.data!.id, { name: "Bimo F", status: "external" })).data?.name).toBe("Bimo F");
    expect((await deleteDeveloper(created.data!.id)).error).toBeNull();
    expect((await deleteDeveloper("DEV-999")).error).toBe("Developer tidak ditemukan.");
  });
});
